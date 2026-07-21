// backend/services/notificationService.js
// Production notification service — FCM push via device_tokens + DB persistence

import crypto from 'crypto';
import { NotificationRepository } from '../repositories/notificationRepository.js';
import db from '../config/db.js';

// FCM v1 API send function
async function sendFcmPush(fcmToken, title, body, data = {}) {
  const serverKey = process.env.FCM_SERVER_KEY;
  if (!serverKey || !fcmToken) return null;

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${serverKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: fcmToken,
        notification: { title, body },
        data,
      }),
    });
    const result = await response.json();
    if (result.failure > 0) {
      console.warn('[FCM] Push delivery failed for token:', fcmToken, result);
    }
    return result;
  } catch (err) {
    console.error('[FCM] Send error:', err.message);
    return null;
  }
}

export const NotificationService = {
  async getNotifications(userId) {
    return NotificationRepository.findByUserId(userId);
  },

  async sendPushNotification(userId, title, body, data = {}) {
    // 1. Write to DB regardless of push status
    await NotificationRepository.create({
      id:      crypto.randomUUID(),
      user_id: userId,
      title,
      body,
      read: 0,
    }).catch(() => {});

    // 2. Look up FCM device token
    try {
      const [tokenRows] = await db.execute(
        `SELECT fcm_token FROM device_tokens WHERE profile_id = ? AND fcm_token IS NOT NULL ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );
      if (tokenRows[0]?.fcm_token) {
        await sendFcmPush(tokenRows[0].fcm_token, title, body, data);
      }
    } catch (err) {
      console.warn('[Notification] FCM token lookup failed:', err.message);
    }

    console.log(`[Notification] To: ${userId} | Title: "${title}" | Body: "${body}"`);
    return { success: true };
  },

  async sendRideNotification(userId, rideId, status) {
    const messages = {
      accepted:    { title: 'Driver On The Way!',       body: 'A driver has accepted your ride and is heading to you.' },
      arriving:    { title: 'Driver Has Arrived',        body: 'Your driver is at the pickup location.' },
      in_progress: { title: 'Ride Started',              body: 'Your trip is underway. Enjoy the ride!' },
      completed:   { title: 'Ride Completed ✓',          body: 'You have arrived. Thank you for riding with ZipRide!' },
      cancelled:   { title: 'Ride Cancelled',            body: 'Your ride has been cancelled.' },
      no_driver:   { title: 'No Drivers Available',      body: 'We could not find a driver nearby. Please try again.' },
    };
    const msg = messages[status] || { title: 'Ride Update', body: `Status: ${status}` };
    return this.sendPushNotification(userId, msg.title, msg.body, { rideId: String(rideId), status });
  },

  async sendWalletNotification(userId, type, amount) {
    const title = type === 'credit' ? 'Wallet Credited ✓' : 'Wallet Debited';
    const body  = `₹${amount} has been ${type === 'credit' ? 'added to' : 'deducted from'} your ZipRide wallet.`;
    return this.sendPushNotification(userId, title, body, { type, amount: String(amount) });
  },

  async markAsRead(notificationId) {
    return NotificationRepository.markAsRead(notificationId);
  },

  // Register FCM device token
  async registerDeviceToken(profileId, fcmToken, deviceType = 'android') {
    try {
      await db.execute(
        `INSERT INTO device_tokens (profile_id, fcm_token, device_type, created_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE fcm_token = ?, created_at = NOW()`,
        [profileId, fcmToken, deviceType, fcmToken]
      );
      return { success: true };
    } catch (err) {
      console.error('[Notification] Token register failed:', err.message);
      return { success: false };
    }
  },
};

export default NotificationService;
