import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ChevronLeft, Bell } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import { Card, ListRow, EmptyState, OfflineBanner } from '@/components/UI';
import { colors, fonts } from '@/lib/theme';
import { inr } from '@/lib/format';
import { endpoints } from '@/lib/api';

export default function Notifications() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const reports = await endpoints.reports.getAll();
      const list = Array.isArray(reports) ? reports : [];
      const notes = list
        .filter((r) => r.status === 'Pending' || !r.paid)
        .map((r) => ({
          id: r._id || r.id,
          title: r.status === 'Pending' ? `Pending report · ${r.test}` : `Unpaid · ${r.test}`,
          sub: `${r.patient?.name || r.patient || 'Patient'} · ${inr(r.amount)}`,
        }));
      setItems(notes);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  return (
    <AppScreen
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
      header={<ScreenHeader title="Notifications" subtitle="Pending work" left={<ChevronLeft size={24} color="#fff" />} onLeftPress={() => router.back()} />}
    >
      <OfflineBanner />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <Card style={{ padding: 0 }}>
          {items.length === 0 ? (
            <EmptyState title="You're all caught up" subtitle="No pending or unpaid reports." />
          ) : (
            items.map((n, i) => (
              <ListRow key={n.id} last={i === items.length - 1} onPress={() => router.push({ pathname: '/report-preview', params: { id: n.id } } as any)}>
                <View style={styles.row}>
                  <Bell size={16} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{n.title}</Text>
                    <Text style={styles.sub}>{n.sub}</Text>
                  </View>
                </View>
              </ListRow>
            ))
          )}
        </Card>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontFamily: fonts.semibold, fontSize: 13, color: colors.foreground },
  sub: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
});
