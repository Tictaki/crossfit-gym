import express from 'express';
import prisma from '../utils/prisma.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, requireAdmin } from '../middleware/auth.js';

import { backgroundStorage } from '../utils/cloudinaryConfig.js';
import { resolveImageUrl } from '../utils/urlHelpers.js';

const router = express.Router();

const upload = multer({
  storage: backgroundStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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

// Diagnostic endpoint to check if Cloudinary vars are set
router.get('/cloudinary-check', (req, res) => {
  res.json({
    hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
    hasApiKey: !!process.env.CLOUDINARY_API_KEY,
    hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
  });
});

// Get all settings
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = settings.reduce((acc, curr) => {
      let value = curr.value;
      // Handle known image keys
      if (curr.key === 'background_image' || curr.key === 'logo') {
        value = resolveImageUrl(value);
      }
      acc[curr.key] = value;
      return acc;
    }, {});
    res.json(settingsMap);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Upsert a text-based setting (e.g. gym_name)
router.post('/', authenticate, async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'key and value are required' });
    }
    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) }
    });
    res.json(setting);
  } catch (error) {
    console.error('Error saving setting:', error);
    res.status(500).json({ error: 'Failed to save setting' });
  }
});

// Update background image
router.post('/background', authenticate, upload.single('background'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const { key = 'background_image' } = req.body;
    const backgroundImagePath = req.file.path;
    
    await prisma.setting.upsert({
      where: { key },
      update: { value: backgroundImagePath },
      create: { key, value: backgroundImagePath }
    });

    res.json({ 
      backgroundImage: resolveImageUrl(backgroundImagePath), 
      key 
    });
  } catch (error) {
    console.error('Error updating background:', error);
    res.status(500).json({ error: 'Failed to update background image' });
  }
});

// Remove background image
router.delete('/background', authenticate, async (req, res) => {
  try {
    const { key = 'background_image' } = req.query;
    await prisma.setting.delete({
      where: { key }
    });
    res.json({ message: 'Background image removed', key });
  } catch (error) {
    if (error.code === 'P2025') {
       return res.json({ message: 'Background image already removed', key: req.query.key });
    }
    console.error('Error removing background:', error);
    res.status(500).json({ error: 'Failed to remove background image' });
  }
});

// Export database (admin only)
router.get('/export-database', authenticate, requireAdmin, async (req, res) => {
  try {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: {
        users: await prisma.user.findMany(),
        members: await prisma.member.findMany(),
        plans: await prisma.plan.findMany(),
        payments: await prisma.payment.findMany(),
        invoices: await prisma.invoice.findMany(),
        paymentAudits: await prisma.paymentAudit.findMany(),
        expenses: await prisma.expense.findMany(),
        checkins: await prisma.checkin.findMany(),
        settings: await prisma.setting.findMany(),
        products: await prisma.product.findMany(),
        sales: await prisma.sale.findMany(),
        notifications: await prisma.notification.findMany(),
        notificationRecipients: await prisma.notificationRecipient.findMany(),
        fixedCosts: await prisma.fixedCost.findMany(),
      }
    };

    const fileName = `crossfit-gym-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    // Set headers to trigger a file download in the browser
    res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-type', 'application/json');
    res.write(JSON.stringify(backupData, null, 2), function(err) {
      res.end();
    });

  } catch (error) {
    console.error('Error exporting database:', error);
    res.status(500).json({ error: 'Failed to export database' });
  }
});

export default router;
