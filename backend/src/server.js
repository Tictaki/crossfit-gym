import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import memberRoutes from './routes/members.routes.js';
import planRoutes from './routes/plans.routes.js';
import paymentRoutes from './routes/payments.routes.js';
import checkinRoutes from './routes/checkins.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import notificationRoutes from './routes/notifications.routes.js';

// ... other imports

// Routes
app.use('/api/notifications', notificationRoutes);
import userRoutes from './routes/users.routes.js';
import expenseRoutes from './routes/expenses.routes.js';
import accountingRoutes from './routes/accounting.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import productsRoutes from './routes/products.routes.js';

import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Socket.io Logic
io.on('connection', (socket) => {
  console.log('📱 Dispositivo conectado:', socket.id);

  socket.on('join-scanner-room', (roomId) => {
    socket.join(roomId);
    console.log(`🏠 Dispositivo ${socket.id} entrou na sala: ${roomId}`);
  });

  socket.on('barcode-scanned', ({ roomId, code }) => {
    console.log(`🔒 Código lido na sala ${roomId}: ${code}`);
    // Broadcast to desktop in the same room
    socket.to(roomId).emit('remote-barcode', code);
  });

  socket.on('disconnect', () => {
    console.log('❌ Dispositivo desconectado:', socket.id);
  });
});

// Middleware
const allowedOrigin = process.env.FRONTEND_URL || '*';
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Special middleware for PDF endpoints - ensure headers are set FIRST
app.use('/api/payments/:id/receipt', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/products', productsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CrossFit Gym API is running' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Export for Vercel
export default app;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}
