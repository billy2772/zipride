import crypto from 'crypto';
import { WalletRepository } from '../repositories/walletRepository.js';

export const WalletService = {
  async getBalance(userId) {
    let wallet = await WalletRepository.findByUserId(userId);
    if (!wallet) {
      wallet = await WalletRepository.create(userId, 0.00);
    }
    return wallet;
  },

  async addFunds(userId, amount, description = 'Wallet Deposit') {
    if (amount <= 0) throw new Error('Deposit amount must be greater than zero.');
    return WalletRepository.addTransaction({
      id: crypto.randomUUID(),
      wallet_id: userId,
      amount: amount,
      type: 'deposit',
      description
    });
  },

  async deductFunds(userId, amount, description = 'Wallet Deduction') {
    if (amount <= 0) throw new Error('Deduction amount must be greater than zero.');
    const wallet = await this.getBalance(userId);
    if (wallet.balance < amount) throw new Error('Insufficient wallet balance.');

    return WalletRepository.addTransaction({
      id: crypto.randomUUID(),
      wallet_id: userId,
      amount: -amount,
      type: 'withdrawal',
      description
    });
  },

  async recordRideTransaction(rideId, riderId, driverId, fare, commissionPercentage = 15) {
    const driverCut = 1 - (commissionPercentage / 100);
    const driverEarnings = Math.round(fare * driverCut * 100) / 100;

    // Deduct rider balance
    await WalletRepository.addTransaction({
      id: crypto.randomUUID(),
      wallet_id: riderId,
      amount: -fare,
      type: 'ride_payment',
      description: `Ride fare for trip ${rideId.substring(0, 8)}`
    });

    // Credit driver earnings
    await WalletRepository.addTransaction({
      id: crypto.randomUUID(),
      wallet_id: driverId,
      amount: driverEarnings,
      type: 'ride_earnings',
      description: `Earnings for trip ${rideId.substring(0, 8)}`
    });
  },

  async processRefund(rideId, riderId, amount) {
    await WalletRepository.addTransaction({
      id: crypto.randomUUID(),
      wallet_id: riderId,
      amount: amount,
      type: 'refund',
      description: `Refund for trip ${rideId.substring(0, 8)}`
    });
  },

  async applyReferralReward(refereeId, referrerId, rewardAmount = 50.00) {
    await WalletRepository.addTransaction({
      id: crypto.randomUUID(),
      wallet_id: refereeId,
      amount: rewardAmount,
      type: 'deposit',
      description: 'Referral reward credit'
    });
    
    if (referrerId) {
      await WalletRepository.addTransaction({
        id: crypto.randomUUID(),
        wallet_id: referrerId,
        amount: rewardAmount,
        type: 'deposit',
        description: 'Referral signup bonus credit'
      });
    }
  },

  async getHistory(userId) {
    const wallet = await this.getBalance(userId);
    return WalletRepository.getTransactions(wallet.id);
  }
};
export default WalletService;
