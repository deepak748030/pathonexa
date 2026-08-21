import React from 'react';
import { api, type ApiNotification, type Paged } from './api';
import { useAuth } from './auth';
import { useInfiniteData } from './useInfiniteData';

export type NotificationTone = 'blue' | 'green' | 'orange' | 'purple' | 'red';

export interface AppNotification {
  id: string;
  icon: string;
  tone: NotificationTone;
  title: string;
  message: string;
  time: string;
  day: 'Today' | 'Yesterday' | 'Earlier';
  unread: boolean;
  route?: '/patients' | '/reports' | '/report-preview';
}

function formatNotification(item: ApiNotification): AppNotification {
  const at = new Date(item.at || Date.now());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const itemDay = new Date(at);
  itemDay.setHours(0, 0, 0, 0);
  const difference = Math.round((today.getTime() - itemDay.getTime()) / 86_400_000);
  const day = difference <= 0 ? 'Today' : difference === 1 ? 'Yesterday' : 'Earlier';
  const time = day === 'Today'
    ? at.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : at.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const type = item.type.toLowerCase();
  const tone = ['blue', 'green', 'orange', 'purple', 'red'].includes(item.tone || '')
    ? item.tone as NotificationTone
    : type.includes('payment') ? 'blue' : type.includes('pending') ? 'orange' : 'green';
  const icon = type.includes('payment')
    ? 'cash-check'
    : type.includes('patient')
      ? 'account-plus-outline'
      : type.includes('subscription')
        ? 'calendar-alert'
        : type.includes('commission')
          ? 'doctor'
          : 'file-check-outline';
  const route = item.reportId || type.includes('report') || type.includes('payment')
    ? '/reports'
    : item.patientId || type.includes('patient')
      ? '/patients'
      : undefined;
  return {
    id: item.id,
    icon,
    tone,
    title: item.title,
    message: item.subtitle || '',
    time,
    day,
    unread: !item.read,
    route,
  };
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  totalCount: number;
  unreadOnly: boolean;
  setUnreadOnly: (value: boolean) => void;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = React.createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [unreadOnly, setUnreadOnly] = React.useState(false);
  const fetchPage = React.useCallback(async (page: number): Promise<Paged<ApiNotification>> => {
    if (!isAuthenticated) return { items: [], pagination: { page: 1, limit: 10, total: 0, pages: 0, hasMore: false } };
    return api.notifications.list({ page, limit: 10, unread: unreadOnly || undefined });
  }, [isAuthenticated, unreadOnly]);
  const paged = useInfiniteData<ApiNotification>({ fetchPage, resetKey: `${user?.id || 'signed-out'}:${unreadOnly}` });
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);

  const refreshCount = React.useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setTotalCount(0);
      return;
    }
    const [unreadResult, totalResult] = await Promise.all([
      api.notifications.count(), api.notifications.list({ page: 1, limit: 1 }),
    ]);
    setUnreadCount(unreadResult.unread);
    setTotalCount(totalResult.pagination.total);
  }, [isAuthenticated]);

  React.useEffect(() => { refreshCount().catch(() => setUnreadCount(0)); }, [refreshCount, paged.total]);

  const markRead = React.useCallback(async (id: string) => {
    const current = paged.items.find((item) => item.id === id);
    if (!current || current.read) return;
    paged.updateItem(id, { read: true });
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await api.notifications.markRead(id);
    } catch (error) {
      paged.updateItem(id, { read: false });
      setUnreadCount((count) => count + 1);
      throw error;
    }
  }, [paged]);

  const markAllRead = React.useCallback(async () => {
    const unread = paged.items.filter((item) => !item.read);
    unread.forEach((item) => paged.updateItem(item.id, { read: true }));
    const previousCount = unreadCount;
    setUnreadCount(0);
    try {
      await api.notifications.markAllRead();
    } catch (error) {
      unread.forEach((item) => paged.updateItem(item.id, { read: false }));
      setUnreadCount(previousCount);
      throw error;
    }
  }, [paged, unreadCount]);

  const refresh = React.useCallback(async () => {
    await Promise.all([paged.refresh(), refreshCount()]);
  }, [paged, refreshCount]);

  const notifications = React.useMemo(() => paged.items.map(formatNotification), [paged.items]);
  const value = React.useMemo<NotificationContextValue>(() => ({
    notifications,
    unreadCount,
    totalCount,
    unreadOnly,
    setUnreadOnly,
    isLoading: paged.isLoading,
    isLoadingMore: paged.isLoadingMore,
    isRefreshing: paged.isRefreshing,
    hasMore: paged.hasMore,
    error: paged.error,
    loadMore: paged.loadMore,
    refresh,
    markRead,
    markAllRead,
  }), [markAllRead, markRead, notifications, paged.error, paged.hasMore, paged.isLoading, paged.isLoadingMore, paged.isRefreshing, paged.loadMore, refresh, totalCount, unreadCount, unreadOnly]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const value = React.useContext(NotificationContext);
  if (!value) throw new Error('useNotifications must be used inside NotificationProvider');
  return value;
}
