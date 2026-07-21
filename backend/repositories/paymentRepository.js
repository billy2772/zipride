// backend/repositories/paymentRepository.js
// All SQL for payments — uses actual schema: payments table

import db from '../config/db.js';

export const PaymentRepository = {
  async create(data) {
    const { rideId, payerId, amount, method, status = 'Pending', transactionId = null } = data;
    const [result] = await db.execute(
      `INSERT INTO payments (ride_id, payer_id, amount, payment_method, payment_status, transaction_id, payment_time)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [rideId, payerId, amount, method, status, transactionId]
    );
    return result.insertId;
  },

  async findByRideId(rideId) {
    const [rows] = await db.execute(
      `SELECT * FROM payments WHERE ride_id = ? ORDER BY payment_time DESC LIMIT 1`,
      [rideId]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await db.execute(
      `SELECT * FROM payments WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async updateStatus(id, status, transactionId = null) {
    await db.execute(
      `UPDATE payments SET payment_status = ?, transaction_id = COALESCE(?, transaction_id), payment_time = NOW()
       WHERE id = ?`,
      [status, transactionId, id]
    );
  },

  async findByTransactionId(transactionId) {
    const [rows] = await db.execute(
      `SELECT * FROM payments WHERE transaction_id = ? LIMIT 1`,
      [transactionId]
    );
    return rows[0] || null;
  },

  async getPaymentsByUser(payerId, { limit = 10, offset = 0 } = {}) {
    const [rows] = await db.execute(
      `SELECT p.*, r.ride_code FROM payments p
       LEFT JOIN rides r ON p.ride_id = r.id
       WHERE p.payer_id = ?
       ORDER BY p.payment_time DESC
       LIMIT ? OFFSET ?`,
      [payerId, limit, offset]
    );
    return rows;
  },
};

export default PaymentRepository;
