// backend/repositories/notificationRepository.js
// Uses actual schema: notifications (profile_id, title, message, notification_type, is_read)

import db from '../config/db.js';

export const NotificationRepository = {
  async create(data) {
    const { profileId, title, message, type = 'System' } = data;
    const [result] = await db.execute(
      `INSERT INTO notifications (profile_id, title, message, notification_type, is_read, created_at)
       VALUES (?, ?, ?, ?, 0, NOW())`,
      [profileId, title, message, type]
    );
    return result.insertId;
  },

  async findByProfileId(profileId, { limit = 20, offset = 0, unreadOnly = false } = {}) {
    let sql = `SELECT * FROM notifications WHERE profile_id = ?`;
    const params = [profileId];
    if (unreadOnly) { sql += ` AND is_read = 0`; }
    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    const [rows] = await db.execute(sql, params);
    return rows;
  },

  async countUnread(profileId) {
    const [[row]] = await db.execute(
      `SELECT COUNT(*) AS total FROM notifications WHERE profile_id = ? AND is_read = 0`,
      [profileId]
    );
    return row.total;
  },

  async markAsRead(id, profileId) {
    await db.execute(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND profile_id = ?`,
      [id, profileId]
    );
  },

  async markAllRead(profileId) {
    await db.execute(
      `UPDATE notifications SET is_read = 1 WHERE profile_id = ?`,
      [profileId]
    );
  },
};

export default NotificationRepository;
