import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import QRCode from 'qrcode';
import { authenticate } from '../middleware/auth.js';
import { notify } from '../utils/notifier.js';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for photo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/members');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'member-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed (jpeg, jpg, png)'));
  }
});

// Auto-update statuses based on expiration date
async function updateMemberStatuses() {
  try {
    const today = new Date();
    await prisma.member.updateMany({
      where: {
        status: 'ACTIVE',
        expirationDate: { lt: today }
      },
      data: { status: 'INACTIVE' }
    });
  } catch (error) {
    console.error('Error auto-updating member statuses:', error);
  }
}

// List members with filters
router.get('/', authenticate, async (req, res) => {
  try {
    console.log(`[Members] List request from user ${req.user.id}. Query:`, req.query);
    await updateMemberStatuses();
    
    const { search, status, page = 1, limit = 20 } = req.query;
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
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
    
    res.json({
      members,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
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
    
    res.json(member);
  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({ error: 'Failed to fetch member' });
  }
});

// Create member
router.post('/', authenticate, upload.single('photo'), async (req, res) => {
  try {
    const { name, phone, birthDate, gender, notes } = req.body;
    
    // Check if phone already exists
    const existingMember = await prisma.member.findUnique({
      where: { phone }
    });
    
    if (existingMember) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }
    
    const member = await prisma.member.create({
      data: {
        name,
        phone,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender,
        photo: req.file ? `/uploads/members/${req.file.filename}` : null,
        notes,
        status: 'INACTIVE'
      },
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
    res.status(500).json({ error: 'Failed to create member' });
  }
});

// Update member
router.put('/:id', authenticate, upload.single('photo'), async (req, res) => {
  try {
    const { name, phone, birthDate, gender, notes } = req.body;
    
    const updateData = {
      name,
      phone,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      gender,
      notes
    };
    
    if (req.file) {
      updateData.photo = `/uploads/members/${req.file.filename}`;
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

export default router;
