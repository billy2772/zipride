import { Hono } from 'hono';
import { executeQuery, Env } from '../config/db';

const ride = new Hono<{ Bindings: Env }>();

// Get active ride for a rider
ride.get('/active', async (c) => {
  const riderId = c.req.query('riderId');
  if (!riderId) {
    return c.json({ success: false, message: 'Rider ID required' }, 400);
  }

  try {
    const rides = await executeQuery(
      c.env,
      `SELECT * FROM rides 
       WHERE rider_id = ? 
       AND ride_status IN ('Searching', 'Driver Assigned', 'Driver Accepted', 'Driver Arrived', 'OTP Verified', 'Ride Started') 
       ORDER BY created_at DESC LIMIT 1`,
      [riderId]
    );

    return c.json({ success: true, data: rides[0] || null });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Book / Create a new ride
ride.post('/book', async (c) => {
  try {
    const body = await c.req.json();
    const { rider_id, pickup_address, dropoff_address, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, estimated_fare, ride_type } = body;

    if (!rider_id || !pickup_address || !dropoff_address) {
      return c.json({ success: false, message: 'Missing required ride parameters' }, 400);
    }

    const result: any = await executeQuery(
      c.env,
      `INSERT INTO rides 
       (rider_id, pickup_address, dropoff_address, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, estimated_fare, ride_type, ride_status, booking_time, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Searching', NOW(), NOW(), NOW())`,
      [rider_id, pickup_address, dropoff_address, pickup_lat || 0, pickup_lng || 0, dropoff_lat || 0, dropoff_lng || 0, estimated_fare || 0, ride_type || 'Taxi']
    );

    const insertedId = result?.insertId || result?.lastInsertId || Date.now();

    return c.json({ success: true, message: 'Ride booked successfully.', ride_id: insertedId });
  } catch (err: any) {
    console.error('[Ride Book Error]:', err.message);
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Update Ride Status (Accept, Arrived, Start, Complete, Cancel)
ride.post('/update-status', async (c) => {
  try {
    const { ride_id, rideId, status, ride_status, driver_id, driverId } = await c.req.json();
    const targetRideId = ride_id || rideId;
    const targetStatus = ride_status || status;
    const targetDriverId = driver_id || driverId;

    if (!targetRideId || !targetStatus) {
      return c.json({ success: false, message: 'Ride ID and status are required' }, 400);
    }

    if (targetStatus === 'Driver Accepted' && targetDriverId) {
      await executeQuery(
        c.env,
        `UPDATE rides SET ride_status = ?, driver_id = ?, updated_at = NOW() WHERE id = ?`,
        [targetStatus, targetDriverId, targetRideId]
      );
    } else if (targetStatus === 'Ride Completed') {
      await executeQuery(
        c.env,
        `UPDATE rides SET ride_status = ?, completed_time = NOW(), updated_at = NOW() WHERE id = ?`,
        [targetStatus, targetRideId]
      );
    } else if (targetStatus === 'Cancelled') {
      await executeQuery(
        c.env,
        `UPDATE rides SET ride_status = ?, cancelled_time = NOW(), updated_at = NOW() WHERE id = ?`,
        [targetStatus, targetRideId]
      );
    } else {
      await executeQuery(
        c.env,
        `UPDATE rides SET ride_status = ?, updated_at = NOW() WHERE id = ?`,
        [targetStatus, targetRideId]
      );
    }

    return c.json({ success: true, message: `Ride status updated to ${targetStatus}` });
  } catch (err: any) {
    console.error('[Update Status Error]:', err.message);
    return c.json({ success: false, message: err.message }, 500);
  }
});

export default ride;
