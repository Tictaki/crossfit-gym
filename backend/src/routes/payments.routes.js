import express from 'express';
import prisma from '../utils/prisma.js';
import xlsx from 'xlsx';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth.js';
import { generateReceiptPDF } from '../utils/pdfGenerator.js';
import { notify } from '../utils/notifier.js';

const router = express.Router();

// List payments with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { memberId, startDate, endDate, paymentMethod, page = 1, limit = 50 } = req.query;
    
    const where = {};
    
    if (memberId) {
      where.memberId = memberId;
    }
    
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }
    
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          member: { select: { name: true, phone: true } },
          plan: { select: { name: true } },
          user: { select: { name: true } }
        },
        orderBy: { paymentDate: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.payment.count({ where })
    ]);
    
    res.json({
      payments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Register payment with validations and audit
router.post('/', authenticate, async (req, res) => {
  try {
    const { memberId, planId, amount, paymentMethod, customDiscount } = req.body;
    
    // Validate inputs
    if (!memberId || !planId || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    // Get member
    const member = await prisma.member.findUnique({
      where: { id: memberId }
    });
    
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    // Validate duplicate payment (same member, same plan, same day)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const existingPayment = await prisma.payment.findFirst({
      where: {
        memberId,
        planId,
        paymentDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        refunded: false
      }
    });
    
    if (existingPayment) {
      return res.status(400).json({ 
        error: 'Duplicate payment detected. This member already has a payment for this plan today.',
        existingPaymentId: existingPayment.id
      });
    }
    
    // Validate custom discount
    let finalAmount = parseFloat(plan.price);
    if (customDiscount) {
      const discount = parseFloat(customDiscount);
      const maxDiscount = parseFloat(plan.price) * 0.5; // 50% max
      
      if (discount > maxDiscount) {
        return res.status(400).json({ 
          error: `Desconto máximo permitido: ${maxDiscount} MZN (50% do valor do plano)` 
        });
      }
      
      if (discount < 0) {
        return res.status(400).json({ error: 'Desconto não pode ser negativo' });
      }
      
      finalAmount = discount;
    }
    
    // Validate payment amount
    const MAX_SINGLE_PAYMENT = 500000; // MZN
    if (finalAmount > MAX_SINGLE_PAYMENT) {
      return res.status(400).json({ 
        error: `Valor máximo por transação: ${MAX_SINGLE_PAYMENT} MZN` 
      });
    }
    
    // Calculate new expiration date
    const startDate = member.expirationDate && member.expirationDate > today 
      ? member.expirationDate 
      : today;
    
    const expirationDate = new Date(startDate);
    expirationDate.setDate(expirationDate.getDate() + plan.durationDays);
    
    // Create payment and update member in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          memberId,
          planId,
          amount: finalAmount,
          paymentMethod,
          processedBy: req.user.id
        },
        include: {
          member: true,
          plan: true,
          user: { select: { name: true } }
        }
      });
      
      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          paymentId: payment.id,
          invoiceNumber: payment.receiptNumber,
          issuedBy: req.user.id,
          status: 'ISSUED'
        }
      });
      
      // Create audit log
      await tx.paymentAudit.create({
        data: {
          paymentId: payment.id,
          action: 'CREATED',
          details: `Payment created: ${finalAmount} MZN via ${paymentMethod}`,
          performedBy: req.user.id
        }
      });
      
      // Update member
      const updatedMember = await tx.member.update({
        where: { id: memberId },
        data: {
          planId,
          startDate: member.startDate || today,
          expirationDate,
          status: 'ACTIVE'
        }
      });
      
      return { payment, invoice, updatedMember };
    });
    
    res.status(201).json({
      payment: result.payment,
      invoice: result.invoice,
      message: 'Payment registered successfully'
    });

    // Notify about new payment
    await notify({
      action: 'CREATE',
      message: `Pagamento recebido: ${finalAmount} MZN - ${result.payment.member.name} (${result.payment.plan.name})`,
      actorId: req.user.id,
      entity: 'PAYMENT',
      entityId: result.payment.id
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Generate receipt PDF (Modern Invoice) - Routes to Python PDF Service
router.get('/:id/receipt', async (req, res) => {
  const paymentId = req.params.id;
  try {
    console.log(`[Receipt] Received request for ID: ${paymentId}`);
    
    // Set STRONG CORS and no-cache headers BEFORE processing
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    
    // Support token from query parameter for iframe loading
    let token = req.headers.authorization?.replace('Bearer ', '');
    if (!token && req.query.token) {
      token = req.query.token;
    }
    
    if (!token) {
      console.warn(`[Receipt] No token provided for ID: ${paymentId}`);
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Verify token
    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error(`[Receipt] Token verification failed for ID: ${paymentId}`, err.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        member: true,
        plan: true,
        user: { select: { name: true } },
        invoice: true
      }
    });
    
    if (!payment) {
      console.warn(`[Receipt] Payment not found for ID: ${paymentId}`);
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Check if invoice is cancelled
    if (payment.invoice && payment.invoice.status === 'CANCELLED') {
      return res.status(400).json({ 
        error: 'This invoice has been cancelled',
        reason: payment.invoice.cancelReason 
      });
    }

    // Primary: Use the Node.js PDF generator (PDFKit)
    // This is the most robust method for production (Railway/Docker) 
    // as it doesn't require Python dependencies.
    try {
      console.log(`[Receipt] Generating PDF via PDFKit for ID: ${paymentId}`);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="recibo-${payment.receiptNumber || payment.id}.pdf"`);
      
      generateReceiptPDF(payment, res);
      return;
    } catch (err) {
      console.error(`[Receipt] Node.js PDF generation failed for ID: ${paymentId}:`, err.message);
      
      // Secondary Fallback: Try Python PDF Service if explicitly enabled
      const usePythonService = process.env.USE_PYTHON_PDF_SERVICE === 'true';
      if (usePythonService) {
        try {
          console.log(`[Receipt] Falling back to Python PDF Service for ID: ${paymentId}`);
          const pythonServiceUrl = process.env.PYTHON_PDF_SERVICE_URL || 'http://localhost:3002';
          const pdfResponse = await fetch(`${pythonServiceUrl}/generate-pdf?token=${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: payment.id,
              amount: payment.amount,
              member_name: payment.member.name,
              member_phone: payment.member.phone,
              plan_name: payment.plan.name,
              payment_method: payment.paymentMethod,
              receipt_number: payment.receiptNumber || payment.id.substring(0, 8),
              payment_date: payment.paymentDate?.toISOString() || new Date().toISOString()
            })
          });
          
          if (pdfResponse.ok) {
            const buffer = await pdfResponse.arrayBuffer();
            res.end(Buffer.from(buffer));
            return;
          }
        } catch (pyErr) {
          console.error(`[Receipt] Python fallback also failed:`, pyErr.message);
        }
      }
      
      throw new Error('All PDF generation methods failed');
    }
  } catch (error) {
    console.error(`[Receipt] Critical failure for ID: ${paymentId}:`, error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate receipt' });
    }
  }
});

