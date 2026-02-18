import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for background upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/backgrounds');
  },
  filename: (req, file, cb) => {
    cb(null, 'app-background' + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
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

// Get all settings
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsMap);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update background image
router.post('/background', authenticate, upload.single('background'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const { key = 'background_image' } = req.body;
    const backgroundImagePath = `/uploads/backgrounds/${req.file.filename}`;
    
    await prisma.setting.upsert({
      where: { key },
      update: { value: backgroundImagePath },
      create: { key, value: backgroundImagePath }
    });

    res.json({ backgroundImage: backgroundImagePath, key });
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
    // TODO: Implementar exportação de base de dados
    // Pode usar pg_dump para PostgreSQL ou exportar para JSON
    res.status(501).json({ 
      error: 'Funcionalidade de exportação ainda não implementada' 
    });
  } catch (error) {
    console.error('Error exporting database:', error);
    res.status(500).json({ error: 'Failed to export database' });
  }
});

export default router;
