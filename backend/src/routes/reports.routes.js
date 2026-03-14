import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const router = express.Router();

// Revenue by plan
router.get('/revenue-by-plan', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }
    
    const revenueByPlan = await prisma.payment.groupBy({
      by: ['planId'],
      where,
      _sum: {
        amount: true
      },
      _count: true
    });
    
    const plansData = await Promise.all(
      revenueByPlan.map(async (item) => {
        const plan = await prisma.plan.findUnique({
          where: { id: item.planId }
        });
        return {
          planName: plan.name,
          revenue: parseFloat(item._sum.amount),
          count: item._count
        };
      })
    );
    
    res.json(plansData);
  } catch (error) {
    console.error('Error fetching revenue by plan:', error);
    res.status(500).json({ error: 'Failed to fetch revenue report' });
  }
});

// Defaulters (members with overdue payments)
router.get('/defaulters', authenticate, async (req, res) => {
  try {
    const today = new Date();
    
    const defaulters = await prisma.member.findMany({
      where: {
        status: 'INACTIVE',
        expirationDate: {
          lt: today
        }
      },
      include: {
        plan: true
      },
      orderBy: {
        expirationDate: 'asc'
      }
    });
    
    res.json(defaulters);
  } catch (error) {
    console.error('Error fetching defaulters:', error);
    res.status(500).json({ error: 'Failed to fetch defaulters report' });
  }
});

