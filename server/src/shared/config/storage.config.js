import dotenv from 'dotenv';
dotenv.config();

export const STORAGE_CONFIG = {
  DRIVER: process.env.STORAGE_DRIVER || (process.env.R2_ACCOUNT_ID ? 'r2' : 'local'),
  R2: {
    ACCOUNT_ID: process.env.R2_ACCOUNT_ID || '',
    ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '',
    SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || '',
    BUCKET_NAME: process.env.R2_BUCKET_NAME || 'kiara-medicals-storage',
    PUBLIC_DOMAIN: process.env.R2_PUBLIC_DOMAIN || '', // e.g. https://cdn.kiaramedicals.com
  },
  LOCAL: {
    UPLOAD_DIR: process.env.LOCAL_UPLOAD_DIR || './uploads',
  },
};
