import express from 'express';
import { NotificationController } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, NotificationController.getNotifications);
router.put('/:id/read', requireAuth, NotificationController.markAsRead);

export default router;
