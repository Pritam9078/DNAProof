import { Server as SocketServer } from 'socket.io';
import { Notification } from './models/Notification';
import { storage } from './storage';

let io: SocketServer;

export const initNotificationService = (socketServer: SocketServer) => {
  io = socketServer;

  io.on('connection', (socket) => {
    console.log('User connected to notifications:', socket.id);

    socket.on('join', (userAddress: string) => {
      if (userAddress) {
        socket.join(userAddress.toLowerCase());
        console.log(`User ${userAddress} joined their notification room`);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected from notifications');
    });
  });
};

interface CreateNotificationParams {
  userAddress?: string;
  role: "ADMIN" | "ISSUER" | "VERIFIER" | "AUDITOR" | "ALL";
  type: string;
  message: string;
  metadata?: any;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    const notification = new Notification({
      userAddress: params.userAddress?.toLowerCase(),
      role: params.role,
      type: params.type,
      message: params.message,
      metadata: params.metadata || {},
      isRead: false,
      createdAt: new Date()
    });

    await notification.save();

    // Emit to specific user if address provided
    if (params.userAddress) {
      io.to(params.userAddress.toLowerCase()).emit('notification', notification);
    }

    // Emit to role room (optional: we can have role rooms too)
    io.to(`role:${params.role}`).emit('notification', notification);
    
    // Always emit to ADMIN if not already targeted
    if (params.role !== 'ADMIN') {
        io.to(`role:ADMIN`).emit('notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
