import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

/**
 * Generates an Access Token
 * @param {object} payload - User and branch payload
 * @returns {string}
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN,
  });
};

/**
 * Generates a Refresh Token
 * @param {object} payload - Minimal user ID payload
 * @returns {string}
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, ENV.JWT_REFRESH_SECRET, {
    expiresIn: ENV.JWT_REFRESH_EXPIRES_IN,
  });
};

/**
 * Verifies a Refresh Token
 * @param {string} token
 * @returns {object} decoded payload
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, ENV.JWT_REFRESH_SECRET);
};

/**
 * Sets HttpOnly, Secure, SameSite=Strict Authentication Cookies
 * @param {import('express').Response} res
 * @param {string} accessToken
 * @param {string} refreshToken
 */
export const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProd = ENV.IS_PRODUCTION;
  
  // Access Token Cookie (1 day)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    domain: ENV.COOKIE_DOMAIN || undefined,
    path: '/',
  });

  // Refresh Token Cookie (7 days)
  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: ENV.COOKIE_DOMAIN || undefined,
      path: '/',
    });
  }
};

/**
 * Clears Authentication Cookies on Logout
 * @param {import('express').Response} res
 */
export const clearAuthCookies = (res) => {
  const isProd = ENV.IS_PRODUCTION;
  const opts = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    domain: ENV.COOKIE_DOMAIN || undefined,
    path: '/',
  };
  res.clearCookie('accessToken', opts);
  res.clearCookie('refreshToken', opts);
};