// Daily report
router.get('/daily-report', authenticate, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
    
    const payments = await prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        member: { select: { name: true } },
        plan: { select: { name: true } },
        user: { select: { name: true } }
      },
      orderBy: { paymentDate: 'asc' }
    });
    
    const summary = {
      total: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
      count: payments.length,
      byMethod: {}
    };
    
    payments.forEach(p => {
      if (!summary.byMethod[p.paymentMethod]) {
        summary.byMethod[p.paymentMethod] = { count: 0, total: 0 };
      }
      summary.byMethod[p.paymentMethod].count++;
      summary.byMethod[p.paymentMethod].total += parseFloat(p.amount);
    });
    
    res.json({ payments, summary });
  } catch (error) {
    console.error('Error generating daily report:', error);
    res.status(500).json({ error: 'Failed to generate daily report' });
  }
});

// Monthly report
router.get('/monthly-report', authenticate, async (req, res) => {
  try {
    const { year, month } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
    
    const payments = await prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      include: {
        member: { select: { name: true } },
        plan: { select: { name: true } }
      }
    });
    
    const summary = {
      total: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
      count: payments.length,
      byPlan: {},
      byMethod: {}
    };
    
    payments.forEach(p => {
      // By plan
      if (!summary.byPlan[p.plan.name]) {
        summary.byPlan[p.plan.name] = { count: 0, total: 0 };
      }
      summary.byPlan[p.plan.name].count++;
      summary.byPlan[p.plan.name].total += parseFloat(p.amount);
      
      // By method
      if (!summary.byMethod[p.paymentMethod]) {
        summary.byMethod[p.paymentMethod] = { count: 0, total: 0 };
      }
      summary.byMethod[p.paymentMethod].count++;
      summary.byMethod[p.paymentMethod].total += parseFloat(p.amount);
    });
    
    res.json({ summary, totalPayments: payments.length });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
});

