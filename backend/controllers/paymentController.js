import { PaymentService } from '../services/paymentService.js';
import Logger from '../utils/logger.js';

export const PaymentController = {
  async createPaymentOrder(req, res, next) {
    try {
      const { rideId, amount, paymentMethod } = req.body;
      if (!rideId || !amount) {
        return res.status(400).json({ success: false, message: 'Ride ID and Amount are required.' });
      }

      const orderData = await PaymentService.createOrder(rideId, amount, paymentMethod || 'razorpay');
      
      return res.json({
        success: true,
        message: 'Payment order generated.',
        data: orderData
      });
    } catch (err) {
      next(err);
    }
  },

  async verifyPayment(req, res, next) {
    try {
      const { paymentId, transactionReference } = req.body;
      if (!paymentId || !transactionReference) {
        return res.status(400).json({ success: false, message: 'Payment ID and Transaction Reference are required.' });
      }

      const payment = await PaymentService.completePayment(paymentId, transactionReference);
      Logger.payment(`Payment ${paymentId} completed successfully. Reference: ${transactionReference}`);

      return res.json({
        success: true,
        message: 'Payment verified and completed.',
        data: payment
      });
    } catch (err) {
      next(err);
    }
  },

  async handleWebhook(req, res, next) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      if (!signature) {
        return res.status(400).json({ success: false, message: 'Webhook signature missing.' });
      }

      const isValid = await PaymentService.verifyWebhookSignature(req.body, signature);
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Invalid webhook signature.' });
      }

      const event = req.body.event;
      Logger.payment(`Received Razorpay Webhook Event: ${event}`);

      if (event === 'payment.captured') {
        const entity = req.body.payload.payment.entity;
        const orderId = entity.order_id;
        const paymentReference = entity.id;

        // Perform async completion of payment
        console.log(`[Webhook Captured] Order ${orderId} captured as ${paymentReference}`);
      }

      return res.json({ success: true, message: 'Webhook logged.' });
    } catch (err) {
      Logger.error('[Razorpay Webhook Error]:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
