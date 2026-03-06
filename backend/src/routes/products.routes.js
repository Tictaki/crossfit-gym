import express from 'express';
import prisma from '../utils/prisma.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { networkInterfaces } from 'os';

import { productStorage } from '../utils/cloudinaryConfig.js';

const router = express.Router();

const upload = multer({
  storage: productStorage,
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

// Helper to safely parse numbers and avoid NaN for Prisma
const parseNumber = (value, isInt = false) => {
  if (value === null || value === undefined || value === '' || value === 'null' || value === 'undefined') {
    return isInt ? 0 : 0.0;
  }
  const parsed = isInt ? parseInt(value) : parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

// --- Product Management ---

// Get local IP for remote scanner pairing
router.get('/local-ip', authenticate, (req, res) => {
  const nets = networkInterfaces();
  let localIp = 'localhost';

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        localIp = net.address;
        break;
      }
    }
    if (localIp !== 'localhost') break;
  }

  res.json({ ip: localIp });
});

// List all products
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, search } = req.query;
    const where = {};

    if (category) {
      where.category = category;
    }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' }
    });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create product (admin only)
router.post('/', authenticate, requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    const { name, commercialName, description, price, stock, category, packageSize, sku } = req.body;
    const product = await prisma.product.create({
      data: {
        name,
        commercialName,
        description,
        price: parseNumber(price),
        stock: parseNumber(stock, true),
        category,
        packageSize,
        sku,
        photo: req.file ? req.file.path : null
      }
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('CRITICAL: Error creating product:', error);
    res.status(500).json({ 
      error: 'Erro ao criar produto',
      message: error.message
    });
  }
});

// Update product (admin only)
router.put('/:id', authenticate, requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    const { name, commercialName, description, price, stock, category, packageSize, sku, status } = req.body;
    
    const updateData = {
      name,
      commercialName,
      description,
      category,
      packageSize,
      sku,
      status: status === 'true' || status === true
    };

    if (price !== undefined) updateData.price = parseNumber(price);
    if (stock !== undefined) updateData.stock = parseNumber(stock, true);

    if (req.file) {
      updateData.photo = req.file.path;
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json(product);
  } catch (error) {
    console.error('CRITICAL: Error updating product:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar produto',
      message: error.message
    });
  }
});

// Delete product (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    // Check if product has sales
    const salesCount = await prisma.sale.count({
      where: { productId: req.params.id }
    });

    if (salesCount > 0) {
      return res.status(400).json({ error: 'Cannot delete product with sales history. Deactivate it instead.' });
    }

    await prisma.product.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// --- Sales Management ---

// Record a sale
router.post('/sales', authenticate, async (req, res) => {
  try {
    const { productId, quantity, totalAmount, paymentMethod } = req.body;

    // Use a transaction to ensure stock is updated correctly
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get product and check stock
      const product = await tx.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new Error('Product not found');
      }

      if (product.stock < quantity) {
        throw new Error(`Insufficient stock. Available: ${product.stock}`);
      }

      // 2. Create sale record
      const sale = await tx.sale.create({
        data: {
          productId,
          quantity: parseInt(quantity),
          totalAmount,
          paymentMethod,
          processedBy: req.user.id
        },
        include: {
          product: true,
          seller: { select: { name: true } }
        }
      });

      // 3. Update stock
      await tx.product.update({
        where: { id: productId },
        data: {
          stock: product.stock - parseInt(quantity)
        }
      });

      return sale;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error recording sale:', error);
    res.status(400).json({ error: error.message || 'Failed to record sale' });
  }
});

// List sales
router.get('/sales', authenticate, async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        product: true,
        seller: { select: { name: true } }
      },
      orderBy: { saleDate: 'desc' },
      take: 100
    });
    res.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

export default router;
