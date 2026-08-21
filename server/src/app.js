import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ENV } from './shared/config/env.js';
import { errorHandler } from './shared/middleware/errorHandler.middleware.js';

// Route Modules
import authRoutes from './shared/auth/auth.routes.js';
import adminRoutes from './admin/routes/admin.routes.js';
import storeRoutes from './store/routes/index.js';

const app = express();

// Security & Parsing Middlewares
app.use(helmet());
app.use(
  cors({
    origin: ENV.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(morgan(ENV.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mounted Routes
// 1. Shared Auth & Profile
app.use('/api/auth', authRoutes);

// 2. Isolated Admin Module
app.use('/api/admin', adminRoutes);

// 3. Isolated Store Module (Shop A, B, C, etc. scoped by branchId)
app.use('/api/store', storeRoutes);

// 404 Catch-All
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} does not exist`,
    },
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
