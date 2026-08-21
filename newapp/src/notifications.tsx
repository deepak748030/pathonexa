import React from 'react';

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

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notification-1',
    icon: 'file-check-outline',
    tone: 'green',
    title: 'Report ready for review',
    message: 'Ramesh Kumar’s CBC report has been completed and is ready to review.',
    time: '2 min ago',
    day: 'Today',
    unread: true,
    route: '/reports',
  },
  {
    id: 'notification-2',
    icon: 'cash-check',
    tone: 'blue',
    title: 'Payment received',
    message: 'A payment of ₹450 was received for report RP250726002.',
    time: '18 min ago',
    day: 'Today',
    unread: true,
    route: '/reports',
  },
  {
    id: 'notification-3',
    icon: 'account-plus-outline',
    tone: 'purple',
    title: 'New patient added',
    message: 'Sita Devi was added to the patient directory.',
    time: '42 min ago',
    day: 'Today',
    unread: true,
    route: '/patients',
  },
  {
    id: 'notification-4',
    icon: 'alert-circle-outline',
    tone: 'orange',
    title: 'Pending report reminder',
    message: '12 reports are still pending completion today.',
    time: '1 hr ago',
    day: 'Today',
    unread: false,
    route: '/reports',
  },
  {
    id: 'notification-5',
    icon: 'flask-outline',
    tone: 'red',
    title: 'Critical result flagged',
    message: 'A platelet result requires attention before the report is released.',
    time: '3 hrs ago',
    day: 'Today',
    unread: false,
    route: '/reports',
  },
  {
    id: 'notification-6',
    icon: 'cloud-check-outline',
    tone: 'green',
    title: 'Data backup completed',
    message: 'Your scheduled lab data backup completed successfully.',
    time: '5 hrs ago',
    day: 'Today',
    unread: false,
  },
  {
    id: 'notification-7',
    icon: 'motorbike',
    tone: 'blue',
    title: 'Sample collection assigned',
    message: 'A home sample collection was assigned for patient Mohit Sharma.',
    time: 'Yesterday, 5:20 PM',
    day: 'Yesterday',
    unread: false,
    route: '/patients',
  },
  {
    id: 'notification-8',
    icon: 'share-variant-outline',
    tone: 'purple',
    title: 'Report shared',
    message: 'The thyroid profile report was shared with Pooja Kumari.',
    time: 'Yesterday, 2:05 PM',
    day: 'Yesterday',
    unread: false,
    route: '/reports',
  },
  {
    id: 'notification-9',
    icon: 'doctor',
    tone: 'orange',
    title: 'Doctor commission due',
    message: 'Commission payout for Dr. Rakesh Kumar is pending.',
    time: 'Yesterday, 11:30 AM',
    day: 'Yesterday',
    unread: false,
  },
  {
    id: 'notification-10',
    icon: 'account-edit-outline',
    tone: 'blue',
    title: 'Patient details updated',
    message: 'Contact details for Arjun Singh were updated.',
    time: '25 Jul, 4:40 PM',
    day: 'Earlier',
    unread: false,
    route: '/patients',
  },
  {
    id: 'notification-11',
    icon: 'file-send-outline',
    tone: 'green',
    title: 'Report delivered',
    message: 'The lipid profile report was delivered successfully.',
    time: '25 Jul, 1:15 PM',
    day: 'Earlier',
    unread: false,
    route: '/reports',
  },
  {
    id: 'notification-12',
    icon: 'shield-check-outline',
    tone: 'purple',
    title: 'Account activity verified',
    message: 'Your recent sign-in was verified successfully.',
    time: '24 Jul, 9:10 AM',
    day: 'Earlier',
    unread: false,
  },
];

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationContext = React.createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState(INITIAL_NOTIFICATIONS);

  const markRead = React.useCallback((id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id && notification.unread ? { ...notification, unread: false } : notification,
      ),
    );
  }, []);

  const markAllRead = React.useCallback(() => {
    setNotifications((current) =>
      current.map((notification) => (notification.unread ? { ...notification, unread: false } : notification)),
    );
  }, []);

  const unreadCount = React.useMemo(
    () => notifications.reduce((count, notification) => count + (notification.unread ? 1 : 0), 0),
    [notifications],
  );

  const value = React.useMemo(
    () => ({ notifications, unreadCount, markRead, markAllRead }),
    [notifications, unreadCount, markRead, markAllRead],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const value = React.useContext(NotificationContext);
  if (!value) throw new Error('useNotifications must be used inside NotificationProvider');
  return value;
}
