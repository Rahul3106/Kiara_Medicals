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
