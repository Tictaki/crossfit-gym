import express from 'express';
import prisma from '../utils/prisma.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import { authenticate } from '../middleware/auth.js';
import { notify } from '../utils/notifier.js';

import { memberStorage } from '../utils/cloudinaryConfig.js';
import { updateMemberStatuses } from '../utils/autoUpdateStatus.js';
import { resolveImageUrl } from '../utils/urlHelpers.js';

const router = express.Router();

const upload = multer({
  storage: memberStorage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed (jpeg, jpg, png, webp)'));
  }
});


// List members with filters
router.get('/', authenticate, async (req, res) => {
  try {
    console.log(`[Members] List request from user ${req.user.id}. Query:`, req.query);
    // Fail-safe background status sync
    try {
      await updateMemberStatuses();
    } catch (syncError) {
      console.error('Background status sync failed:', syncError);
    }
    
    const { search, status, page = 1, limit = 20 } = req.query;
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { whatsapp: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.member.count({ where })
    ]);
    
    const membersWithResolvedPhotos = members.map(member => ({
      ...member,
      photo: resolveImageUrl(member.photo)
    }));
    
    res.json({
      members: membersWithResolvedPhotos,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ 
      error: 'Failed to fetch members',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get single member
router.get('/:id', authenticate, async (req, res) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: {
        plan: true,
        payments: {
          include: {
            plan: true,
            user: { select: { name: true } }
          },
          orderBy: { paymentDate: 'desc' }
        },
        checkins: {
          orderBy: { checkinDatetime: 'desc' },
          take: 50
        }
      }
    });
    
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    if (member.photo) {
      member.photo = resolveImageUrl(member.photo);
    }
    
    res.json(member);
  } catch (error) {
    console.error('CRITICAL: Error fetching member:', error);
    res.status(500).json({ 
      error: 'Erro ao carregar membro',
      message: error.message
    });
  }
});

// Create member
router.post('/', authenticate, upload.single('photo'), async (req, res) => {
  try {
    const { 
      name, 
      phone, 
      whatsapp,
      email,
      birthDate, 
      gender, 
      notes, 
      planId, 
      paymentMethod,
      enrollmentDate,
      startDate
    } = req.body;
    
    // Check if phone already exists
    const existingMember = await prisma.member.findUnique({
      where: { phone }
    });
    
    if (existingMember) {
      return res.status(400).json({ error: 'Este número de telefone já está registado' });
    }

    const today = new Date();

    // Validate required fields
    if (!name || !phone || !gender) {
      return res.status(400).json({ error: 'Nome, telefone e sexo são obrigatórios' });
    }
    if (!birthDate) {
      return res.status(400).json({ error: 'Data de nascimento é obrigatória' });
    }

    let memberData = {
      name,
      phone,
      whatsapp: whatsapp || null,
      email: email || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      gender,
      photo: req.file ? req.file.path : null,
      notes,
      enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : today,
      status: 'INACTIVE'
    };

    // If planId is provided, perform everything in a transaction
    if (planId) {
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) {
        return res.status(404).json({ error: 'Plano não encontrado' });
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. Create member as ACTIVE
        const actualStartDate = startDate ? new Date(startDate) : today;
        const expirationDate = new Date(actualStartDate);
        expirationDate.setDate(expirationDate.getDate() + plan.durationDays);

        const newMember = await tx.member.create({
          data: {
            ...memberData,
            planId,
            startDate: actualStartDate,
            expirationDate,
            status: 'ACTIVE'
          },
          include: { plan: true }
        });

        // 2. Create payment
        const payment = await tx.payment.create({
          data: {
            memberId: newMember.id,
            planId,
            amount: plan.price,
            paymentMethod: paymentMethod || 'CASH',
            processedBy: req.user.id
          }
        });

        // 3. Create invoice
        await tx.invoice.create({
          data: {
            paymentId: payment.id,
            invoiceNumber: payment.receiptNumber,
            issuedBy: req.user.id,
            status: 'ISSUED'
          }
        });

        // 4. Create audit log
        await tx.paymentAudit.create({
          data: {
            paymentId: payment.id,
            action: 'CREATED',
            details: `Registo inicial com plano ${plan.name}`,
            performedBy: req.user.id
          }
        });

        return newMember;
      });

      await notify({
        action: 'CREATE',
        message: `Novo membro registado com plano: ${result.name}`,
        actorId: req.user.id,
        entity: 'MEMBER',
        entityId: result.id
      });

      return res.status(201).json(result);
    }
    
    // Regular creation without plan
    const member = await prisma.member.create({
      data: memberData,
      include: { plan: true }
    });
    
    await notify({
      action: 'CREATE',
      message: `Novo membro registado: ${member.name}`,
      actorId: req.user.id,
      entity: 'MEMBER',
      entityId: member.id
    });

    res.status(201).json(member);
  } catch (error) {
    console.error('Error creating member:', error);
    res.status(500).json({ 
      error: error.message?.includes('Unique constraint') 
        ? 'Este número de telefone já está registado' 
        : 'Erro ao criar membro',
      message: error.message
    });
  }
});

