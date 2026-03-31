'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Bell, Check, Trash2, Shield, FileCheck, AlertTriangle } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import { apiRequest } from '@/lib/queryClient';

interface Notification {
  _id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  role: string;
  metadata?: any;
}

export default function NotificationBell() {
  const { address, connected, walletInfo } = useWallet();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const getActiveRole = () => {
    if (!walletInfo?.roles) return null;
    const { isAdmin, isIssuer, isVerifier, isAuditor } = walletInfo.roles;
    if (isAdmin) return 'ADMIN';
    if (isIssuer) return 'ISSUER';
    if (isVerifier) return 'VERIFIER';
    if (isAuditor) return 'AUDITOR';
    return null;
  };

  const fetchNotifications = async () => {
    if (!address) return;
    try {
      const role = getActiveRole();
      const res = await apiRequest('GET', `/api/notifications/${address}?role=${role || ''}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error: any) {
      if (!error?.message?.includes('403') && !error?.message?.includes('401')) {
        console.error('Error fetching notifications:', error);
      }
    }
  };

  useEffect(() => {
    if (connected && address) {
      fetchNotifications();

      const socketUrl = typeof window !== 'undefined' 
        ? `${window.location.protocol}//${window.location.hostname}:5001`
        : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

      const newSocket = io(socketUrl, {
        withCredentials: true,
        transports: ['polling', 'websocket']
      });
      setSocket(newSocket);

      newSocket.on('connect', () => {
        newSocket.emit('join', address);
      });

      newSocket.on('notification', (notif: Notification) => {
        setNotifications(prev => [notif, ...prev]);
        toast.success(notif.message, {
            icon: <Bell className="w-4 h-4 text-blue-500" />,
            duration: 5000
        });
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [connected, address]);

  const markAsRead = async (id: string) => {
    try {
      const res = await apiRequest('PATCH', `/api/notifications/${id}/read`);
      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const res = await apiRequest('DELETE', `/api/notifications/${id}`);
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n._id !== id));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'DOCUMENT_REGISTERED': return <FileCheck className="w-4 h-4 text-green-500" />;
      case 'ACCESS_GRANTED': return <Shield className="w-4 h-4 text-blue-500" />;
      case 'SYSTEM_ALERT': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 mt-2 w-80 max-h-[480px] overflow-hidden bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 flex flex-col"
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-semibold text-white">Notifications</h3>
                <span className="text-xs text-slate-400">{unreadCount} unread</span>
              </div>

              <div className="overflow-y-auto flex-1 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n._id}
                      className={`p-4 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors group ${!n.isRead ? 'bg-blue-900/10' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className="mt-1">{getIcon(n.type)}</div>
                        <div className="flex-1 space-y-1">
                          <p className={`text-sm ${!n.isRead ? 'text-white font-medium' : 'text-slate-400'}`}>
                            {n.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-500">
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                            </span>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!n.isRead && (
                                <button 
                                  onClick={() => markAsRead(n._id)}
                                  className="p-1 hover:text-green-500 text-slate-500 transition-colors"
                                  title="Mark as read"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              )}
                              <button 
                                onClick={() => deleteNotification(n._id)}
                                className="p-1 hover:text-red-500 text-slate-500 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 bg-slate-800/50 text-center">
                <button 
                   onClick={() => setIsOpen(false)}
                   className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
