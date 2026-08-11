import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './config/db';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import rideRoutes from './routes/ride';
import paymentRoutes from './routes/payment';
import documentRoutes from './routes/document';
import { handleWebSocketRequest } from './websocket';

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for frontend web app
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-JWT-Token'],
  exposeHeaders: ['X-JWT-Token'],
}));

// Edge Health check endpoint
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    environment: 'cloudflare-workers',
    timestamp: new Date().toISOString(),
  });
});

// WebSocket upgrade handler for realtime location tracking
app.get('/socket.io/', (c) => {
  return handleWebSocketRequest(c.req.raw);
});

// Register Edge Sub-routers
app.route('/api/auth', authRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/rides', rideRoutes);
app.route('/api/payments', paymentRoutes);
app.route('/api/documents', documentRoutes);

// Root fallback handler
app.get('/', (c) => {
  return c.text('ZipRide Cloudflare Workers Backend API is online.');
});

export default app;
