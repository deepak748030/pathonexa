import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Menu, Search, SlidersHorizontal, Plus, ClipboardList, Hourglass,
  CheckCircle2, IndianRupee, ChevronRight, CalendarDays,
} from 'lucide-react-native';
import ScreenHeader, { HeaderIcon, HeaderPill } from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import SearchBar from '@/components/SearchBar';
import Avatar from '@/components/Avatar';
import { Card, Chip, FadeIn, OfflineBanner, EmptyState } from '@/components/UI';
import { colors, fonts, radius, shadow, toneMap } from '@/lib/theme';
import { endpoints } from '@/lib/api';
import { useServerStatus } from '@/lib/serverStatus';
import { inr, testTone } from '@/lib/format';

const STAT_ICONS = [
  { Icon: ClipboardList, tone: 'primary' as const },
  { Icon: Hourglass, tone: 'orange' as const },
  { Icon: CheckCircle2, tone: 'green' as const },
  { Icon: IndianRupee, tone: 'purple' as const },
];

const DATE_CHIPS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7', label: 'Last 7 Days' },
  { id: '30', label: 'Last 30 Days' },
  { id: 'custom', label: 'Custom Range' },
];

const STATUS = ['All', 'Pending', 'Completed', 'Cancelled'];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function Reports() {
  const check = useServerStatus((s) => s.check);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('All');
  const [range, setRange] = React.useState('today');
  const [reports, setReports] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const PAGE = 10;

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
      console.warn('Failed to load reports:', e?.message || e);
      setReports([]);
      setStats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(React.useCallback(() => { check(); loadData(true); }, [check, loadData]));

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadData(), check()]);
    setRefreshing(false);
  }, [loadData, check]);

  const filtered = reports.filter((r) => {
    const name = (r.patient?.name || r.patient || '').toLowerCase();
    const q = search.toLowerCase().trim();
    const matchQ = !q || name.includes(q) || (r.reportId || '').toLowerCase().includes(q) || (r.test || '').toLowerCase().includes(q) || (r.doctor || '').toLowerCase().includes(q);
    const matchS = status === 'All' || r.status === status;
    const created = new Date(r.createdAt || r.date || Date.now());
    const today = startOfDay(new Date());
    let matchD = true;
    if (range === 'today') matchD = created >= today;
    else if (range === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      matchD = created >= y && created < today;
    } else if (range === '7') {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      matchD = created >= d;
    } else if (range === '30') {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      matchD = created >= d;
    }
    return matchQ && matchS && matchD;
  });

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const slice = filtered.slice((page - 1) * PAGE, page * PAGE);
  const counts = {
    All: reports.length,
    Pending: reports.filter((r) => r.status === 'Pending').length,
    Completed: reports.filter((r) => r.status === 'Completed').length,
    Cancelled: reports.filter((r) => r.status === 'Cancelled').length,
  };

  React.useEffect(() => { setPage(1); }, [search, status, range]);

  return (
    <AppScreen
      refreshing={refreshing}
      onRefresh={onRefresh}
      keyboard
      header={
        <ScreenHeader
          title="Reports"
          subtitle="All lab reports and details"
          left={<Menu size={22} color="#FFFFFF" strokeWidth={2.4} />}
          onLeftPress={() => router.push('/menu' as any)}
          right={
            <>
              <HeaderIcon><Search size={18} color="#FFFFFF" /></HeaderIcon>
              <HeaderIcon onPress={() => { setStatus('All'); setRange('today'); }}><SlidersHorizontal size={18} color="#FFFFFF" /></HeaderIcon>
              <HeaderPill onPress={() => router.push('/create-report')}>
                <Plus size={14} color="#FFFFFF" strokeWidth={2.6} />
                <Text style={styles.pillTxt}>Create Report</Text>
              </HeaderPill>
            </>
          }
        />
      }
    >
      <OfflineBanner />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          <FadeIn>
            <View style={styles.statRow}>
              {stats.map((s, i) => {
                const meta = STAT_ICONS[i] || STAT_ICONS[0];
                const t = toneMap[(s.tone || meta.tone) as keyof typeof toneMap] || toneMap.primary;
                return (
                  <View key={s.label} style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: t.bg }]}>
                      <meta.Icon size={16} color={t.fg} />
                    </View>
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel} numberOfLines={2}>{s.label}</Text>
                  </View>
                );
              })}
            </View>
          </FadeIn>

          <FadeIn delay={40}>
            <View style={styles.searchRow}>
              <SearchBar value={search} onChangeText={setSearch} placeholder="Search by Patient, Report ID, Test or Doctor..." />
              <Pressable style={styles.calBtn}><CalendarDays size={18} color={colors.foreground} /></Pressable>
            </View>
          </FadeIn>

          <FadeIn delay={60}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={{ marginTop: 12 }}>
              {DATE_CHIPS.map((c) => (
                <Chip key={c.id} label={c.label} active={range === c.id} onPress={() => setRange(c.id)} />
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {STATUS.map((s) => (
                <Chip
                  key={s}
                  label={s === 'All' ? `All (${counts.All})` : `${s} (${counts[s as keyof typeof counts]})`}
                  active={status === s}
                  onPress={() => setStatus(s)}
                />
              ))}
            </ScrollView>
          </FadeIn>

          <FadeIn delay={90}>
            <Card style={{ padding: 0, marginTop: 4 }}>
              {slice.length === 0 ? (
                <EmptyState
                  title={search ? 'No reports match your search' : 'No reports in this range'}
                  subtitle="Create a report with + Create Report."
                />
              ) : slice.map((r, i) => {
                const pname = r.patient?.name || r.patient;
                const tone = testTone(r.test);
                return (
                  <Pressable
                    key={r.id || r._id}
                    style={[styles.row, i === slice.length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => router.push({ pathname: '/report-preview', params: { id: r._id || r.id } } as any)}
                  >
                    <Avatar name={pname} color={r.color || r.patient?.color} size={42} />
                    <View style={styles.info}>
                      <Text style={styles.name}>{pname}</Text>
                      <Text style={styles.meta}>PID: {r.patient?.pid || r.pid || '—'}  |  {r.patient?.age || r.age || '—'} Yrs  |  {r.patient?.gender || r.gender || ''}</Text>
                      <Text style={[styles.test, { color: toneMap[tone].fg }]}>{r.test}</Text>
                      <Text style={styles.ref}>Ref: {r.doctor || 'Direct'}</Text>
                    </View>
                    <View style={styles.right}>
                      <Text style={styles.id}>Report ID</Text>
                      <Text style={styles.idVal}>{r.reportId}</Text>
                      <Text style={styles.id}>Report Date</Text>
                      <Text style={styles.idVal}>{r.date}{r.time ? `\n${r.time}` : ''}</Text>
                    </View>
                    <View style={styles.amtCol}>
                      <Text style={styles.amt}>{inr(r.amount)}</Text>
                      <Text style={[styles.st, { color: r.status === 'Completed' ? colors.green : r.status === 'Pending' ? colors.orange : colors.red }]}>
                        {r.status}
                      </Text>
                    </View>
                    <ChevronRight size={15} color={colors.mutedForeground} />
                  </Pressable>
                );
              })}
            </Card>
          </FadeIn>

          {filtered.length > 0 && (
            <View style={styles.pager}>
              <Text style={styles.pagerTxt}>Showing {slice.length} of {filtered.length} reports</Text>
              <View style={styles.pages}>
                {Array.from({ length: Math.min(pages, 5) }).map((_, i) => (
                  <Pressable key={i} onPress={() => setPage(i + 1)} style={[styles.pageBtn, page === i + 1 && styles.pageActive]}>
                    <Text style={[styles.pageTxt, page === i + 1 && { color: '#fff' }]}>{i + 1}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  pillTxt: { color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 12 },
  statRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md,
    alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, ...shadow,
  },
  statIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.foreground },
  statLabel: { fontFamily: fonts.medium, fontSize: 9.5, color: colors.mutedForeground, textAlign: 'center', marginTop: 2 },
  searchRow: { flexDirection: 'row', gap: 8 },
  calBtn: {
    width: 46, height: 46, borderRadius: radius.sm, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
  },
  chips: { paddingBottom: 10, paddingRight: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 10, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  info: { flex: 1.3, minWidth: 0 },
  name: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.foreground },
  meta: { fontFamily: fonts.regular, fontSize: 10, color: colors.mutedForeground, marginTop: 2 },
  test: { fontFamily: fonts.semibold, fontSize: 11.5, marginTop: 3 },
  ref: { fontFamily: fonts.regular, fontSize: 10, color: colors.mutedForeground, marginTop: 2 },
  right: { width: 88 },
  id: { fontFamily: fonts.regular, fontSize: 9, color: colors.mutedForeground },
  idVal: { fontFamily: fonts.semibold, fontSize: 10.5, color: colors.foreground, marginBottom: 4 },
  amtCol: { alignItems: 'flex-end', width: 64 },
  amt: { fontFamily: fonts.bold, fontSize: 13, color: colors.foreground },
  st: { fontFamily: fonts.semibold, fontSize: 10.5, marginTop: 3 },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  pagerTxt: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedForeground },
  pages: { flexDirection: 'row', gap: 6 },
  pageBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  pageActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pageTxt: { fontFamily: fonts.bold, fontSize: 12, color: colors.foreground },
});