// Member growth
router.get('/member-growth', authenticate, async (req, res) => {
  try {
    const { months = 12 } = req.query;
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    
    const growth = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as count
      FROM "Member"
      WHERE "createdAt" >= ${startDate}
      GROUP BY month
      ORDER BY month ASC
    `;
    
    res.json(growth.map(g => ({
      month: g.month,
      count: parseInt(g.count)
    })));
  } catch (error) {
    console.error('Error fetching member growth:', error);
    res.status(500).json({ error: 'Failed to fetch member growth report' });
  }
});

// Low frequency members
router.get('/low-frequency', authenticate, async (req, res) => {
  try {
    const { days = 30, maxCheckins = 5 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const activeMembers = await prisma.member.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        checkins: {
          where: {
            checkinDatetime: {
              gte: startDate
            }
          }
        },
        plan: true
      }
    });
    
    const lowFrequency = activeMembers
      .filter(m => m.checkins.length <= parseInt(maxCheckins))
      .map(m => ({
        id: m.id,
        name: m.name,
        phone: m.phone,
        plan: m.plan?.name,
        checkinCount: m.checkins.length,
        lastCheckin: m.checkins[0]?.checkinDatetime || null
      }));
    
    res.json(lowFrequency);
  } catch (error) {
    console.error('Error fetching low frequency members:', error);
    res.status(500).json({ error: 'Failed to fetch low frequency report' });
  }
});

// Export reports (PDF or Excel)
router.get('/export', authenticate, async (req, res) => {
  try {
    const formatType = req.query.format || 'pdf'; // 'pdf' or 'xls'

    // Gather data for the report
    
    // 1. Revenue by plan
    const revenueByPlan = await prisma.payment.groupBy({
      by: ['planId'],
      _sum: {
        amount: true
      },
      _count: true
    });
    
    const plansData = await Promise.all(
      revenueByPlan.map(async (item) => {
        const plan = await prisma.plan.findUnique({
          where: { id: item.planId }
        });
        return {
          Plano: plan?.name || 'Desconhecido',
          'Receita (MZN)': parseFloat(item._sum.amount),
          'Qtd. Pagamentos': item._count
        };
      })
    );
    
    // 2. Defaulters
    const today = new Date();
    const defaultersData = await prisma.member.findMany({
      where: {
        status: 'INACTIVE',
        expirationDate: { lt: today }
      },
      include: { plan: true },
      orderBy: { expirationDate: 'asc' }
    });
    
    const defaultersMapped = defaultersData.map(m => ({
      'Nome': m.name,
      'Telefone': m.phone,
      'Plano': m.plan?.name || 'N/A',
      'Expirou em': new Date(m.expirationDate).toLocaleDateString('pt-PT')
    }));

    // 3. System Stats
    const activeMembers = await prisma.member.count({ where: { status: 'ACTIVE' } });
    const inactiveMembers = await prisma.member.count({ where: { status: 'INACTIVE' } });
    const totalProducts = await prisma.product.count({ where: { status: true } });

    // Handle XLS format
    if (formatType === 'xls') {
      const workbook = new ExcelJS.Workbook();
      
      const logoPath = path.join(process.cwd(), 'src', 'assets', 'logo.png');
      const hasLogo = fs.existsSync(logoPath);
      let logoId = null;
      if (hasLogo) {
        logoId = workbook.addImage({
          filename: logoPath,
          extension: 'png',
        });
      }

      // Receita por Plano sheet
      const wsPlans = workbook.addWorksheet('Receita por Plano');
      if (hasLogo) {
        wsPlans.addImage(logoId, 'A1:B3');
      }
      wsPlans.columns = [
        { header: 'Plano', key: 'Plano', width: 20 },
        { header: 'Receita (MZN)', key: 'Receita (MZN)', width: 15 },
        { header: 'Qtd. Pagamentos', key: 'Qtd. Pagamentos', width: 15 }
      ];
      plansData.forEach(p => wsPlans.addRow(p));
      
      // Inadimplentes (Defaulters) sheet
      const wsDefaulters = workbook.addWorksheet('Membros em Atraso');
      if (hasLogo) {
        wsDefaulters.addImage(logoId, 'A1:B3');
      }
      wsDefaulters.columns = [
        { header: 'Nome', key: 'Nome', width: 30 },
        { header: 'Telefone', key: 'Telefone', width: 20 },
        { header: 'Plano', key: 'Plano', width: 20 },
        { header: 'Expirou em', key: 'Expirou em', width: 15 }
      ];
      defaultersMapped.forEach(m => wsDefaulters.addRow(m));
      
      // Estatísticas Gerais sheet
      const wsStats = workbook.addWorksheet('Resumo Diário');
      if (hasLogo) {
        wsStats.addImage(logoId, 'A1:B3');
      }
      wsStats.columns = [
        { header: 'Membros Ativos', key: 'Membros Ativos', width: 15 },
        { header: 'Membros Inativos', key: 'Membros Inativos', width: 15 },
        { header: 'Produtos Ativos', key: 'Produtos Ativos', width: 15 }
      ];
      wsStats.addRow({ 'Membros Ativos': activeMembers, 'Membros Inativos': inactiveMembers, 'Produtos Ativos': totalProducts });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=relatorio-ginasio.xlsx');
      
      await workbook.xlsx.write(res);
      return res.end();
    }
    
    // Handle PDF format
    if (formatType === 'pdf') {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=relatorio-ginasio.pdf');
      
      doc.pipe(res);
      
      const primaryColor = '#FF6B00';
      const textColor = '#1F2937';
      const grayColor = '#6B7280';
      
      // Logo (if exists)
      const logoPath = path.join(process.cwd(), 'src', 'assets', 'logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 40 });
      }
      
      doc.fillColor(textColor).fontSize(20).font('Helvetica-Bold').text('CROSSTRAINING GYM', 100, 45);
      doc.fillColor(grayColor).fontSize(10).font('Helvetica').text(`Relatório Gerado: ${format(new Date(), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: pt })}`, 100, 70);
      
      doc.moveTo(50, 100).lineTo(545, 100).strokeColor('#E5E7EB').lineWidth(1).stroke();
      
      // 1. Resumo Geral
      doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold').text('Resumo Geral', 50, 120);
      doc.fillColor(textColor).fontSize(12).font('Helvetica')
         .text(`Membros Ativos: ${activeMembers}`, 50, 150)
         .text(`Membros Inativos/Atraso: ${inactiveMembers}`, 50, 170)
         .text(`Produtos Registados: ${totalProducts}`, 50, 190);
         
      // 2. Receita por plano
      doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold').text('Receita por Plano', 50, 230);
      let y = 260;
      doc.fillColor(grayColor).fontSize(10).font('Helvetica-Bold')
         .text('Plano', 50, y)
         .text('Qtd.', 250, y)
         .text('Receita (MZN)', 350, y);
         
      y += 20;
      doc.font('Helvetica');
      let totalRev = 0;
      plansData.forEach(p => {
        doc.fillColor(textColor)
           .text(p.Plano, 50, y)
           .text(p['Qtd. Pagamentos'], 250, y)
           .text(p['Receita (MZN)'].toLocaleString('pt-PT'), 350, y);
        totalRev += p['Receita (MZN)'];
        y += 20;
      });
      doc.moveTo(50, y).lineTo(545, y).strokeColor('#E5E7EB').lineWidth(1).stroke();
      y += 10;
      doc.font('Helvetica-Bold').text('Total', 50, y).text(totalRev.toLocaleString('pt-PT') + ' MZN', 350, y);
      
      // 3. Membros em Atraso (Limit to top 15)
      y += 40;
      if (y > 700) { doc.addPage(); y = 50; }
      
      doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold').text('Membros em Atraso (Amostra)', 50, y);
      y += 30;
      doc.fillColor(grayColor).fontSize(10).font('Helvetica-Bold')
         .text('Nome', 50, y)
         .text('Telefone', 250, y)
         .text('Expirou', 400, y);
         
      y += 20;
      doc.font('Helvetica');
      
      const defaultersSubset = defaultersMapped.slice(0, 15);
      if (defaultersSubset.length === 0) {
        doc.fillColor(textColor).text('Nenhum membro em atraso.', 50, y);
      } else {
        defaultersSubset.forEach(m => {
          if (y > 750) { doc.addPage(); y = 50; }
          doc.fillColor(textColor)
             .text(m.Nome.substring(0, 25), 50, y)
             .text(m.Telefone, 250, y)
             .text(m['Expirou em'], 400, y);
          y += 20;
        });
      }
      
      doc.end();
    }
  } catch (error) {
    console.error('Error generating report export:', error);
    res.status(500).json({ error: 'Failed to generate exported report' });
  }
});

export default router;
