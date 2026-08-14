import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Dimensions,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import {
  Menu, ClipboardList, IndianRupee, Hourglass, Wallet, Users, Receipt,
  UserPlus, FlaskConical, CreditCard, Stethoscope, ChevronRight,
} from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import HeaderUser from '@/components/HeaderUser';
import StatCard from '@/components/StatCard';
import Avatar from '@/components/Avatar';
import { Card, SectionTitle, GridPanel, FadeIn, ListRow, OfflineBanner, EmptyState } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { chart as localChart, dashboardStats as localStats, lab, reports as localReports } from '@/lib/labData';
import { endpoints } from '@/lib/api';
import { useServerStatus } from '@/lib/serverStatus';

const icons: Record<string, any> = {
  reports: ClipboardList, revenue: IndianRupee, pending: Hourglass,
  amount: Wallet, commission: Users, expense: Receipt,
};

const quickActions = [
  { label: 'Patient', Icon: UserPlus, href: '/add-patient' },
  { label: 'Report', Icon: FlaskConical, href: '/create-report' },
  { label: 'Payment', Icon: CreditCard, href: '/(tabs)/reports' },
  { label: 'Doctor', Icon: Stethoscope, href: '/manage/doctors' },
];

export default function Dashboard() {
  const width = Dimensions.get('window').width;
  const check = useServerStatus((s) => s.check);
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

  // Strictly server-first: refresh every time the screen gains focus so
  // newly created patients/reports appear immediately.
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

  const recent = reports;

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
        title="Dashboard"
        subtitle={lab.shortName}
        left={<Menu size={22} color="#FFFFFF" />}
        onLeftPress={() => router.push('/menu' as any)}
        right={<HeaderUser />}
      />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <OfflineBanner />

        <FadeIn>
          <GridPanel columns={3}>
            {stats.length > 0 ? (
              stats.map((s) => {
                const Icon = icons[s.key] || ClipboardList;
                const tone = (s.tone || 'primary') as keyof typeof colors;
                return (
                  <StatCard
                    key={s.key || s.label}
                    label={s.label}
                    value={s.value}
                    sub={s.sub}
                    tone={s.tone as any}
                    icon={<Icon size={14} color={tone === 'primary' ? colors.primary : colors[tone]} />}
                    onPress={() => router.push('/(tabs)/reports' as any)}
                  />
                );
              })
            ) : (
              <View style={{ width: '100%' }}>
                <EmptyState title="No stats available" subtitle="Create your first report to see numbers here." />
              </View>
            )}
          </GridPanel>
        </FadeIn>

        <SectionTitle title="Quick Actions" action="View All" onAction={() => router.push('/(tabs)/more' as any)} />
        <FadeIn delay={60}>
          <View style={styles.actionRow}>
            {quickActions.map((a, i) => (
              <Pressable
                key={a.label}
                style={({ pressed }) => [
                  styles.action,
                  i > 0 && styles.actionDivider,
                  pressed && styles.actionPressed,
                ]}
                onPress={() => router.push(a.href as any)}
              >
                <View style={styles.actionIcon}>
                  <a.Icon size={16} color={colors.primary} strokeWidth={2.2} />
                </View>
                <Text style={styles.actionText} numberOfLines={1}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        </FadeIn>

        <SectionTitle title="Reports Overview" />
        <FadeIn delay={120}>
          <Card style={{ padding: 0 }}>
            <View style={styles.chartWrap}>
              <LineChart
                data={{
                  labels: chartData?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                  datasets: [{ data: chartData?.values?.length ? chartData.values : [0, 0, 0, 0, 0, 0, 0] }],
                }}
                width={width - spacing.hPad * 2 - 2}
                height={170}
                withInnerLines={false}
                withVerticalLines={false}
                chartConfig={{
                  backgroundGradientFrom: '#FFFFFF',
                  backgroundGradientTo: '#FFFFFF',
                  decimalPlaces: 0,
                  color: () => colors.primary,
                  labelColor: () => colors.mutedForeground,
                  propsForDots: { r: '3' },
                  propsForLabels: { fontSize: 9 },
                }}
                bezier
                style={styles.chart}
              />
            </View>
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
        <FadeIn delay={180}>
          <Card style={{ padding: 0 }}>
            {recent.length > 0 ? (
              recent.map((r: any, i) => (
                <ListRow
                  key={r.id || r._id}
                  last={i === recent.length - 1}
                  onPress={() => router.push({ pathname: '/report-preview', params: { id: r._id || r.id } } as any)}
                >
                  <View style={styles.recentRow}>
                    <Avatar name={r.patient?.name || r.patient} color={r.color || r.patient?.color} size={30} />
                    <View style={styles.recentCol}>
                      <Text style={styles.recentName} numberOfLines={1}>{r.patient?.name || r.patient}</Text>
                      <Text style={styles.recentMeta} numberOfLines={1}>{r.reportId || r.pid} · {r.test} · {r.time || r.date}</Text>
                    </View>
                    <View style={styles.recentRight}>
                      <Text style={styles.recentAmount}>₹{r.amount}</Text>
                      <Text style={[styles.recentPaid, { color: r.paid ? colors.green : colors.red }]}>
                        {r.paid ? 'Paid' : 'Unpaid'}
                      </Text>
                    </View>
                    <ChevronRight size={14} color={colors.mutedForeground} />
                  </View>
                </ListRow>
              ))
            ) : (
              <EmptyState title="No recent reports" subtitle="Reports you create will show up here." />
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    height: 72,
  },
  action: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2, paddingVertical: 8 },
  actionDivider: { borderLeftWidth: 1, borderLeftColor: colors.border },
  actionPressed: { backgroundColor: colors.muted },
  actionIcon: {
    width: 28, height: 28, borderRadius: radius.sm, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  actionText: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 10, lineHeight: 13, textAlign: 'center', width: '100%' },
  chartWrap: { overflow: 'hidden', paddingTop: 10 },
  chart: { marginLeft: -18, paddingRight: 0 },
  chartFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 10 },
  chartCell: { flex: 1, alignItems: 'center' },
  chartDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  chartLabel: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10 },
  chartValue: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 15, marginTop: 2 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recentCol: { flex: 1, minWidth: 0 },
  recentRight: { alignItems: 'flex-end' },
  recentName: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 12.5 },
  recentMeta: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 9.5, marginTop: 1 },
  recentAmount: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 12.5 },
  recentPaid: { fontFamily: fonts.medium, fontSize: 9, marginTop: 2 },
});
