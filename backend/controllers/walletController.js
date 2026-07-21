import { WalletService } from '../services/walletService.js';

export const WalletController = {
  async getBalance(req, res, next) {
    try {
      const wallet = await WalletService.getBalance(req.user.id);
      return res.json({
        success: true,
        message: 'Wallet balance retrieved.',
        data: wallet
      });
    } catch (err) {
      next(err);
    }
  },

  async addFunds(req, res, next) {
    try {
      const { amount } = req.body;
      const val = parseFloat(amount);
      if (isNaN(val) || val <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid deposit amount.' });
      }

      const tx = await WalletService.addFunds(req.user.id, val, 'Added money via Razorpay');
      return res.json({
        success: true,
        message: 'Funds credited successfully.',
        data: tx
      });
    } catch (err) {
      next(err);
    }
  },

  async withdrawFunds(req, res, next) {
    try {
      const { amount } = req.body;
      const val = parseFloat(amount);
      if (isNaN(val) || val <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid payout amount.' });
      }

      const tx = await WalletService.deductFunds(req.user.id, val, 'Withdrawal payout transfer');
      return res.json({
        success: true,
        message: 'Payout withdrawal processed.',
        data: tx
      });
    } catch (err) {
      next(err);
    }
  },

  async getTransactions(req, res, next) {
    try {
      const list = await WalletService.getHistory(req.user.id);
      return res.json({
        success: true,
        message: 'Wallet ledger logs retrieved.',
        data: list
      });
    } catch (err) {
      next(err);
    }
  }
};
