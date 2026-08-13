import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Search, FlaskConical, SlidersHorizontal, CheckCircle2, Clock, XCircle, IndianRupee } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import StatCard from '@/components/StatCard';
import Avatar from '@/components/Avatar';
import { Card, SectionTitle, GridPanel, FadeIn, ListRow, Chip, OfflineBanner, EmptyState } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { endpoints } from '@/lib/api';
import { useServerStatus } from '@/lib/serverStatus';

const STATUSES = ['All', 'Completed', 'Pending', 'Cancelled'];

export default function Reports() {
  const check = useServerStatus((s) => s.check);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('All');
  const [reports, setReports] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadData = React.useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    try {
      const [data, remoteStats] = await Promise.all([
        endpoints.reports.getAll(),
        endpoints.reports.getStats(),
      ]);
      setReports(Array.isArray(data) ? data : []);
      setStats(Array.isArray(remoteStats) ? remoteStats : []);
    } catch (e: any) {
      console.warn('Failed to load reports from backend:', e?.message || e);
      setReports([]);
      setStats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      check();
      loadData(true);
    }, [check, loadData])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadData(), check()]);
    setRefreshing(false);
  }, [loadData, check]);

  const filtered = reports.filter((r) => {
    const name = (r.patient?.name || r.patient || '').toLowerCase();
    const q = search.toLowerCase().trim();
    const matchQ =
      !q ||
      name.includes(q) ||
      (r.reportId || '').toLowerCase().includes(q) ||
      (r.test || '').toLowerCase().includes(q);
    const matchS = status === 'All' || r.status === status;
    return matchQ && matchS;
  });

  const getStatus = (s: string) => {
    switch (s) {
      case 'Completed':
        return { Icon: CheckCircle2, color: colors.green };
      case 'Pending':
        return { Icon: Clock, color: colors.orange };
      case 'Cancelled':
        return { Icon: XCircle, color: colors.red };
      default:
        return { Icon: Clock, color: colors.mutedForeground };
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Reports"
        subtitle="Track laboratory investigations"
        right={
          <Pressable style={styles.addBtn} onPress={() => router.push('/create-report')}>
            <FlaskConical size={18} color="#FFFFFF" />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <OfflineBanner />

        <FadeIn>
          <GridPanel columns={2}>
            {stats.map((s) => (
              <StatCard key={s.label} label={s.label} value={s.value} tone={s.tone} compact />
            ))}
          </GridPanel>
        </FadeIn>

        <SectionTitle title="All Reports" />
        <FadeIn delay={60}>
          <View style={styles.searchBar}>
            <View style={styles.searchInputWrap}>
              <Search size={18} color={colors.mutedForeground} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search patient, ID or test..."
                placeholderTextColor={colors.mutedForeground}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <Pressable style={styles.filterBtn} onPress={() => setStatus('All')}>
              <SlidersHorizontal size={18} color={colors.foreground} />
            </Pressable>
          </View>

          {/* Segmented status filter — mapped with gap 0 + hairline dividers */}
          <View style={styles.segment}>
            {STATUSES.map((s, i) => (
              <Chip
                key={s}
                label={s}
                active={status === s}
                divider={i > 0}
                onPress={() => setStatus(s)}
              />
            ))}
          </View>
        </FadeIn>

        <FadeIn delay={120}>
          <Card style={{ padding: 0 }}>
            {filtered.length === 0 ? (
              <EmptyState
                title={search ? 'No reports match your search' : 'No reports found'}
                subtitle={search ? 'Try a different patient, ID or test name.' : 'Create a report with the flask button above.'}
              />
            ) : (
              filtered.map((r, i) => {
                const { Icon, color } = getStatus(r.status);
                return (
                  <ListRow
                    key={r.id || r._id}
                    last={i === filtered.length - 1}
                    onPress={() =>
                      router.push({ pathname: '/report-preview', params: { id: r._id || r.id } } as any)
                    }
                  >
                    <View style={styles.reportRow}>
                      <Avatar name={r.patient?.name || r.patient} color={r.color || r.patient?.color} size={36} />
                      <View style={styles.reportInfo}>
                        <Text style={styles.reportPatient}>{r.patient?.name || r.patient}</Text>
                        <Text style={styles.reportTest} numberOfLines={1}>{r.test}</Text>
                        <Text style={styles.metaText} numberOfLines={1}>{r.reportId} · {r.date}</Text>
                      </View>
                      <View style={styles.reportStatus}>
                        <View style={styles.statusBadge}>
                          <Icon size={12} color={color} />
                          <Text style={[styles.statusText, { color }]}>{r.status}</Text>
                        </View>
                        <View style={styles.paymentRow}>
                          <IndianRupee size={10} color={r.paid ? colors.green : colors.red} />
                          <Text style={[styles.paymentText, { color: r.paid ? colors.green : colors.red }]}>
                            ₹{r.amount}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </ListRow>
                );
              })
            )}
          </Card>
        </FadeIn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: spacing.hPad, paddingTop: 4, paddingBottom: 28 },
  addBtn: { width: 36, height: 36, borderRadius: radius.xs, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  searchInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 40, backgroundColor: colors.card, borderRadius: radius.sm, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, height: '100%', marginLeft: 8, fontFamily: fonts.medium, fontSize: 13, color: colors.foreground },
  filterBtn: { width: 44, height: 44, backgroundColor: colors.card, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  segment: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 10 },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reportInfo: { flex: 1, minWidth: 0 },
  reportPatient: { fontSize: 13, fontFamily: fonts.bold, color: colors.foreground },
  reportTest: { fontSize: 11, fontFamily: fonts.semibold, color: colors.primary, marginTop: 1 },
  metaText: { fontSize: 10, fontFamily: fonts.regular, color: colors.mutedForeground, marginTop: 2 },
  reportStatus: { alignItems: 'flex-end', gap: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 10, fontFamily: fonts.bold },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  paymentText: { fontSize: 11, fontFamily: fonts.bold },
});
