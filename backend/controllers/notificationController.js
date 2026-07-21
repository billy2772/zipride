import { NotificationService } from '../services/notificationService.js';

export const NotificationController = {
  async getNotifications(req, res, next) {
    try {
      const list = await NotificationService.getNotifications(req.user.id);
      return res.json({
        success: true,
        message: 'Notifications retrieved.',
        data: list
      });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const updated = await NotificationService.markAsRead(req.params.id);
      return res.json({
        success: true,
        message: 'Notification marked as read.',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
};
