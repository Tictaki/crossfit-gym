'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  XMarkIcon, 
  BellIcon, 
  CheckCircleIcon, 
  TrashIcon,
  FunnelIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { notificationService } from '@/lib/notifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

export default function NotificationsModal({ isOpen, onClose, onUpdate }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, pages: 1, total: 0 });
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchNotifications = async (page = 1, append = false) => {
    setLoading(true);
    try {
      const data = await notificationService.getAll(page, pagination.limit, unreadOnly);
      if (append) {
        setNotifications(prev => [...prev, ...data.notifications]);
      } else {
        setNotifications(data.notifications);
      }
      setPagination(data.pagination);
      if (onUpdate) onUpdate(data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1);
    }
  }, [isOpen, unreadOnly]);

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages) {
      fetchNotifications(pagination.page + 1, true);
    }
  };

  const handleMarkAsRead = async (id, entity, entityId, isRead) => {
    try {
      // 1. Mark as read on backend if not already read
      if (!isRead) {
        await notificationService.markAsRead(id);
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        
        // Update parent counter
        const unreadCount = notifications.filter(n => !n.read).length - 1;
        if (onUpdate) onUpdate(Math.max(0, unreadCount));
      }
    } catch (error) {
      console.error('Error marking as read', error);
      // We continue to navigation even if markAsRead fails (e.g., if already marked by another session)
    }

    // 2. Navigate if entity provided
    if (entity && entityId) {
      onClose();
      switch (entity) {
        case 'MEMBER':
          router.push(`/dashboard/members/${entityId}`);
          break;
        case 'PAYMENT':
          router.push('/dashboard/payments');
          break;
        case 'PLAN':
          router.push('/dashboard/plans');
          break;
        default:
          break;
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      if (onUpdate) onUpdate(0);
    } catch (error) {
      console.error('Error marking all as read', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationService.delete(id);
      const deletedNotification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      // Update unread count if deleted notification was unread
      if (deletedNotification && !deletedNotification.read) {
        const unreadCount = notifications.filter(n => !n.read).length - 1;
        if (onUpdate) onUpdate(Math.max(0, unreadCount));
      }
    } catch (error) {
      console.error('Error deleting notification', error);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Tem a certeza que deseja limpar todo o histórico de notificações?')) return;
    
    try {
      setLoading(true);
      await notificationService.deleteAll();
      setNotifications([]);
      if (onUpdate) onUpdate(0);
    } catch (error) {
      console.error('Error clearing all notifications', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div className="absolute inset-0 bg-dark-950/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md animate-slide-in-right">
          <div className="h-full flex flex-col bg-white/90 dark:bg-dark-900/95 backdrop-blur-xl shadow-2xl border-l border-white/20 dark:border-dark-800">
            {/* Header */}
            <div className="px-6 py-6 border-b border-gray-100 dark:border-dark-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
                  <BellIcon className="h-7 w-7 text-primary-500" />
                  Atividade do Sistema
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-xl transition-colors">
                  <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-dark-300" />
                </button>
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <button 
                  onClick={() => setUnreadOnly(!unreadOnly)}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                    ${unreadOnly 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-dark-300 hover:bg-gray-200 dark:hover:bg-dark-700'}
                  `}
                >
                  <FunnelIcon className="h-3.5 w-3.5" />
                  {unreadOnly ? 'A mostrar: Não lidas' : 'Todas as notificações'}
                </button>

                {notifications.some(n => !n.read) && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                  >
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                    Marcar tudo como lido
                  </button>
                )}

                {notifications.length > 0 && (
                  <button 
                    onClick={handleClearAll}
                    className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Limpar histórico
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {notifications.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                  <div className="h-20 w-20 rounded-full bg-gray-50 dark:bg-dark-800 flex items-center justify-center">
                    <BellIcon className="h-10 w-10 text-gray-300 dark:text-dark-700" />
                  </div>
                  <div>
                    <p className="text-dark-900 dark:text-white font-bold">Nenhuma atividade encontrada</p>
                    <p className="text-sm text-gray-500 dark:text-dark-400">Verifique novamente mais tarde ou mude os filtros.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      onClick={() => handleMarkAsRead(notification.id, notification.entity, notification.entityId, notification.read)}
                      className={`
                        p-4 rounded-2xl transition-all cursor-pointer group relative
                        ${!notification.read 
                          ? 'bg-white dark:bg-dark-800/50 shadow-sm border border-primary-100/50 dark:border-primary-900/20' 
                          : 'hover:bg-gray-50 dark:hover:bg-dark-800/20 opacity-70'}
                      `}
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          {notification.type === 'WARNING' || notification.type === 'DELETE' ? (
                            <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                              <XMarkIcon className="h-5 w-5" />
                            </div>
                          ) : notification.type === 'UPDATE' ? (
                            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                              <CheckCircleIcon className="h-5 w-5" />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold uppercase">
                              {notification.actor.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                             <p className={`text-sm mb-1 leading-snug ${!notification.read ? 'font-bold text-dark-900 dark:text-white' : 'text-dark-600 dark:text-dark-400'}`}>
                              {notification.message}
                            </p>
                            {!notification.read && (
                              <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary-500 mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                            <span className="text-dark-700 dark:text-dark-300">{notification.actor}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ptBR })}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center">
                          <button
                            onClick={(e) => handleDeleteNotification(e, notification.id)}
                            className="p-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            title="Apagar"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pagination.page < pagination.pages && (
                <div className="p-4">
                  <button 
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="w-full py-3 rounded-2xl border border-dashed border-gray-200 dark:border-dark-700 text-sm font-bold text-gray-500 dark:text-dark-400 hover:bg-gray-50 dark:hover:bg-dark-800 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                    ) : (
                      <>
                        <ChevronDownIcon className="h-4 w-4" />
                        Carregar mais histórico
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-dark-800 bg-gray-50/50 dark:bg-dark-950/20">
               <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  <span>Audit Trail Active</span>
                  <span>{pagination.total} Registos</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
