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

const router = Router();

// Public authentication endpoints
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.post('/store-login', storeLogin);
router.post('/refresh', refreshToken);

// Protected session endpoints
router.get('/me', verifyToken, getCurrentUser);
router.post('/logout', verifyToken, logout);

export default router;
