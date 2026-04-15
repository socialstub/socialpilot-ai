'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotificationType = 'comment' | 'publish' | 'engagement' | 'reminder' | 'follower_milestone';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  platform: string;
  timestamp: string;
  read: boolean;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  subscribe: (types: NotificationType[]) => void;
  unsubscribe: (types: NotificationType[]) => void;
  connect: () => void;
  disconnect: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useNotifications(): UseNotificationsReturn {
  const socketRef = useRef<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [newNotificationId, setNewNotificationId] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io('/?XTransformPort=3010', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('welcome', (data: { notifications: Notification[] }) => {
      setNotifications(data.notifications || []);
    });

    socket.on('notification', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 20));
      setNewNotificationId(notification.id);
      // Clear the animation trigger after a delay
      setTimeout(() => setNewNotificationId(null), 600);
    });

    socket.on('notification_read', (data: { id: string }) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === data.id ? { ...n, read: true } : n))
      );
    });

    socket.on('all_read', () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    });

    socket.on('subscribed', () => {
      // Subscription confirmed
    });

    socketRef.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    socketRef.current?.emit('mark_as_read', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    socketRef.current?.emit('mark_all_read');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const subscribe = useCallback((types: NotificationType[]) => {
    socketRef.current?.emit('subscribe', types);
  }, []);

  const unsubscribe = useCallback((types: NotificationType[]) => {
    socketRef.current?.emit('unsubscribe', types);
  }, []);

  // Auto-connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
    // connect and disconnect are stable via useCallback
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    subscribe,
    unsubscribe,
    connect,
    disconnect,
  };
}
