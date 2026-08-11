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

    const result = await executeQuery(
      c.env,
      `INSERT INTO rides 
       (rider_id, pickup_address, dropoff_address, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, estimated_fare, ride_type, ride_status, booking_time) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Searching', NOW())`,
      [rider_id, pickup_address, dropoff_address, pickup_lat || 0, pickup_lng || 0, dropoff_lat || 0, dropoff_lng || 0, estimated_fare || 0, ride_type || 'Taxi']
    );

    return c.json({ success: true, message: 'Ride booked successfully.', ride_id: (result as any).insertId });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

export default ride;
