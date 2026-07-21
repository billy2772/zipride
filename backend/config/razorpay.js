// backend/config/razorpay.js
import dotenv from 'dotenv';
dotenv.config();

export const razorpayConfig = {
  keyId: process.env.RAZORPAY_KEY_ID || '',
  keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
};

if (!razorpayConfig.keyId || !razorpayConfig.keySecret) {
  console.warn('[Razorpay Config] ⚠️  RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set. Payments will run in mock mode.');
}

export default razorpayConfig;
