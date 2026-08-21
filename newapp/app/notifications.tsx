import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { T } from '../components/T';
import { BlueHeader, HeaderWhiteBtn, Page, Skeleton } from '../components/kit';
import { C, PAGE_GUTTER } from '../src/theme';
import { type AppNotification, type NotificationTone, useNotifications } from '../src/notifications';

const PAGE_SIZE = 6;
const FILTERS = ['All', 'Unread'] as const;
type NotificationFilter = (typeof FILTERS)[number];

const notificationColors: Record<NotificationTone, { foreground: string; background: string }> = {
  blue: { foreground: C.primary, background: C.blueSoft },
  green: { foreground: C.green, background: C.greenSoft },
  orange: { foreground: C.orange, background: C.orangeSoft },
  purple: { foreground: C.purple, background: C.purpleSoft },
  red: { foreground: C.red, background: C.redSoft },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    notifications, unreadCount, totalCount, setUnreadOnly, markRead, markAllRead,
    isLoading, isLoadingMore, isRefreshing, hasMore, error, loadMore, refresh,
  } = useNotifications();
  const [filter, setFilter] = React.useState<NotificationFilter>('All');
  const visibleNotifications = notifications;

  React.useEffect(() => {
    setUnreadOnly(filter === 'Unread');
    return () => setUnreadOnly(false);
  }, [filter, setUnreadOnly]);

  const openNotification = React.useCallback(
    (notification: AppNotification) => {
      markRead(notification.id).catch(() => {});
      if (notification.route) router.push(notification.route);
    },
    [markRead, router],
  );

  const listHeader = (
    <>
      <BlueHeader
        title="Notifications"
        sub="Lab updates and recent activity"
        onBack={() => router.back()}
        right={unreadCount > 0 ? <HeaderWhiteBtn label="Read all" icon="check-all" onPress={() => markAllRead().catch(() => {})} /> : null}
      />

      <View style={styles.headerBody}>
        <View style={styles.summary}>
          <View style={styles.summaryIcon}>
            <MaterialCommunityIcons name="bell-outline" size={20} color={C.primary} />
          </View>
          <View style={styles.summaryText}>
            <T style={styles.summaryTitle}>{unreadCount === 0 ? 'You’re all caught up' : `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`}</T>
            <T style={styles.summarySub}>Tap an update to mark it as read and open related details.</T>
          </View>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((item) => {
            const selected = filter === item;
            const count = item === 'All' ? totalCount : unreadCount;
            return (
              <TouchableOpacity
                key={item}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[styles.filterButton, selected && styles.filterButtonActive]}
                onPress={() => setFilter(item)}
              >
                <T style={[styles.filterText, selected && styles.filterTextActive]}>{item}</T>
                <View style={[styles.filterCount, selected && styles.filterCountActive]}>
                  <T style={[styles.filterCountText, selected && styles.filterCountTextActive]}>{count}</T>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </>
  );

  return (
    <Page>
      <FlatList
        data={visibleNotifications}
        keyExtractor={(notification) => notification.id}
        ListHeaderComponent={listHeader}
        renderItem={({ item: notification, index }) => {
          const startsGroup = index === 0 || visibleNotifications[index - 1]?.day !== notification.day;
          const colors = notificationColors[notification.tone];
          return (
            <View style={styles.itemBlock}>
              {startsGroup ? <T style={styles.dayLabel}>{notification.day}</T> : null}
              <TouchableOpacity
                activeOpacity={0.72}
                accessibilityRole="button"
                accessibilityLabel={`${notification.title}. ${notification.message}`}
                style={[styles.notificationRow, startsGroup && styles.groupFirstRow, notification.unread && styles.unreadRow]}
                onPress={() => openNotification(notification)}
              >
                <View style={[styles.notificationIcon, { backgroundColor: colors.background }]}>
                  <MaterialCommunityIcons name={notification.icon as any} size={19} color={colors.foreground} />
                </View>
                <View style={styles.notificationCopy}>
                  <View style={styles.titleRow}>
                    <T style={[styles.notificationTitle, notification.unread && styles.unreadTitle]} numberOfLines={1}>
                      {notification.title}
                    </T>
                    {notification.unread ? <View style={styles.unreadDot} /> : null}
                  </View>
                  <T style={styles.notificationMessage} numberOfLines={2}>
                    {notification.message}
                  </T>
                  <T style={styles.notificationTime}>{notification.time}</T>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={C.faint} />
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletonList}>
              {Array.from({ length: 6 }, (_, index) => (
                <View key={index} style={styles.notificationSkeleton}>
                  <Skeleton width={38} height={38} radius={4} />
                  <View style={styles.skeletonCopy}><Skeleton width="55%" height={11} /><Skeleton width="88%" height={9} /><Skeleton width="35%" height={8} /></View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons name={error ? 'alert-circle-outline' : 'bell-check-outline'} size={28} color={error ? C.red : C.green} />
              </View>
              <T style={styles.emptyTitle}>{error ? 'Unable to load notifications' : filter === 'Unread' ? 'No unread notifications' : 'No notifications yet'}</T>
              <T style={styles.emptyText}>{error || 'New lab updates will appear here.'}</T>
            </View>
          )
        }
        ListFooterComponent={
          visibleNotifications.length > 0 ? (
            <View style={styles.footer}>
              {isLoadingMore ? (
                <>
                  <ActivityIndicator size="small" color={C.primary} />
                  <T style={styles.footerText}>Loading more…</T>
                </>
              ) : !hasMore ? (
                <>
                  <MaterialCommunityIcons name="check-circle-outline" size={15} color={C.green} />
                  <T style={styles.footerText}>All notifications loaded</T>
                </>
              ) : null}
            </View>
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        refreshing={isRefreshing}
        onRefresh={refresh}
        initialNumToRender={PAGE_SIZE}
        maxToRenderPerBatch={PAGE_SIZE}
        windowSize={7}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: C.headerTop },
  listContent: { flexGrow: 1, backgroundColor: C.bg },
  headerBody: { paddingHorizontal: PAGE_GUTTER },
  summary: {
    minHeight: 62,
    marginTop: 6,
    paddingHorizontal: PAGE_GUTTER,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.blueSoft,
  },
  summaryText: { flex: 1, marginLeft: 4 },
  summaryTitle: { color: C.text, fontSize: 13, fontWeight: '700' },
  summarySub: { marginTop: 2, color: C.sub, fontSize: 10.5, lineHeight: 14 },
  filterRow: {
    marginTop: 4,
    flexDirection: 'row',
    gap: 0,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: C.card,
  },
  filterButton: {
    minHeight: 34,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: C.border,
  },
  filterButtonActive: { backgroundColor: C.primaryPale },
  filterText: { color: C.sub, fontSize: 11, fontWeight: '600' },
  filterTextActive: { color: C.primary, fontWeight: '700' },
  filterCount: {
    minWidth: 19,
    height: 19,
    marginLeft: 4,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    backgroundColor: C.borderSoft,
  },
  filterCountActive: { backgroundColor: C.primary },
  filterCountText: { color: C.sub, fontSize: 9.5, fontWeight: '700' },
  filterCountTextActive: { color: '#fff' },
  itemBlock: { paddingHorizontal: PAGE_GUTTER, gap: 0 },
  dayLabel: {
    paddingTop: 8,
    paddingBottom: 4,
    paddingLeft: 4,
    color: C.sub,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  notificationRow: {
    minHeight: 78,
    paddingHorizontal: PAGE_GUTTER,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    backgroundColor: C.card,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  groupFirstRow: { borderTopWidth: 1, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  unreadRow: { backgroundColor: '#F7FAFF' },
  notificationIcon: {
    width: 38,
    height: 38,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCopy: { flex: 1, minWidth: 0, marginLeft: 4, marginRight: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  notificationTitle: { flex: 1, color: C.text, fontSize: 12.5, fontWeight: '600' },
  unreadTitle: { fontWeight: '800' },
  unreadDot: { width: 7, height: 7, marginLeft: 4, borderRadius: 4, backgroundColor: C.primary },
  notificationMessage: { marginTop: 2, color: C.sub, fontSize: 10.5, lineHeight: 14 },
  notificationTime: { marginTop: 3, color: C.faint, fontSize: 9.5, fontWeight: '600' },
  skeletonList: { paddingHorizontal: PAGE_GUTTER, paddingTop: 8 },
  notificationSkeleton: { minHeight: 78, paddingHorizontal: PAGE_GUTTER, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderBottomWidth: 0, borderColor: C.border, backgroundColor: C.card },
  skeletonCopy: { flex: 1, marginLeft: 4, gap: 7 },
  emptyState: {
    flex: 1,
    minHeight: 280,
    marginHorizontal: PAGE_GUTTER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.greenSoft,
  },
  emptyTitle: { marginTop: 8, color: C.text, fontSize: 14, fontWeight: '700' },
  emptyText: { marginTop: 3, color: C.sub, fontSize: 11 },
  footer: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
  },
  footerText: { color: C.sub, fontSize: 11, fontWeight: '600' },
});
