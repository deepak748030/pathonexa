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
  const accountKey = user?.id || '';
  const paged = useInfiniteData<ApiNotification>({ fetchPage, resetKey: `${accountKey || 'signed-out'}:${unreadOnly}` });
  const [storedUnreadCount, setUnreadCount] = React.useState(0);
  const [storedTotalCount, setTotalCount] = React.useState(0);
  const [countAccountId, setCountAccountId] = React.useState('');
  const unreadCount = countAccountId === accountKey ? storedUnreadCount : 0;
  const totalCount = countAccountId === accountKey ? storedTotalCount : 0;
  const countRequestVersion = React.useRef(0);
  const currentAccount = React.useRef(accountKey);
  currentAccount.current = accountKey;

  const refreshCount = React.useCallback(async () => {
    const version = ++countRequestVersion.current;
    const accountId = accountKey;
    if (!isAuthenticated || !accountId) {
      setCountAccountId('');
      setUnreadCount(0);
      setTotalCount(0);
      return;
    }
    try {
      const [unreadResult, totalResult] = await Promise.all([
        api.notifications.count(), api.notifications.list({ page: 1, limit: 1 }),
      ]);
      if (version !== countRequestVersion.current || accountId !== currentAccount.current) return;
      setCountAccountId(accountId);
      setUnreadCount(unreadResult.unread);
      setTotalCount(totalResult.pagination.total);
    } catch (error) {
      if (version === countRequestVersion.current && accountId === currentAccount.current) {
        setCountAccountId(accountId);
        setUnreadCount(0);
        setTotalCount(0);
      }
      throw error;
    }
  }, [accountKey, isAuthenticated]);

  React.useEffect(() => { refreshCount().catch(() => undefined); }, [refreshCount, paged.total]);

  const markRead = React.useCallback(async (id: string) => {
    const accountId = accountKey;
    const current = paged.items.find((item) => item.id === id);
    if (!accountId || !current || current.read) return;
    const previousCount = unreadCount;
    paged.updateItem(id, { read: true });
    setCountAccountId(accountId);
    setUnreadCount(Math.max(0, previousCount - 1));
    try {
      await api.notifications.markRead(id);
    } catch (error) {
      if (accountId !== currentAccount.current) return;
      paged.updateItem(id, { read: false });
      setUnreadCount(previousCount);
      throw error;
    }
  }, [accountKey, paged, unreadCount]);

  const markAllRead = React.useCallback(async () => {
    const accountId = accountKey;
    if (!accountId) return;
    const unread = paged.items.filter((item) => !item.read);
    unread.forEach((item) => paged.updateItem(item.id, { read: true }));
    const previousCount = unreadCount;
    setCountAccountId(accountId);
    setUnreadCount(0);
    try {
      await api.notifications.markAllRead();
    } catch (error) {
      if (accountId !== currentAccount.current) return;
      unread.forEach((item) => paged.updateItem(item.id, { read: false }));
      setUnreadCount(previousCount);
      throw error;
    }
  }, [accountKey, paged, unreadCount]);

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
