import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ENV } from './shared/config/env.js';
import { logger, httpLogger } from './shared/config/logger.js';
import { initBackendSentry } from './shared/config/sentry.js';
import { errorHandler } from './shared/middleware/errorHandler.middleware.js';
import { apiRateLimiter } from './shared/middleware/rateLimiter.middleware.js';

// Route Modules
import authRoutes from './shared/auth/auth.routes.js';
import adminRoutes from './admin/routes/admin.routes.js';
import storeRoutes from './store/routes/index.js';
import uploadRoutes from './shared/routes/upload.routes.js';

const app = express();

// 1. Initialize Sentry Error Monitoring
initBackendSentry(app);

// 2. Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// 3. Dynamic CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (ENV.CORS_ORIGINS.includes(origin) || ENV.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// 4. Structured HTTP Logging (Pino)
app.use(httpLogger);

// 5. Body & Cookie Parsing
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 6. Global API Rate Limiter
app.use('/api/', apiRateLimiter);

// 7. Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    environment: ENV.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// 8. Mounted Route Endpoints
// Shared Auth & Profile (with IP rate limiting)
app.use('/api/auth', authRoutes);

// Isolated Admin Module
app.use('/api/admin', adminRoutes);

// Isolated Store Module
app.use('/api/store', storeRoutes);

// Cloudflare R2 / File Uploads
app.use('/api/uploads', uploadRoutes);

// 9. 404 Catch-All
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} does not exist`,
    },
  });
});

// 10. Global Error Handler (Pino + Sentry Reporting)
app.use(errorHandler);

export default app;
