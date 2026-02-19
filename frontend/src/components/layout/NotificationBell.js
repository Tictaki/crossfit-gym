'use client';

import { useState, useEffect, useRef } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { notificationService } from '@/lib/notifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getAll(1, 10);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, entity, entityId) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Navigate if entity provided
      if (entity && entityId) {
        setIsOpen(false);
        switch (entity) {
          case 'MEMBER':
            router.push(`/dashboard/members/${entityId}`);
            break;
          case 'PAYMENT':
            // Payments usually don't have a detail page, maybe list?
            router.push('/dashboard/payments');
            break;
          case 'PLAN':
            router.push('/dashboard/plans');
            break;
          default:
            break;
        }
      }
    } catch (error) {
      console.error('Error marking as read', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-dark-500 dark:text-dark-300 hover:bg-white/50 dark:hover:bg-dark-800/50 hover:text-primary-600 dark:hover:text-primary-400 transition-all active:scale-95"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white dark:border-dark-900 animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-80 sm:w-96 dropdown-glass animate-fade-in z-50 overflow-hidden shadow-2xl ring-1 ring-black/5">
          <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-dark-700/50 bg-white/40 dark:bg-dark-800/40 backdrop-blur-md">
            <h3 className="font-bold text-dark-900 dark:text-white">Notificações</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 disabled:opacity-50"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-white/60 dark:bg-dark-900/90">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-dark-400 dark:text-dark-500">
                <BellIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Nenhuma notificação recente</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-dark-800">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    onClick={() => !notification.read && handleMarkAsRead(notification.id, notification.entity, notification.entityId)}
                    className={`
                      p-4 hover:bg-white/80 dark:hover:bg-dark-800/50 transition-colors cursor-pointer group
                      ${!notification.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}
                    `}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {notification.type === 'WARNING' ? (
                          <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                            <span className="text-xs font-bold">!</span>
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                            <span className="text-xs font-bold uppercase">{notification.actor.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.read ? 'font-semibold text-dark-900 dark:text-white' : 'text-dark-600 dark:text-dark-300'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-dark-400 dark:text-dark-500 mt-1 flex items-center gap-2">
                          <span>{notification.actor}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ptBR })}</span>
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0 self-center">
                          <span className="h-2 w-2 rounded-full bg-primary-500 block"></span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-white/20 dark:border-dark-700/50 bg-white/20 dark:bg-dark-800/20 text-center">
            <button 
              onClick={() => {
                // Future: push to full notifications page
                // router.push('/dashboard/notifications');
                setIsOpen(false);
              }}
              className="text-xs font-medium text-dark-500 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white transition-colors"
            >
              Ver todas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
