import { Server } from 'socket.io';
import Logger from '../utils/logger.js';
import { handleTrackingEvents } from './tracking.js';

let io = null;
const userSockets = new Map(); // Maps user_id -> socket_id
const activeDrivers = new Set(); // Set of driver IDs online

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    pingInterval: 10000,
    pingTimeout: 5000
  });

  io.on('connection', (socket) => {
    Logger.socket(`Socket connected: ${socket.id}`);

    // Register user session mapping
    socket.on('auth:register', (data) => {
      const { userId, role } = data;
      if (userId) {
        userSockets.set(userId, socket.id);
        socket.userId = userId;
        socket.role = role;
        
        if (role === 'driver') {
          activeDrivers.add(userId);
          io.emit('driver:count_update', { count: activeDrivers.size });
        }
        
        Logger.socket(`User ${userId} (${role}) registered on socket: ${socket.id}`);
      }
    });

    // Handle tracking coordinates and rooms
    handleTrackingEvents(io, socket, userSockets);

    // Heartbeat check
    socket.on('heartbeat', () => {
      socket.emit('heartbeat:ack', { time: Date.now() });
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      Logger.socket(`Socket disconnected: ${socket.id}`);
      if (socket.userId) {
        userSockets.delete(socket.userId);
        if (socket.role === 'driver') {
          activeDrivers.delete(socket.userId);
          io.emit('driver:count_update', { count: activeDrivers.size });
        }
        Logger.socket(`User mapping cleared for: ${socket.userId}`);
      }
    });
  });

  return io;
};

export const getIo = () => io;

export const sendToUser = (userId, eventName, payload) => {
  if (io) {
    const socketId = userSockets.get(userId);
    if (socketId) {
      io.to(socketId).emit(eventName, payload);
      return true;
    }
  }
  return false;
};

export const getOnlineDriverCount = () => activeDrivers.size;
export default initializeSocket;
