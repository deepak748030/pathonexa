import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import {
  Menu, ClipboardList, IndianRupee, Hourglass, Wallet, Stethoscope, Receipt,
  UserPlus, FlaskConical, LayoutGrid, ChevronRight,
} from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import HeaderUser from '@/components/HeaderUser';
import AppScreen from '@/components/AppScreen';
import Avatar from '@/components/Avatar';
import { Card, SectionTitle, FadeIn, OfflineBanner, EmptyState } from '@/components/UI';
import { colors, fonts, radius, spacing, shadow, toneMap } from '@/lib/theme';
import { chart as localChart, lab } from '@/lib/labData';
import { endpoints } from '@/lib/api';
import { useServerStatus } from '@/lib/serverStatus';
import { useAuth } from '@/lib/auth';
import { greeting, firstName, inr, testTone } from '@/lib/format';

const STAT_META: Record<string, { Icon: any; tone: keyof typeof toneMap }> = {
  reports: { Icon: ClipboardList, tone: 'primary' },
  revenue: { Icon: IndianRupee, tone: 'green' },
  pending: { Icon: Hourglass, tone: 'orange' },
  amount: { Icon: Wallet, tone: 'purple' },
  commission: { Icon: Stethoscope, tone: 'teal' },
  expense: { Icon: Receipt, tone: 'red' },
};

const quickActions = [
  { label: 'New Patient', Icon: UserPlus, href: '/add-patient' },
  { label: 'New Report', Icon: FlaskConical, href: '/create-report' },
  { label: 'Payment', Icon: Wallet, href: '/manage/payments' },
  { label: 'Add Doctor', Icon: Stethoscope, href: '/manage/doctors' },
  { label: 'More', Icon: LayoutGrid, href: '/(tabs)/more' },
];

