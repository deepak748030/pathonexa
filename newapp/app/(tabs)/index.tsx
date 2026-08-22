// Dashboard — UI PDF screen 1 & 9 (behind drawer)
import React from 'react';
import { T } from '../../components/T';
import { Alert, View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlueHeader, HeaderIconBtn, ScrollPage, Card, DashStat, SectionHead, Avatar, StatusPill, Chevron, Press, Skeleton } from '../../components/kit';
import { LineChart, DonutChart } from '../../components/charts';
import { useDrawer } from '../../components/Drawer';
import { C, PAGE_GUTTER } from '../../src/theme';
import { api, type Report } from '../../src/api';
import { useAuth } from '../../src/auth';
import { useNotifications } from '../../src/notifications';

const quickActions = [
  { icon: 'account-plus-outline', label: 'New Patient' },
  { icon: 'flask-outline', label: 'New Report' },
  { icon: 'wallet-outline', label: 'Payment' },
  { icon: 'doctor', label: 'Add Doctor' },
  { icon: 'view-grid-outline', label: 'More' },
];
const statIcons = ['clipboard-text-outline', 'currency-rupee', 'timer-sand', 'wallet-outline', 'doctor', 'receipt-text-outline'];
const statTones = ['blue', 'green', 'orange', 'purple', 'blue', 'pink'] as const;
const avatarTones = ['blue', 'green', 'purple', 'orange', 'pink'] as const;

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'P';
}
function avatarTone(name: string) {
  const hash = Array.from(name).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return avatarTones[hash % avatarTones.length];
}
export default function Dashboard() {
  const { setOpen } = useDrawer();
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [stats, setStats] = React.useState<Array<{ key: string; label: string; value: string; sub: string; tone: string }>>([]);
  const [chart, setChart] = React.useState<{ labels: string[]; values: number[]; totalReports: string; totalRevenue: string; avgPerDay: string } | null>(null);
  const [recentReports, setRecentReports] = React.useState<Report[]>([]);
  const [todayCounts, setTodayCounts] = React.useState({ total: 0, pending: 0, completed: 0, cancelled: 0 });
  const [settings, setSettings] = React.useState<Record<string, any>>({});
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState('');

  const loadDashboard = React.useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const now = new Date();
      const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const [nextStats, nextChart, recent, nextSettings, counts] = await Promise.all([
        api.dashboard.stats(),
        api.dashboard.chart(),
        api.reports.list({ page: 1, limit: 3 }),
        api.settings(),
        Promise.all([undefined, 'Pending', 'Completed', 'Cancelled'].map((status) =>
          api.reports.list({ page: 1, limit: 1, from: day, to: day, status }).then((result) => result.pagination.total),
        )),
      ]);
      setStats(nextStats.slice(0, 6));
      setChart(nextChart);
      setRecentReports(recent.items);
      setSettings(nextSettings);
      setTodayCounts({ total: counts[0], pending: counts[1], completed: counts[2], cancelled: counts[3] });
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load the dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => { loadDashboard().catch(() => {}); }, [loadDashboard]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const chartSeries = chart?.labels.map((label, index) => ({ d: label, v: chart.values[index] || 0 })) ?? [];
  const todayTotal = todayCounts.total;
  const pendingTotal = todayCounts.pending;
  const completedTotal = todayCounts.completed;

  return (
    <ScrollPage refreshing={refreshing} onRefresh={() => loadDashboard(true).catch(() => {})}>
      <BlueHeader
        menu
        onBack={() => setOpen(true)}
        title={`${greeting}, ${(user?.name || 'Lab Owner').split(' ')[0]} 👋`}
        sub={settings.name || 'Your Pathology Lab'}
        right={
          <>
            <HeaderIconBtn
              icon="bell"
              badge={unreadCount || undefined}
              onPress={() => router.push('/notifications')}
              accessibilityLabel="Open notifications"
            />
            <View style={styles.labLogo}>
              <MaterialCommunityIcons name="microscope" size={17} color={C.primary} />
              <T style={styles.labLogoText}>{`${initials(settings.name || 'My Lab')}\nLAB`}</T>
            </View>
          </>
        }
      />

      <View style={styles.body}>
        {!!error && (
          <TouchableOpacity style={styles.errorBanner} onPress={() => loadDashboard().catch(() => {})}>
            <MaterialCommunityIcons name="alert-circle-outline" size={15} color={C.red} />
            <T style={styles.errorText} numberOfLines={2}>{error} Tap to retry.</T>
          </TouchableOpacity>
        )}
        {/* stat grid */}
        <View style={styles.statGrid}>
          {loading ? Array.from({ length: 6 }, (_, index) => (
            <View key={index} style={styles.statSkeleton}><Skeleton width={34} height={34} /><Skeleton width="70%" height={12} /><Skeleton width="45%" height={18} /><Skeleton width="75%" height={9} /></View>
          )) : stats.map((stat, index) => (
            <DashStat key={stat.key} icon={statIcons[index]} tone={statTones[index]} label={stat.label} value={stat.value} foot={stat.sub} />
          ))}
        </View>

        {/* quick actions */}
        <SectionHead title="Quick Actions" action="View All" onAction={() => router.push('/more')} />
        <View style={styles.quickRow}>
          {quickActions.map((q) => (
            <Press
              key={q.label}
              style={styles.quickTile}
              onPress={() => {
                if (q.label === 'New Patient') router.push('/add-patient');
                else if (q.label === 'New Report') router.push('/create-report');
                else if (q.label === 'More') router.push('/more');
                else Alert.alert(q.label, `${q.label} is not available in this app version.`);
              }}
            >
              <MaterialCommunityIcons name={q.icon as any} size={22} color={C.primary} />
              <T style={styles.quickLabel} numberOfLines={1}>
                {q.label}
              </T>
            </Press>
          ))}
        </View>

        {/* reports overview */}
        <Card style={{ marginTop: 8 }}>
          <View style={styles.rowBetween}>
            <T style={styles.cardTitle}>Reports Overview</T>
            <View style={styles.weekChip}>
              <T style={styles.weekChipText}>This Week</T>
              <MaterialCommunityIcons name="chevron-down" size={14} color={C.sub} />
            </View>
          </View>
          {loading || !chart ? <View style={styles.chartSkeleton}><Skeleton width="100%" height={150} radius={4} /></View> : <LineChart data={chartSeries} />}
          <View style={styles.weekFoot}>
            <View style={styles.weekFootCell}>
              <T style={styles.footLabel}>Total Reports</T>
              {loading ? <Skeleton width={34} height={16} style={{ marginTop: 2 }} /> : <T style={styles.footValue}>{chart?.totalReports || '0'}</T>}
            </View>
            <View style={styles.vDiv} />
            <View style={styles.weekFootCell}>
              <T style={styles.footLabel}>Total Revenue</T>
              {loading ? <Skeleton width={58} height={16} style={{ marginTop: 2 }} /> : <T style={[styles.footValue, { color: C.green }]}>{chart?.totalRevenue || '₹0'}</T>}
            </View>
            <View style={styles.vDiv} />
            <View style={styles.weekFootCell}>
              <T style={styles.footLabel}>Avg. Per Day</T>
              {loading ? <Skeleton width={34} height={16} style={{ marginTop: 2 }} /> : <T style={[styles.footValue, { color: C.primary }]}>{chart?.avgPerDay || '0'}</T>}
            </View>
          </View>
        </Card>

        {/* recent reports */}
        <SectionHead title="Recent Reports" action="View All" onAction={() => router.push('/reports')} />
        <Card style={{ padding: 4 }}>
          {loading ? Array.from({ length: 3 }, (_, index) => (
            <View key={index} style={[styles.reportRow, index > 0 && { borderTopWidth: 1, borderTopColor: C.borderSoft }]}>
              <Skeleton width={40} height={40} radius={20} /><View style={styles.recentSkeletonCopy}><Skeleton width="58%" height={11} /><Skeleton width="76%" height={9} /></View><Skeleton width={52} height={20} />
            </View>
          )) : recentReports.length ? recentReports.map((report, index) => (
            <TouchableOpacity key={report._id} activeOpacity={0.72} onPress={() => router.push({ pathname: '/report-preview', params: { id: report._id } })} style={[styles.reportRow, index > 0 && { borderTopWidth: 1, borderTopColor: C.borderSoft }]}>
              <Avatar initials={initials(report.patient?.name || 'Patient')} tone={avatarTone(report.patient?.name || 'Patient')} size={40} />
              <View style={{ flex: 1, marginLeft: 4 }}>
                <T style={styles.reportName}>{report.patient?.name || 'Patient'}</T>
                <T style={styles.reportSub} numberOfLines={1}>
                  PID: {report.patient?.pid || '—'} &nbsp;|&nbsp; {report.test}
                </T>
              </View>
              <View style={{ alignItems: 'flex-end', marginRight: 4 }}>
                <T style={styles.reportAmount}>₹{Number(report.amount || 0).toLocaleString('en-IN')}</T>
                <StatusPill status={report.status} />
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T style={styles.reportTime}>{new Date(report.createdAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</T>
              </View>
              <View style={{ marginLeft: 4 }}><Chevron /></View>
            </TouchableOpacity>
          )) : <T style={styles.empty}>No recent reports.</T>}
        </Card>

        {/* today's reports donut */}
        <SectionHead title="Today's Reports" />
        <Card>
          {loading ? <View style={styles.donutSkeleton}><Skeleton width={132} height={132} radius={66} /><View style={{ flex: 1, gap: 12 }}><Skeleton width="85%" height={12} /><Skeleton width="72%" height={12} /><Skeleton width="65%" height={12} /></View></View> : (
            <DonutChart
              total={String(todayTotal)}
              segments={[
                { label: 'Completed', value: completedTotal, color: '#0E9F6E' },
                { label: 'Pending', value: pendingTotal, color: '#E8890C' },
                { label: 'Cancelled', value: todayCounts.cancelled, color: '#9CA3AF' },
              ]}
            />
          )}
        </Card>
      </View>
    </ScrollPage>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: PAGE_GUTTER },
  labLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  labLogoText: { fontSize: 6.5, color: C.primary, fontWeight: '800', textAlign: 'center', lineHeight: 7.5 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', padding: 8, marginTop: 4, borderWidth: 1, borderColor: '#F6D8D8', backgroundColor: C.redSoft, borderRadius: 4 },
  errorText: { flex: 1, color: C.red, fontSize: 10.5, marginLeft: 4 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0, marginTop: 8 },
  statSkeleton: { width: '33.333%', minHeight: 112, padding: 8, justifyContent: 'space-between', borderWidth: 1, borderColor: C.borderSoft, backgroundColor: C.card },
  chartSkeleton: { minHeight: 170, justifyContent: 'center' },
  quickRow: { flexDirection: 'row', gap: 0 },
  quickTile: {
    flex: 1,
    backgroundColor: '#EDF3FE',
    borderRadius: 6,
    alignItems: 'center',
    paddingVertical: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  quickLabel: { fontSize: 10, color: C.text, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  weekChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  weekChipText: { fontSize: 11.5, color: C.text, fontWeight: '600' },
  weekFoot: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.borderSoft, paddingTop: 12, marginTop: 4 },
  weekFootCell: { flex: 1, alignItems: 'center' },
  vDiv: { width: 1, backgroundColor: C.borderSoft },
  footLabel: { fontSize: 10.5, color: C.faint },
  footValue: { fontSize: 16, fontWeight: '800', color: C.text, marginTop: 2 },
  reportRow: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  recentSkeletonCopy: { flex: 1, marginLeft: 4, gap: 7 },
  donutSkeleton: { minHeight: 160, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 18 },
  empty: { paddingVertical: 18, textAlign: 'center', color: C.faint, fontSize: 11 },
  reportName: { fontSize: 13, fontWeight: '700', color: C.text },
  reportSub: { fontSize: 10.5, color: C.faint, marginTop: 2 },
  reportAmount: { fontSize: 12.5, fontWeight: '800', color: C.text },
  reportTime: { fontSize: 10, color: C.faint },
});
