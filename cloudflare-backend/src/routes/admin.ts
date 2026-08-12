import { Hono } from 'hono';
import { executeQuery, Env } from '../config/db';

const admin = new Hono<{ Bindings: Env }>();

// 1. Dashboard Stats
admin.get('/dashboard/stats', async (c) => {
  try {
    const [
      userCount,
      driverApproved,
      driverOnline,
      driverOffline,
      pendingDrivers,
      rideCount,
      todayRides,
      completedToday,
      cancelledToday,
      activeRides,
      pendingPayments,
      revenue,
      todayRevenue,
      walletBalance,
      avgRating,
      completedRidesList,
    ] = await Promise.all([
      executeQuery(c.env, `SELECT COUNT(*) AS total FROM profiles WHERE role = 'rider'`),
      executeQuery(c.env, `SELECT COUNT(*) AS total FROM driver_profiles WHERE verification_status = 'Approved' OR verification_status = 'approved'`),
      executeQuery(c.env, `SELECT COUNT(*) AS total FROM driver_profiles WHERE is_online = 1`),
      executeQuery(c.env, `SELECT COUNT(*) AS total FROM driver_profiles WHERE is_online = 0`),
      executeQuery(c.env, `SELECT COUNT(*) AS total FROM driver_profiles WHERE verification_status = 'Pending' OR verification_status = 'pending'`),
      executeQuery(c.env, `SELECT COUNT(*) AS total FROM rides`),
      executeQuery(c.env, `SELECT COUNT(*) AS total FROM rides WHERE created_at >= CURDATE() OR booking_time >= CURDATE()`),
      executeQuery(c.env, `SELECT COUNT(*) AS total FROM rides WHERE (completed_time >= CURDATE() OR created_at >= CURDATE()) AND ride_status = 'Ride Completed'`),
      executeQuery(c.env, `SELECT COUNT(*) AS total FROM rides WHERE (cancelled_time >= CURDATE() OR created_at >= CURDATE()) AND ride_status = 'Cancelled'`),
      executeQuery(c.env, `SELECT COUNT(*) AS total FROM rides WHERE ride_status IN ('Searching','Driver Assigned','Driver Accepted','Driver Arrived','OTP Verified','Ride Started')`),
      executeQuery(c.env, `SELECT COUNT(*) AS total FROM rides WHERE payment_status = 'Pending'`),
      executeQuery(c.env, `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'Success' OR status = 'completed' OR status = 'Paid'`),
      executeQuery(c.env, `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE created_time >= CURDATE()`),
      executeQuery(c.env, `SELECT COALESCE(SUM(wallet_balance), 0) AS total FROM wallets`),
      executeQuery(c.env, `SELECT COALESCE(AVG(rating), 5.0) AS avg FROM driver_profiles`),
      executeQuery(c.env, `SELECT id, estimated_fare AS fare, created_at FROM rides WHERE ride_status = 'Ride Completed' ORDER BY created_at DESC LIMIT 500`),
    ]);

    const stats = {
      totalRiders: (userCount[0] as any)?.total || 0,
      totalDrivers: (driverApproved[0] as any)?.total || 0,
      driversOnline: (driverOnline[0] as any)?.total || 0,
      driversOffline: (driverOffline[0] as any)?.total || 0,
      pendingDriverApprovals: (pendingDrivers[0] as any)?.total || 0,
      totalRides: (rideCount[0] as any)?.total || 0,
      todayRides: (todayRides[0] as any)?.total || 0,
      completedToday: (completedToday[0] as any)?.total || 0,
      cancelledToday: (cancelledToday[0] as any)?.total || 0,
      activeRides: (activeRides[0] as any)?.total || 0,
      pendingPayments: (pendingPayments[0] as any)?.total || 0,
      totalRevenue: (revenue[0] as any)?.total || 0,
      todayRevenue: (todayRevenue[0] as any)?.total || 0,
      platformWalletBalance: (walletBalance[0] as any)?.total || 0,
      averageDriverRating: parseFloat((avgRating[0] as any)?.avg || 5.0).toFixed(2),
      completedRides: completedRidesList || [],
      topDrivers: [],
      topRiders: [],
    };

    return c.json({ success: true, message: 'Edge dashboard stats retrieved.', data: stats });
  } catch (err: any) {
    console.error('[Edge Admin Stats Error]:', err.message);
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 2. Users Endpoint (Riders & Admins)
admin.get('/users', async (c) => {
  try {
    const role = c.req.query('role') || 'rider';
    const search = c.req.query('search') || '';
    
    let query = `SELECT id, full_name, phone, email, username, account_status, created_at FROM profiles WHERE 1=1`;
    const params: any[] = [];

    if (role) {
      query += ` AND role = ?`;
      params.push(role);
    }
    if (search) {
      query += ` AND (full_name LIKE ? OR phone LIKE ? OR email LIKE ? OR username LIKE ?)`;
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    query += ` ORDER BY created_at DESC LIMIT 1000`;
    const users = await executeQuery(c.env, query, params);

    return c.json({ success: true, data: users });
  } catch (err: any) {
    console.error('[Admin Users Error]:', err.message);
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Delete User Endpoint
admin.delete('/users/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await executeQuery(c.env, `DELETE FROM profiles WHERE id = ?`, [id]);
    return c.json({ success: true, message: 'User deleted successfully.' });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 3. Drivers Management Endpoint
admin.get('/drivers', async (c) => {
  try {
    const search = c.req.query('search') || '';
    let query = `SELECT dp.id, dp.profile_id, dp.driver_code, dp.verification_status, dp.is_online, dp.rating, dp.total_earnings, dp.completed_rides, dp.cancelled_rides, dp.profile_photo, dp.created_at,
                 p.full_name, p.phone, p.email, p.account_status
                 FROM driver_profiles dp
                 JOIN profiles p ON dp.profile_id = p.id WHERE 1=1`;
    const params: any[] = [];

    if (search) {
      query += ` AND (p.full_name LIKE ? OR p.phone LIKE ? OR dp.driver_code LIKE ?)`;
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }

    query += ` ORDER BY dp.created_at DESC LIMIT 1000`;
    const drivers = await executeQuery(c.env, query, params);

    return c.json({ success: true, data: drivers });
  } catch (err: any) {
    console.error('[Admin Drivers Error]:', err.message);
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 4. Pending Driver Verifications Endpoint
admin.get('/verifications', async (c) => {
  try {
    const verifications = await executeQuery(
      c.env,
      `SELECT dp.id, dp.profile_id, dp.driver_code, dp.verification_status, dp.profile_photo, dp.driving_licence_image, dp.driving_licence_number, dp.created_at,
       p.full_name, p.phone, p.email
       FROM driver_profiles dp
       JOIN profiles p ON dp.profile_id = p.id
       ORDER BY dp.created_at DESC LIMIT 500`
    );

    return c.json({ success: true, data: verifications });
  } catch (err: any) {
    console.error('[Admin Verifications Error]:', err.message);
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Approve / Reject Driver Verification
admin.post('/verifications/status', async (c) => {
  try {
    const { driver_id, driverId, status, rejection_reason } = await c.req.json();
    const id = driver_id || driverId;

    if (!id || !status) {
      return c.json({ success: false, message: 'Driver ID and status required.' }, 400);
    }

    await executeQuery(
      c.env,
      `UPDATE driver_profiles SET verification_status = ?, rejection_reason = ?, verification_date = NOW() WHERE id = ? OR profile_id = ?`,
      [status, rejection_reason || null, id, id]
    );

    return c.json({ success: true, message: `Driver status updated to ${status}` });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 5. Rides List Endpoint
admin.get('/rides', async (c) => {
  try {
    const rides = await executeQuery(
      c.env,
      `SELECT r.id, r.rider_id, r.driver_id, r.pickup_address, r.dropoff_address, r.estimated_fare, r.final_fare, r.ride_status, r.payment_status, r.payment_method, r.ride_type, r.created_at, r.booking_time,
       p.full_name AS rider_name, p.phone AS rider_phone
       FROM rides r
       LEFT JOIN profiles p ON r.rider_id = p.id
       ORDER BY r.created_at DESC LIMIT 500`
    );

    return c.json({ success: true, data: rides });
  } catch (err: any) {
    console.error('[Admin Rides Error]:', err.message);
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 6. Platform Wallets Endpoint
admin.get('/wallet', async (c) => {
  try {
    const wallets = await executeQuery(
      c.env,
      `SELECT w.id, w.profile_id, w.wallet_balance, w.wallet_status, w.updated_at,
       p.full_name, p.phone, p.email, p.role
       FROM wallets w
       JOIN profiles p ON w.profile_id = p.id
       ORDER BY w.updated_at DESC LIMIT 500`
    );

    const txs = await executeQuery(
      c.env,
      `SELECT wt.*, w.profile_id FROM wallet_transactions wt JOIN wallets w ON wt.wallet_id = w.id ORDER BY wt.created_at DESC LIMIT 500`
    );

    return c.json({ success: true, data: { wallets, transactions: txs } });
  } catch (err: any) {
    console.error('[Admin Wallet Error]:', err.message);
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 7. Settlements Endpoint
admin.get('/settlements', async (c) => {
  try {
    const settlements = await executeQuery(
      c.env,
      `SELECT ds.*, dp.driver_code, p.full_name, p.phone
       FROM driver_settlements ds
       JOIN driver_profiles dp ON ds.driver_id = dp.id
       JOIN profiles p ON dp.profile_id = p.id
       ORDER BY ds.created_at DESC LIMIT 500`
    );

    return c.json({ success: true, data: settlements });
  } catch (err: any) {
    console.error('[Admin Settlements Error]:', err.message);
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 8. Bulk Settings Update Endpoint
admin.put('/settings/bulk', async (c) => {
  try {
    const settings = await c.req.json();
    if (Array.isArray(settings)) {
      for (const item of settings) {
        if (item.key && item.value !== undefined) {
          await executeQuery(
            c.env,
            `INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?`,
            [item.key, String(item.value), String(item.value)]
          );
        }
      }
    }
    return c.json({ success: true, message: 'Settings saved successfully.' });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

export default admin;
