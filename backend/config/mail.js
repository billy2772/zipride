// backend/config/mail.js
import dotenv from 'dotenv';
dotenv.config();

export const mailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  fromName: process.env.SMTP_FROM_NAME || 'ZipRide',
  fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@zipride.com',
};

if (!mailConfig.user || !mailConfig.pass) {
  console.warn('[Mail Config] ⚠️  SMTP credentials not set. Emails will be logged to console only.');
}

export default mailConfig;
