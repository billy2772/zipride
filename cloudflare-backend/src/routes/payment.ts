import { Hono } from 'hono';
import { executeQuery, Env } from '../config/db';

const payment = new Hono<{ Bindings: Env }>();

// Razorpay Order Creation via Cloudflare REST Fetch
payment.post('/create-order', async (c) => {
  try {
    const { amount, currency = 'INR', ride_id } = await c.req.json();
    const keyId = c.env.RAZORPAY_KEY_ID;
    const keySecret = c.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return c.json({ success: false, message: 'Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) missing in worker environment.' }, 500);
    }

    if (!amount) {
      return c.json({ success: false, message: 'Amount is required' }, 400);
    }

    // Call Razorpay REST API directly over HTTPS fetch without Node.js SDK TCP socket issues
    const authString = btoa(`${keyId}:${keySecret}`);
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency,
        receipt: `receipt_ride_${ride_id || Date.now()}`,
      }),
    });

    const orderData: any = await response.json();
    return c.json({ success: true, order: orderData });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Verify Payment & Update Wallet/Payment Status
payment.post('/verify', async (c) => {
  try {
    const { ride_id, amount, payment_method, razorpay_payment_id } = await c.req.json();

    if (ride_id) {
      await executeQuery(
        c.env,
        `UPDATE rides SET payment_status = 'Success', ride_status = 'Ride Completed' WHERE id = ?`,
        [ride_id]
      );
      await executeQuery(
        c.env,
        `INSERT INTO payments (ride_id, amount, status, payment_method, transaction_id, completed_time) VALUES (?, ?, 'Success', ?, ?, NOW())`,
        [ride_id, amount || 0, payment_method || 'UPI', razorpay_payment_id || `TXN_${Date.now()}`]
      );
    }

    return c.json({ success: true, message: 'Payment verified and updated.' });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

export default payment;
