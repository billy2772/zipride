// backend/repositories/walletRepository.js
// All SQL for wallet — uses actual schema: wallets, wallet_transactions

import db from '../config/db.js';

export const WalletRepository = {
  async findByProfileId(profileId) {
    const [rows] = await db.execute(
      `SELECT * FROM wallets WHERE profile_id = ? LIMIT 1`,
      [profileId]
    );
    return rows[0] || null;
  },

  async findByUserId(profileId) {
    return this.findByProfileId(profileId);
  },

  async create(profileId) {
    await db.execute(
      `INSERT INTO wallets (profile_id, wallet_balance, wallet_status, created_at, updated_at)
       VALUES (?, 0.00, 'Active', NOW(), NOW())`,
      [profileId]
    );
    return this.findByProfileId(profileId);
  },

  async getBalance(profileId) {
    const [rows] = await db.execute(
      `SELECT wallet_balance FROM wallets WHERE profile_id = ? LIMIT 1`,
      [profileId]
    );
    return rows[0]?.wallet_balance ?? null;
  },

  async credit(profileId, amount) {
    await db.execute(
      `UPDATE wallets SET wallet_balance = wallet_balance + ?, updated_at = NOW()
       WHERE profile_id = ? AND wallet_status = 'Active'`,
      [amount, profileId]
    );
  },

  async debit(profileId, amount) {
    const [result] = await db.execute(
      `UPDATE wallets SET wallet_balance = wallet_balance - ?, updated_at = NOW()
       WHERE profile_id = ? AND wallet_status = 'Active' AND wallet_balance >= ?`,
      [amount, profileId, amount]
    );
    return result.affectedRows > 0;
  },

  async addTransaction(walletId, data) {
    const { rideId = null, type, amount, description = '' } = data;
    const [result] = await db.execute(
      `INSERT INTO wallet_transactions (wallet_id, ride_id, transaction_type, amount, description, transaction_date)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [walletId, rideId, type, amount, description]
    );
    return result.insertId;
  },

  async getTransactions(profileId, { limit = 10, offset = 0 } = {}) {
    const [rows] = await db.execute(
      `SELECT wt.* FROM wallet_transactions wt
       JOIN wallets w ON wt.wallet_id = w.id
       WHERE w.profile_id = ?
       ORDER BY wt.transaction_date DESC
       LIMIT ? OFFSET ?`,
      [profileId, limit, offset]
    );
    return rows;
  },

  async countTransactions(profileId) {
    const [[row]] = await db.execute(
      `SELECT COUNT(*) AS total FROM wallet_transactions wt
       JOIN wallets w ON wt.wallet_id = w.id
       WHERE w.profile_id = ?`,
      [profileId]
    );
    return row.total;
  },
};

export default WalletRepository;
