import { Hono } from 'hono';
import { executeQuery, Env } from '../config/db';

const admin = new Hono<{ Bindings: Env }>();

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
    ] = await Promise.all([
      executeQuery(c.env, `SELECT COUNT(*) AS total FROM profiles WHERE role = 'rider'`),
      executeQuery(c.env, `SELECT COUNT(*) AS total FROM driver_profiles WHERE verification_status = 'Approved'`),
      executeQuery(c.env, `SELECT COUNT(*) AS total FROM driver_profiles WHERE is_online = 1`),
      executeQuery(c.env, `SELECT COUNT(*) AS total FROM driver_profiles WHERE verification_status = 'Approved' AND is_online = 0`),
      executeQuery(c.env, `SELECT COUNT(*) AS total FROM driver_profiles WHERE verification_status = 'Pending'`),
      executeQuery(c.env, `SELECT COUNT(*) AS total FROM rides`),
      executeQuery(c.env, `SELECT COUNT(*) AS total FROM rides WHERE booking_time >= CURDATE()`),
      executeQuery(c.env, `SELECT COUNT(*) AS total FROM rides WHERE completed_time >= CURDATE() AND ride_status = 'Ride Completed'`),
      executeQuery(c.env, `SELECT COUNT(*) AS total FROM rides WHERE cancelled_time >= CURDATE() AND ride_status = 'Cancelled'`),
      executeQuery(c.env, `SELECT COUNT(*) AS total FROM rides WHERE ride_status IN ('Searching','Driver Assigned','Driver Accepted','Driver Arrived','OTP Verified','Ride Started')`),
      executeQuery(c.env, `SELECT COUNT(*) AS total FROM rides WHERE payment_status = 'Pending' AND ride_status = 'Ride Completed'`),
      executeQuery(c.env, `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'Success' OR status = 'completed'`),
      executeQuery(c.env, `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE (status = 'Success' OR status = 'completed') AND created_time >= CURDATE()`),
      executeQuery(c.env, `SELECT COALESCE(SUM(wallet_balance), 0) AS total FROM wallets`),
      executeQuery(c.env, `SELECT COALESCE(AVG(rating), 0) AS avg FROM driver_profiles WHERE verification_status = 'Approved'`),
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
      averageDriverRating: parseFloat((avgRating[0] as any)?.avg || 0).toFixed(2),
      completedRides: [],
      topDrivers: [],
      topRiders: [],
    };

    return c.json({ success: true, message: 'Edge dashboard stats retrieved.', data: stats });
  } catch (err: any) {
    console.error('[Edge Admin Stats Error]:', err.message);
    return c.json({ success: false, message: err.message }, 500);
  }
});

export default admin;