// Export to Excel
router.get('/export', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }
    
    const payments = await prisma.payment.findMany({
      where,
      include: {
        member: { select: { name: true, phone: true } },
        plan: { select: { name: true } },
        user: { select: { name: true } }
      },
      orderBy: { paymentDate: 'desc' }
    });
    
    const data = payments.map(p => ({
      'Data': p.paymentDate.toLocaleDateString('pt-PT'),
      'Membro': p.member.name,
      'Telefone': p.member.phone,
      'Plano': p.plan.name,
      'Valor': parseFloat(p.amount),
      'Método': p.paymentMethod,
      'Processado por': p.user.name
    }));
    
    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Pagamentos');
    
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=payments.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting payments:', error);
    res.status(500).json({ error: 'Failed to export payments' });
  }
});

// Get payment audit trail
router.get('/:id/audit', authenticate, async (req, res) => {
  try {
    const audits = await prisma.paymentAudit.findMany({
      where: { paymentId: req.params.id },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    if (audits.length === 0) {
      return res.status(404).json({ error: 'No audit records found' });
    }
    
    res.json(audits);
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    res.status(500).json({ error: 'Failed to fetch audit trail' });
  }
});

// Process refund
router.post('/:id/refund', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Reason for refund is required' });
    }
    
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { invoice: true }
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    if (payment.refunded) {
      return res.status(400).json({ error: 'Payment already refunded' });
    }
    
    const refund = await prisma.$transaction(async (tx) => {
      // Update payment as refunded
      const updatedPayment = await tx.payment.update({
        where: { id: req.params.id },
        data: {
          refunded: true,
          refundedAt: new Date(),
          refundReason: reason
        }
      });
      
      // Update invoice status
      if (payment.invoice) {
        await tx.invoice.update({
          where: { id: payment.invoice.id },
          data: {
            status: 'REFUNDED'
          }
        });
      }
      
      // Create audit log
      await tx.paymentAudit.create({
        data: {
          paymentId: req.params.id,
          action: 'REFUNDED',
          details: `Refund processed: ${reason}`,
          performedBy: req.user.id
        }
      });
      
      return updatedPayment;
    });
    
    res.json({
      refund,
      message: 'Refund processed successfully'
    });

    // Notify about refund
    await notify({
      action: 'WARNING',
      message: `Reembolso processado: ${payment.amount} MZN - ${payment.member.name}`,
      actorId: req.user.id,
      entity: 'PAYMENT',
      entityId: req.params.id
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Cancel invoice
router.post('/:id/cancel-invoice', authenticate, async (req, res) => {
  try {
    // Only admins can cancel invoices
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can cancel invoices' });
    }
    
    const { reason } = req.body;
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Reason for cancellation is required' });
    }
    
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { invoice: true }
    });
    
    if (!payment || !payment.invoice) {
      return res.status(404).json({ error: 'Payment or invoice not found' });
    }
    
    if (payment.invoice.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Invoice already cancelled' });
    }
    
    const cancelled = await prisma.$transaction(async (tx) => {
      // Update invoice status
      const updatedInvoice = await tx.invoice.update({
        where: { id: payment.invoice.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: reason
        }
      });
      
      // Create audit log
      await tx.paymentAudit.create({
        data: {
          paymentId: req.params.id,
          action: 'CANCELLED',
          details: `Invoice cancelled: ${reason}`,
          performedBy: req.user.id
        }
      });
      
      return updatedInvoice;
    });
    
    res.json({
      invoice: cancelled,
      message: 'Invoice cancelled successfully'
    });

    // Notify about cancellation
    await notify({
      action: 'WARNING',
      message: `Fatura cancelada: #${payment.receiptNumber} - ${payment.member.name}`,
      actorId: req.user.id,
      entity: 'PAYMENT',
      entityId: req.params.id
    });
  } catch (error) {
    console.error('Error cancelling invoice:', error);
    res.status(500).json({ error: 'Failed to cancel invoice' });
  }
});

export default router;
