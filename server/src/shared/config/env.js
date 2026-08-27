import dotenv from 'dotenv';
dotenv.config();

const getCorsOrigins = () => {
  const originStr = process.env.CORS_ORIGIN || 'http://localhost:5173';
  return originStr.split(',').map((o) => o.trim()).filter(Boolean);
};

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'a6aeb24337824e922c4c74fae57ae5aab3f3e0284c3f0b2666bacffb0c4e50e9',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'f033a5cd2d35d6f6d8ddb0844c72bb3071115041baf2d7f67a46b544c8cbecd4',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  CORS_ORIGINS: getCorsOrigins(),
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_LOGIN_ATTEMPTS: Number(process.env.RATE_LIMIT_MAX_LOGIN_ATTEMPTS) || 10,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};
