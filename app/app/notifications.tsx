import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  ChevronLeft, Bell, CheckCheck, FileCheck2, Wallet, Stethoscope, Crown, CircleDot,
} from 'lucide-react-native';
import ScreenHeader, { HeaderIcon } from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import { ChipSelect } from '@/components/Select';
import { Card, ListRow, EmptyState, OfflineBanner } from '@/components/UI';
import { colors, fonts } from '@/lib/theme';
import { endpoints } from '@/lib/api';

const ICONS: Record<string, any> = {
  'Report Ready': FileCheck2,
  'Payment Pending': Wallet,
  'Doctor Commission Due': Stethoscope,
  'Subscription Expiry': Crown,
};

const TONES: Record<string, { fg: string; bg: string }> = {
  green: { fg: colors.green, bg: colors.greenLight },
  orange: { fg: colors.orange, bg: colors.orangeLight },
  purple: { fg: colors.purple, bg: colors.purpleLight },
  red: { fg: colors.red, bg: colors.redLight },
};

const FILTERS = ['All', 'Report Ready', 'Payment Pending', 'Doctor Commission Due', 'Subscription Expiry'];

export default function Notifications() {
  const [items, setItems] = React.useState<any[]>([]);
  const [filter, setFilter] = React.useState('All');
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const list = await endpoints.notifications.list();
      setItems(Array.isArray(list) ? list : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  const open = async (n: any) => {
    try { await endpoints.notifications.markRead(n.id); } catch { /* offline is fine */ }
    setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    if (n.reportId) router.push({ pathname: '/report-preview', params: { id: n.reportId } } as any);
    else if (n.type === 'Subscription Expiry') router.push('/manage/subscription' as any);
    else if (n.type === 'Doctor Commission Due') router.push('/manage/commissions' as any);
  };

  const markAll = async () => {
    try { await endpoints.notifications.markAllRead(); } catch { /* ignore */ }
    setItems((list) => list.map((x) => ({ ...x, read: true })));
  };

  const filtered = filter === 'All' ? items : items.filter((n) => n.type === filter);
  const unread = items.filter((n) => !n.read).length;

  return (
    <AppScreen
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
      header={
        <ScreenHeader
          title="Notifications"
          subtitle={unread ? `${unread} unread` : 'You are all caught up'}
          left={<ChevronLeft size={24} color="#fff" />}
          onLeftPress={() => router.back()}
          right={
            <HeaderIcon onPress={markAll}>
              <CheckCheck size={20} color="#fff" />
            </HeaderIcon>
          }
        />
      }
    >
      <OfflineBanner />
      <ChipSelect small options={FILTERS} value={filter} onChange={setFilter} />

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <Card style={{ padding: 0, marginTop: 10, marginBottom: 20 }}>
          {filtered.length === 0 ? (
            <EmptyState title="Nothing here" subtitle="New alerts will appear as work comes in." />
          ) : filtered.map((n, i) => {
            const Icon = ICONS[n.type] || Bell;
            const tone = TONES[n.tone] || TONES.orange;
            return (
              <ListRow key={n.id} last={i === filtered.length - 1} onPress={() => open(n)}>
                <View style={styles.row}>
                  <View style={[styles.icon, { backgroundColor: tone.bg }]}>
                    <Icon size={16} color={tone.fg} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.title, !n.read && { fontFamily: fonts.bold }]} numberOfLines={2}>{n.title}</Text>
                    <Text style={styles.sub} numberOfLines={1}>{n.subtitle}</Text>
                    <Text style={styles.type}>{n.type}</Text>
                  </View>
                  {!n.read ? <CircleDot size={12} color={colors.primary} /> : null}
                </View>
              </ListRow>
            );
          })}
        </Card>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.semibold, fontSize: 13, color: colors.foreground },
  sub: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  type: { fontFamily: fonts.medium, fontSize: 9.5, color: colors.primary, marginTop: 3, letterSpacing: 0.3 },
});
