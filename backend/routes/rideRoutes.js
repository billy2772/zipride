import express from 'express';
import { RideController } from '../controllers/rideController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/request', requireAuth, RideController.requestRide);
router.get('/active', requireAuth, RideController.getActiveRide);
router.get('/history', requireAuth, RideController.getRiderHistory);
router.get('/:id', requireAuth, RideController.getRide);
router.post('/:id/accept', requireAuth, RideController.acceptRide);
router.post('/:id/start', requireAuth, RideController.startRide);
router.post('/:id/complete', requireAuth, RideController.completeRide);
router.post('/:id/cancel', requireAuth, RideController.cancelRide);

export default router;

