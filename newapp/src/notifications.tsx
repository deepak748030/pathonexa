import React from 'react';
import { api, type ApiNotification, type Paged } from './api';
import { useAuth } from './auth';
import { useFeedback } from './feedback';
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
  const { toast } = useFeedback();
  const [unreadOnly, setUnreadOnly] = React.useState(false);
  // IDs we marked read in this session. They must stay read across list
  // refetches even when a server response still lags behind our mark request.
  const localReadRef = React.useRef<Set<string>>(new Set());
  // Number of mark-read requests still in flight. While one is pending the
  // server count may not include it yet, so we never apply a stale count.
  const pendingMutationsRef = React.useRef(0);

  const fetchPage = React.useCallback(async (page: number): Promise<Paged<ApiNotification>> => {
    if (!isAuthenticated) return { items: [], pagination: { page: 1, limit: 10, total: 0, pages: 0, hasMore: false } };
    const response = await api.notifications.list({ page, limit: 10, unread: unreadOnly || undefined });
    const localRead = localReadRef.current;
    // Never let a lagging server response resurrect a notification we just read.
    const items = response.items.some((item) => localRead.has(item.id))
      ? response.items.map((item) => (localRead.has(item.id) ? { ...item, read: true } : item))
      : response.items;
    return { ...response, items };
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
      // A mark-read request may still be in flight — the server count does
      // not include it yet. Applying it would flip the badge back to unread,
      // so we skip this round; the post-mutation refresh syncs the truth.
      if (pendingMutationsRef.current > 0) return;
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
    localReadRef.current.add(id);
    pendingMutationsRef.current += 1;
    paged.updateItem(id, { read: true });
    setCountAccountId(accountId);
    setUnreadCount(Math.max(0, previousCount - 1));
    try {
      await api.notifications.markRead(id);
    } catch (error) {
      // Server never marked it read — restore the previous state and tell
      // the user why the unread badge came back.
      localReadRef.current.delete(id);
      pendingMutationsRef.current = Math.max(0, pendingMutationsRef.current - 1);
      if (accountId !== currentAccount.current) return;
      paged.updateItem(id, { read: false });
      setUnreadCount(previousCount);
      toast({
        kind: 'error',
        title: 'Could not mark as read',
        message: error instanceof Error && error.message ? error.message : 'Connection problem — the notification stays unread. Tap it again.',
      });
      throw error;
    }
    pendingMutationsRef.current = Math.max(0, pendingMutationsRef.current - 1);
    // The server has committed the change — sync the authoritative count.
    refreshCount().catch(() => undefined);
  }, [accountKey, paged, unreadCount, refreshCount, toast]);

  const markAllRead = React.useCallback(async () => {
    const accountId = accountKey;
    if (!accountId) return;
    const unread = paged.items.filter((item) => !item.read);
    if (unread.length === 0) return;
    unread.forEach((item) => {
      localReadRef.current.add(item.id);
      paged.updateItem(item.id, { read: true });
    });
    pendingMutationsRef.current += 1;
    const previousCount = unreadCount;
    setCountAccountId(accountId);
    setUnreadCount(0);
    try {
      await api.notifications.markAllRead();
    } catch (error) {
      pendingMutationsRef.current = Math.max(0, pendingMutationsRef.current - 1);
      unread.forEach((item) => {
        localReadRef.current.delete(item.id);
        paged.updateItem(item.id, { read: false });
      });
      if (accountId !== currentAccount.current) return;
      setUnreadCount(previousCount);
      toast({
        kind: 'error',
        title: 'Could not mark all as read',
        message: error instanceof Error && error.message ? error.message : 'Connection problem — please try again.',
      });
      throw error;
    }
    pendingMutationsRef.current = Math.max(0, pendingMutationsRef.current - 1);
    // The server has committed the change — sync the authoritative count.
    refreshCount().catch(() => undefined);
  }, [accountKey, paged, unreadCount, refreshCount, toast]);

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
