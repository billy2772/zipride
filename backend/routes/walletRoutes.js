import express from 'express';
import { WalletController } from '../controllers/walletController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/balance', requireAuth, WalletController.getBalance);
router.post('/deposit', requireAuth, WalletController.addFunds);
router.post('/withdraw', requireAuth, WalletController.withdrawFunds);
router.get('/transactions', requireAuth, WalletController.getTransactions);

export default router;
