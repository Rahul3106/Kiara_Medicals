import { Router } from 'express';
import {
  login,
  adminLogin,
  storeLogin,
  refreshToken,
  getCurrentUser,
  logout,
} from './auth.controller.js';
import { verifyToken } from './auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// Public authentication endpoints with IP-based rate limiting
router.post('/login', authRateLimiter, login);
router.post('/admin-login', authRateLimiter, adminLogin);
router.post('/store-login', authRateLimiter, storeLogin);
router.post('/refresh', refreshToken);

// Protected session endpoints
router.get('/me', verifyToken, getCurrentUser);
router.post('/logout', verifyToken, logout);

export default router;