// Update member
router.put('/:id', authenticate, upload.single('photo'), async (req, res) => {
  try {
    const { name, phone, whatsapp, email, birthDate, gender, notes, enrollmentDate, startDate, expirationDate } = req.body;
    
    const updateData = {
      name,
      phone,
      whatsapp: whatsapp || null,
      email: email === '' ? null : email,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      gender,
      notes,
      enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      expirationDate: expirationDate ? new Date(expirationDate) : undefined
    };
    
    if (req.file) {
      updateData.photo = req.file.path;
    }
    
    const member = await prisma.member.update({
      where: { id: req.params.id },
      data: updateData,
      include: { plan: true }
    });
    
    await notify({
      action: 'UPDATE',
      message: `Dados do membro atualizados: ${member.name}`,
      actorId: req.user.id,
      entity: 'MEMBER',
      entityId: member.id
    });

    res.json(member);
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

// Suspend member
router.put('/:id/suspend', authenticate, async (req, res) => {
  try {
    const member = await prisma.member.update({
      where: { id: req.params.id },
      data: { status: 'SUSPENDED' },
      include: { plan: true }
    });
    
    await notify({
      action: 'WARNING',
      message: `Membro suspenso: ${member.name}`,
      actorId: req.user.id,
      entity: 'MEMBER',
      entityId: member.id
    });

    res.json(member);
  } catch (error) {
    console.error('Error suspending member:', error);
    res.status(500).json({ error: 'Failed to suspend member' });
  }
});

// Activate/Reactivate member
router.put('/:id/activate', authenticate, async (req, res) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.params.id }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const today = new Date();
    const newStatus = member.expirationDate && member.expirationDate > today ? 'ACTIVE' : 'INACTIVE';

    const updatedMember = await prisma.member.update({
      where: { id: req.params.id },
      data: { status: newStatus },
      include: { plan: true }
    });
    
    await notify({
      action: 'UPDATE',
      message: `Membro reativado: ${updatedMember.name}`,
      actorId: req.user.id,
      entity: 'MEMBER',
      entityId: updatedMember.id
    });

    res.json(updatedMember);
  } catch (error) {
    console.error('Error activating member:', error);
    res.status(500).json({ error: 'Failed to activate member' });
  }
});

// Generate QR code
router.get('/:id/qrcode', authenticate, async (req, res) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true }
    });
    
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    const qrCodeDataURL = await QRCode.toDataURL(member.id);
    
    res.json({
      qrCode: qrCodeDataURL,
      memberId: member.id,
      memberName: member.name
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Delete member
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Perform deletion in a transaction to handle related records
    await prisma.$transaction(async (tx) => {
      // 1. Delete Checkins
      await tx.checkin.deleteMany({
        where: { memberId: id }
      });

      // 2. Delete Payments (Cascade deletes Invoices and Audits in Prisma schema)
      await tx.payment.deleteMany({
        where: { memberId: id }
      });

      // 3. Delete Member
      await tx.member.delete({
        where: { id }
      });
    });

    await notify({
      action: 'DELETE',
      message: `Membro eliminado permanentemente: ID #${id.substring(0, 8)}`,
      actorId: req.user.id,
      entity: 'MEMBER',
      entityId: id
    });

    res.json({ message: 'Membro eliminado com sucesso' });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ error: 'Erro ao eliminar membro' });
  }
});

export default router;
