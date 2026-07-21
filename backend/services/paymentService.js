import crypto from 'crypto';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import { PaymentRepository } from '../repositories/paymentRepository.js';
import { RideRepository } from '../repositories/rideRepository.js';

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_12345678',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'abcdefghijklmnopqrstu123'
});

export const PaymentService = {
  async createOrder(rideId, amount, paymentMethod) {
    try {
      // Amount in paise for Razorpay
      const amountPaise = Math.round(amount * 100);
      
      let orderId = `rzp_order_${Date.now()}`;
      try {
        const order = await razorpay.orders.create({
          amount: amountPaise,
          currency: 'INR',
          receipt: `receipt_${rideId.substring(0, 8)}`,
        });
        orderId = order.id;
      } catch (rzpErr) {
        console.warn('[Payment Service] Razorpay order creation failed. Falling back to local ID.', rzpErr.message);
      }

      // Log payment in Database
      const paymentId = crypto.randomUUID();
      const payment = await PaymentRepository.createPayment({
        id: paymentId,
        ride_id: rideId,
        amount: amount,
        status: 'pending',
        payment_method: paymentMethod,
        transaction_reference: orderId
      });

      return {
        payment,
        razorpayOrderId: orderId
      };
    } catch (err) {
      console.error('[Payment Service] createOrder error:', err.message);
      throw err;
    }
  },

  async verifyWebhookSignature(body, signature) {
    // Verifies signatures sent from Razorpay webhooks
    const secret = process.env.RAZORPAY_KEY_SECRET || 'abcdefghijklmnopqrstu123';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');
      
    return expectedSignature === signature;
  },

  async completePayment(paymentId, ref) {
    const payment = await PaymentRepository.findById(paymentId);
    if (!payment) throw new Error('Payment transaction not found.');

    await PaymentRepository.updateStatus(paymentId, 'completed', ref);
    await RideRepository.updateRide(payment.ride_id, { payment_status: 'completed' });
    
    return PaymentRepository.findById(paymentId);
  },

  async refundPayment(paymentId, amount = null) {
    const payment = await PaymentRepository.findById(paymentId);
    if (!payment) throw new Error('Payment not found.');

    const refundAmount = amount || payment.amount;
    try {
      if (payment.transaction_reference && !payment.transaction_reference.startsWith('rzp_order_')) {
        await razorpay.payments.refund(payment.transaction_reference, {
          amount: Math.round(refundAmount * 100)
        });
      }
    } catch (err) {
      console.warn('[Payment Service] Razorpay refund failed:', err.message);
    }

    await PaymentRepository.updateStatus(paymentId, 'refunded');
    return PaymentRepository.findById(paymentId);
  }
};
export default PaymentService;
