import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  ShoppingBag, 
  AlertTriangle, 
  CreditCard, 
  ShieldAlert, 
  Volume2, 
  Trash2 
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    clearNotification, 
    playAlertSound,
    unreadCount 
  } = useNotification();

  const [filter, setFilter] = useState<'all' | 'order' | 'inventory' | 'security'>('all');

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => filter === 'all' || n.type === filter);

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
      case 'inventory':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'security':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      default:
        return <Bell className="w-4 h-4 text-neutral-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-neutral-900" />
            <h3 className="text-base font-bold text-neutral-950">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-neutral-900 text-white">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={playAlertSound}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg cursor-pointer"
              title="Test Sound Chime"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills & Actions */}
        <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                filter === 'all' ? 'bg-neutral-900 text-white font-medium' : 'text-neutral-600 hover:bg-neutral-200/60'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('order')}
              className={`px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                filter === 'order' ? 'bg-neutral-900 text-white font-medium' : 'text-neutral-600 hover:bg-neutral-200/60'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setFilter('inventory')}
              className={`px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                filter === 'inventory' ? 'bg-neutral-900 text-white font-medium' : 'text-neutral-600 hover:bg-neutral-200/60'
              }`}
            >
              Stock
            </button>
            <button
              onClick={() => setFilter('security')}
              className={`px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                filter === 'security' ? 'bg-neutral-900 text-white font-medium' : 'text-neutral-600 hover:bg-neutral-200/60'
              }`}
            >
              Security
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-[11px] font-semibold text-neutral-600 hover:text-neutral-950 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark read</span>
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 p-2">
          {filtered.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-neutral-400">
              <Bell className="w-10 h-10 stroke-[1.2] text-neutral-300 mb-2" />
              <p className="text-sm font-medium text-neutral-600">All caught up</p>
              <p className="text-xs text-neutral-400 mt-0.5">No notifications matching this category.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => markAsRead(item.id)}
                className={`p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 relative group ${
                  item.isRead ? 'bg-white hover:bg-neutral-50' : 'bg-neutral-50 hover:bg-neutral-100/80 font-medium'
                }`}
              >
                <div className="p-2 rounded-lg bg-white border border-neutral-200 shrink-0 shadow-xs">
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className={`text-xs ${item.isRead ? 'font-semibold text-neutral-800' : 'font-bold text-neutral-950'}`}>
                      {item.title}
                    </h4>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-600 mt-1 leading-snug">
                    {item.message}
                  </p>
                  <span className="text-[10px] text-neutral-400 mt-1.5 block">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearNotification(item.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-600 transition-opacity absolute right-2 top-2"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
