import { Hono } from 'hono';
import { executeQuery, Env } from '../config/db';
import jwt from 'jsonwebtoken';

const auth = new Hono<{ Bindings: Env }>();

auth.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { username, phone, email, password } = body;
    const identifier = username || phone || email;

    if (!identifier || !password) {
      return c.json({ success: false, message: 'Missing credentials.' }, 400);
    }

    const rows = await executeQuery(
      c.env,
      `SELECT * FROM profiles WHERE username = ? OR phone = ? OR email = ? LIMIT 1`,
      [identifier, identifier, identifier]
    );

    if (!rows || rows.length === 0) {
      return c.json({ success: false, message: 'Invalid username/phone or password.' }, 401);
    }

    const user: any = rows[0];
    const secret = c.env.JWT_SECRET || 'zipride-production-super-secret-jwt-key-2025!@#$';

    const token = jwt.sign(
      {
        id: user.id,
        user_id: user.id,
        role: user.role,
        phone: user.phone,
        full_name: user.full_name,
      },
      secret,
      { expiresIn: '30d' }
    );

    return c.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone,
        email: user.email,
        account_status: user.account_status,
      },
    });
  } catch (err: any) {
    console.error('[Edge Login Error]:', err.message);
    return c.json({ success: false, message: err.message || 'Login failed.' }, 500);
  }
});

auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);
  const secret = c.env.JWT_SECRET || 'zipride-production-super-secret-jwt-key-2025!@#$';

  try {
    const decoded: any = jwt.verify(token, secret);
    const rows = await executeQuery(
      c.env,
      `SELECT id, full_name, role, phone, email, account_status FROM profiles WHERE id = ? LIMIT 1`,
      [decoded.id || decoded.user_id]
    );

    if (!rows || rows.length === 0) {
      return c.json({ success: false, message: 'User not found.' }, 404);
    }

    return c.json({ success: true, user: rows[0] });
  } catch (e: any) {
    return c.json({ success: false, message: 'Invalid or expired token.' }, 401);
  }
});

export default auth;