export default function Dashboard() {
  const width = Dimensions.get('window').width;
  const check = useServerStatus((s) => s.check);
  const user = useAuth((s) => s.user);
  const [stats, setStats] = React.useState<any[]>([]);
  const [reports, setReports] = React.useState<any[]>([]);
  const [chartData, setChartData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadData = React.useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    try {
      const [remoteStats, remoteReports, remoteChart] = await Promise.all([
        endpoints.dashboard.getStats(),
        endpoints.reports.getAll(),
        endpoints.dashboard.getChart(),
      ]);
      setStats(Array.isArray(remoteStats) ? remoteStats : []);
      setReports(Array.isArray(remoteReports) ? remoteReports.slice(0, 3) : []);
      if (remoteChart) setChartData(remoteChart);
    } catch (e: any) {
      console.warn('Backend data load failed:', e?.message || e);
      setStats([]);
      setReports([]);
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

  const name = firstName(user?.name || lab.admin);
  const chartWidth = Math.max(260, width - spacing.hPad * 2 - 8);

  return (
    <AppScreen
      refreshing={refreshing}
      onRefresh={onRefresh}
      header={
        <ScreenHeader
          title={`${greeting()}, ${name} 👋`}
          subtitle={lab.shortName}
          left={<Menu size={22} color="#FFFFFF" strokeWidth={2.4} />}
          onLeftPress={() => router.push('/menu' as any)}
          right={<HeaderUser />}
        />
      }
    >
      <OfflineBanner />

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <>
          <FadeIn>
            <View style={styles.statGrid}>
              {(stats.length ? stats : []).map((s) => {
                const meta = STAT_META[s.key] || STAT_META.reports;
                const tone = (s.tone || meta.tone) as keyof typeof toneMap;
                const t = toneMap[tone] || toneMap.primary;
                const Icon = meta.Icon;
                return (
                  <Pressable
                    key={s.key || s.label}
                    style={styles.statCard}
                    onPress={() => router.push(s.key === 'expense' ? '/manage/expenses' as any : '/(tabs)/reports' as any)}
                  >
                    <View style={styles.statTop}>
                      <View style={[styles.statIcon, { backgroundColor: t.bg }]}>
                        <Icon size={15} color={t.fg} strokeWidth={2.3} />
                      </View>
                      <Text style={styles.statLabel} numberOfLines={1}>{s.label}</Text>
                      <ChevronRight size={14} color={t.fg} />
                    </View>
                    <Text style={styles.statValue} numberOfLines={1}>{s.value}</Text>
                    <Text style={styles.statSub} numberOfLines={1}>{s.sub}</Text>
                  </Pressable>
                );
              })}
              {stats.length === 0 && (
                <View style={{ width: '100%' }}>
                  <EmptyState title="No stats yet" subtitle="Create your first report to see numbers here." />
                </View>
              )}
            </View>
          </FadeIn>

          <SectionTitle title="Quick Actions" action="View All" onAction={() => router.push('/(tabs)/more' as any)} />
          <FadeIn delay={50}>
            <View style={styles.actionRow}>
              {quickActions.map((a) => (
                <Pressable
                  key={a.label}
                  style={({ pressed }) => [styles.action, pressed && { opacity: 0.85 }]}
                  onPress={() => router.push(a.href as any)}
                >
                  <View style={styles.actionIcon}>
                    <a.Icon size={20} color={colors.primary} strokeWidth={2.2} />
                  </View>
                  <Text style={styles.actionText} numberOfLines={2}>{a.label}</Text>
                </Pressable>
              ))}
            </View>
          </FadeIn>

          <SectionTitle title="Reports Overview" />
          <FadeIn delay={100}>
            <Card style={{ padding: 0 }}>
              <View style={styles.chartHead}>
                <Text style={styles.chartTitle}>Reports Overview</Text>
                <View style={styles.weekPill}>
                  <Text style={styles.weekTxt}>This Week</Text>
                </View>
              </View>
              <LineChart
                data={{
                  labels: chartData?.labels || localChart.labels,
                  datasets: [{ data: chartData?.values?.length ? chartData.values : [0, 0, 0, 0, 0, 0, 0] }],
                }}
                width={chartWidth}
                height={180}
                withInnerLines={false}
                withVerticalLines={false}
                bezier
                fromZero
                chartConfig={{
                  backgroundGradientFrom: '#FFFFFF',
                  backgroundGradientTo: '#FFFFFF',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(22, 104, 227, ${opacity})`,
                  labelColor: () => colors.mutedForeground,
                  propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary },
                  propsForLabels: { fontSize: 9 },
                  fillShadowGradient: colors.primary,
                  fillShadowGradientOpacity: 0.18,
                }}
                style={styles.chart}
              />
              <View style={styles.chartFooter}>
                <View style={styles.chartCell}>
                  <Text style={styles.chartLabel}>Total Reports</Text>
                  <Text style={styles.chartValue}>{chartData?.totalReports || '0'}</Text>
                </View>
                <View style={[styles.chartCell, styles.chartDivider]}>
                  <Text style={styles.chartLabel}>Total Revenue</Text>
                  <Text style={[styles.chartValue, { color: colors.green }]}>{chartData?.totalRevenue || '₹0'}</Text>
                </View>
                <View style={styles.chartCell}>
                  <Text style={styles.chartLabel}>Avg. Per Day</Text>
                  <Text style={styles.chartValue}>{chartData?.avgPerDay || '0'}</Text>
                </View>
              </View>
            </Card>
          </FadeIn>

          <SectionTitle title="Recent Reports" action="View All" onAction={() => router.push('/(tabs)/reports' as any)} />
          <FadeIn delay={150}>
            <Card style={{ padding: 0 }}>
              {reports.length > 0 ? reports.map((r: any, i: number) => {
                const pname = r.patient?.name || r.patient;
                const tone = testTone(r.test);
                return (
                  <Pressable
                    key={r.id || r._id}
                    style={[styles.recentRow, i === reports.length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => router.push({ pathname: '/report-preview', params: { id: r._id || r.id } } as any)}
                  >
                    <Avatar name={pname} color={r.color || r.patient?.color} size={40} />
                    <View style={styles.recentCol}>
                      <Text style={styles.recentName} numberOfLines={1}>{pname}</Text>
                      <Text style={styles.recentMeta} numberOfLines={1}>
                        PID: {r.patient?.pid || r.pid || r.reportId}  |  <Text style={{ color: toneMap[tone].fg }}>{r.test}</Text>
                      </Text>
                    </View>
                    <View style={styles.recentMid}>
                      <Text style={styles.recentAmount}>{inr(r.amount)}</Text>
                      <Text style={[styles.recentPaid, { color: r.paid ? colors.green : colors.red }]}>
                        {r.paid ? 'Paid' : 'Unpaid'}
                      </Text>
                    </View>
                    <View style={styles.recentRight}>
                      <Text style={styles.recentTime}>{r.time || ''}</Text>
                      <ChevronRight size={14} color={colors.mutedForeground} />
                    </View>
                  </Pressable>
                );
              }) : (
                <EmptyState title="No recent reports" subtitle="Reports you create will show up here." />
              )}
            </Card>
          </FadeIn>
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loader: { paddingVertical: 60, alignItems: 'center' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '31.5%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 10,
    minWidth: 98,
    ...shadow,
  },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  statIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  statLabel: { flex: 1, color: colors.mutedForeground, fontFamily: fonts.semibold, fontSize: 9.5 },
  statValue: { color: colors.foreground, fontFamily: fonts.extrabold, fontSize: 16.5, letterSpacing: -0.3 },
  statSub: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 9.5, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8 },
  action: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    ...shadow,
  },
  actionIcon: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  actionText: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 10, textAlign: 'center', lineHeight: 13 },
  chartHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 14 },
  chartTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground },
  weekPill: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  weekTxt: { fontFamily: fonts.medium, fontSize: 11, color: colors.mutedForeground },
  chart: { marginLeft: -12, marginTop: 4 },
  chartFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 12 },
  chartCell: { flex: 1, alignItems: 'center' },
  chartDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  chartLabel: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10.5 },
  chartValue: { color: colors.foreground, fontFamily: fonts.extrabold, fontSize: 16, marginTop: 3 },
  recentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  recentCol: { flex: 1, minWidth: 0 },
  recentMid: { alignItems: 'flex-end', marginRight: 4 },
  recentRight: { alignItems: 'flex-end', width: 58 },
  recentName: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 13.5 },
  recentMeta: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10.5, marginTop: 2 },
  recentAmount: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 13 },
  recentPaid: { fontFamily: fonts.semibold, fontSize: 10, marginTop: 2 },
  recentTime: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 10 },
});
