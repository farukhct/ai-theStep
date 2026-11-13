import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppNotification } from '../types';

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface NotificationContextType {
  notifications: AppNotification[];
  toasts: ToastItem[];
  unreadCount: number;
  addToast: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  addNotification: (title: string, message: string, type?: 'order' | 'inventory' | 'payment' | 'security' | 'system', link?: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  playAlertSound: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('sd_notifications');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return [
      {
        id: 'notif-1',
        title: 'New EPS bKash Order #SD-26-8891',
        message: 'Order ৳7,960 received from Tanvir Ahmed (Gulshan-2, Dhaka).',
        type: 'order',
        isRead: false,
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'notif-2',
        title: 'Flash Deal Stock Low: SD-GAD-001',
        message: 'Amazfit Active Titanium AMOLED Smart Watch has only 5 Flash units left.',
        type: 'inventory',
        isRead: false,
        timestamp: new Date(Date.now() - 7200000).toISOString()
      }
    ];
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    localStorage.setItem('sd_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {
      // AudioContext blocked until gesture
    }
  };

  const addToast = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    playAlertSound();

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const addNotification = (
    title: string,
    message: string,
    type: 'order' | 'inventory' | 'payment' | 'security' | 'system' = 'order',
    link?: string
  ) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      isRead: false,
      timestamp: new Date().toISOString(),
      link
    };
    setNotifications((prev) => [newNotif, ...prev]);
    addToast(title, message, type === 'security' || type === 'inventory' ? 'warning' : 'success');
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        toasts,
        unreadCount,
        addToast,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        playAlertSound
      }}
    >
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-20 sm:bottom-5 right-4 z-[70] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-lg shadow-xl border backdrop-blur-md transition-all duration-200 ${
              toast.type === 'success'
                ? 'bg-[#292933]/95 text-white border-[#3f3f4e]'
                : toast.type === 'warning'
                ? 'bg-amber-950/95 text-amber-100 border-amber-800'
                : toast.type === 'error'
                ? 'bg-rose-950/95 text-rose-100 border-rose-800'
                : 'bg-[#292933]/95 text-neutral-100 border-neutral-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-[11px] font-bold tracking-wider uppercase text-[#ff7645]">
                  {toast.title}
                </h4>
                <p className="text-xs font-medium mt-0.5 leading-snug">{toast.message}</p>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-neutral-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};
