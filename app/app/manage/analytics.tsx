import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LineChart, BarChart } from 'react-native-chart-kit';
import {
  ChevronLeft, TrendingUp, TrendingDown, Wallet, FlaskConical,
  Stethoscope, Trophy, FileDown,
} from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import { ChipSelect } from '@/components/Select';
import { Card, FadeIn, EmptyState, OfflineBanner } from '@/components/UI';
import { colors, fonts, radius, shadow, spacing } from '@/lib/theme';
import { endpoints } from '@/lib/api';
import { inr } from '@/lib/format';
import { toCsv, shareFile } from '@/lib/share';

const RANGES = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

/** Business analytics — revenue by period, profit, doctor-wise and test-wise. */
export default function Analytics() {
  const width = Dimensions.get('window').width;
  const chartWidth = Math.max(260, width - spacing.hPad * 2 - 8);
  const [data, setData] = React.useState<any>(null);
  const [chart, setChart] = React.useState<any>(null);
  const [range, setRange] = React.useState('weekly');
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const [a, c] = await Promise.all([endpoints.analytics(), endpoints.dashboard.getChart()]);
      setData(a);
      setChart(c);
    } catch (e: any) {
      console.warn(e?.message || e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  const exportCsv = async () => {
    if (!data) return;
    const rows = (data.months || []).map((m: any) => ({
      month: m.label, reports: m.reports, revenue: m.revenue, expense: m.expense, profit: m.revenue - m.expense,
    }));
    await shareFile('pathonexa-analytics.csv', toCsv(rows), 'text/csv');
  };

  const revenue = data?.revenue?.[range] ?? 0;
  const months = data?.months || [];
  const maxDoctor = Math.max(1, ...(data?.doctorWise || []).map((d: any) => d.revenue));
  const maxTest = Math.max(1, ...(data?.testWise || []).map((t: any) => t.revenue));

  return (
    <AppScreen
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
      header={
        <ScreenHeader
          title="Analytics"
          subtitle="Revenue · profit · doctors · tests"
          left={<ChevronLeft size={24} color="#fff" />}
          onLeftPress={() => router.back()}
          right={
            <Pressable style={styles.addBtn} onPress={exportCsv}>
              <FileDown size={17} color="#fff" />
            </Pressable>
          }
        />
      }
    >
      <OfflineBanner />
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} /> : !data ? (
        <EmptyState title="No analytics yet" subtitle="Create reports to see insights." />
      ) : (
        <>
          <ChipSelect options={RANGES} value={range} onChange={setRange} />

          <FadeIn>
            <Card style={styles.hero}>
              <Text style={styles.heroLabel}>{RANGES.find((r) => r.value === range)?.label} revenue</Text>
              <Text style={styles.heroValue}>{inr(revenue)}</Text>
              <View style={styles.heroRow}>
                <HeroChip Icon={TrendingDown} label="Expense" value={inr(data.totalExpense)} tone={colors.red} />
                <HeroChip Icon={Wallet} label="Commission" value={inr(data.commissionPaid)} tone={colors.purple} />
                <HeroChip Icon={TrendingUp} label="Profit" value={inr(data.totalProfit)} tone={colors.green} />
              </View>
            </Card>
          </FadeIn>

          <FadeIn delay={50}>
            <View style={styles.grid}>
              <Tile label="Total Revenue" value={inr(data.revenue.total)} tone={colors.primary} />
              <Tile label="Total Reports" value={String(data.totalReports)} />
              <Tile label="Pending Payments" value={inr(data.pendingPayments)} tone={colors.orange} />
              <Tile label="Total Expense" value={inr(data.totalExpense)} tone={colors.red} />
            </View>
          </FadeIn>

          <Text style={styles.section}>Reports this week</Text>
          <Card style={{ padding: 0 }}>
            <LineChart
              data={{
                labels: chart?.labels || ['', '', '', '', '', '', ''],
                datasets: [{ data: chart?.values?.length ? chart.values : [0, 0, 0, 0, 0, 0, 0] }],
              }}
              width={chartWidth}
              height={180}
              bezier
              fromZero
              withInnerLines={false}
              chartConfig={chartConfig}
              style={{ marginLeft: -12, marginTop: 8 }}
            />
          </Card>

          <Text style={styles.section}>Revenue vs expense (12 months)</Text>
          <Card style={{ padding: 0 }}>
            <BarChart
              data={{
                labels: months.map((m: any) => m.label),
                datasets: [{ data: months.map((m: any) => m.revenue) }],
              }}
              width={chartWidth}
              height={190}
              fromZero
              yAxisLabel="₹"
              yAxisSuffix=""
              withInnerLines={false}
              chartConfig={chartConfig}
              style={{ marginLeft: -12, marginTop: 8 }}
            />
            <View style={styles.legendRow}>
              {months.slice(-3).map((m: any) => (
                <View key={m.key} style={styles.legendCell}>
                  <Text style={styles.legendLabel}>{m.label}</Text>
                  <Text style={styles.legendValue}>{inr(m.revenue)}</Text>
                  <Text style={[styles.legendSub, { color: colors.red }]}>−{inr(m.expense)}</Text>
                </View>
              ))}
            </View>
          </Card>

          {!!data.mostPerformed && (
            <FadeIn delay={80}>
              <Card style={styles.trophy}>
                <View style={styles.trophyIcon}><Trophy size={18} color={colors.orange} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trophyLabel}>Most performed test</Text>
                  <Text style={styles.trophyValue}>{data.mostPerformed.test}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.trophyValue}>{data.mostPerformed.count}×</Text>
                  <Text style={styles.legendSub}>{inr(data.mostPerformed.revenue)}</Text>
                </View>
              </Card>
            </FadeIn>
          )}

          <Text style={styles.section}>Doctor wise revenue</Text>
          <Card>
            {(data.doctorWise || []).length === 0 ? <EmptyState title="No referrals yet" /> : data.doctorWise.map((d: any) => (
              <Pressable key={d.doctor} style={styles.barRow}>
                <Stethoscope size={13} color={colors.primary} />
                <Text style={styles.barName} numberOfLines={1}>{d.doctor}</Text>
                <View style={styles.bar}>
                  <View style={[styles.barFill, { width: `${Math.round((d.revenue / maxDoctor) * 100)}%` }]} />
                </View>
                <Text style={styles.barVal}>{inr(d.revenue)}</Text>
              </Pressable>
            ))}
          </Card>

          <Text style={styles.section}>Test wise revenue</Text>
          <Card style={{ marginBottom: 20 }}>
            {(data.testWise || []).length === 0 ? <EmptyState title="No tests billed yet" /> : data.testWise.slice(0, 12).map((t: any) => (
              <View key={t.test} style={styles.barRow}>
                <FlaskConical size={13} color={colors.purple} />
                <Text style={styles.barName} numberOfLines={1}>{t.test}</Text>
                <View style={styles.bar}>
                  <View style={[styles.barFill, { width: `${Math.round((t.revenue / maxTest) * 100)}%`, backgroundColor: colors.purple }]} />
                </View>
                <Text style={styles.barVal}>{inr(t.revenue)}</Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </AppScreen>
  );
}

const chartConfig = {
  backgroundGradientFrom: '#FFFFFF',
  backgroundGradientTo: '#FFFFFF',
  decimalPlaces: 0,
  color: (o = 1) => `rgba(22, 104, 227, ${o})`,
  labelColor: () => colors.mutedForeground,
  propsForDots: { r: '4' },
  propsForLabels: { fontSize: 9 },
  barPercentage: 0.55,
  fillShadowGradient: colors.primary,
  fillShadowGradientOpacity: 0.9,
};

function Tile({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileV, tone ? { color: tone } : null]} numberOfLines={1}>{value}</Text>
      <Text style={styles.tileL}>{label}</Text>
    </View>
  );
}

function HeroChip({ Icon, label, value, tone }: { Icon: any; label: string; value: string; tone: string }) {
  return (
    <View style={styles.heroChip}>
      <Icon size={13} color={tone} />
      <View>
        <Text style={styles.heroChipLabel}>{label}</Text>
        <Text style={[styles.heroChipValue, { color: tone }]} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: { width: 36, height: 36, borderRadius: radius.xs, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  hero: { marginTop: 12, backgroundColor: colors.primary },
  heroLabel: { fontFamily: fonts.medium, fontSize: 11.5, color: 'rgba(255,255,255,0.85)' },
  heroValue: { fontFamily: fonts.extrabold, fontSize: 28, color: '#fff', marginTop: 2, letterSpacing: -0.6 },
  heroRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  heroChip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: radius.sm, padding: 8 },
  heroChipLabel: { fontFamily: fonts.regular, fontSize: 9, color: colors.mutedForeground },
  heroChipValue: { fontFamily: fonts.bold, fontSize: 11.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tile: { width: '48%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 12, ...shadow },
  tileV: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.foreground },
  tileL: { fontFamily: fonts.medium, fontSize: 10.5, color: colors.mutedForeground, marginTop: 3 },
  section: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground, marginTop: 18, marginBottom: 8 },
  legendRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border },
  legendCell: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  legendLabel: { fontFamily: fonts.medium, fontSize: 10, color: colors.mutedForeground },
  legendValue: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.foreground, marginTop: 2 },
  legendSub: { fontFamily: fonts.medium, fontSize: 10, color: colors.mutedForeground, marginTop: 1 },
  trophy: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  trophyIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.orangeLight, alignItems: 'center', justifyContent: 'center' },
  trophyLabel: { fontFamily: fonts.regular, fontSize: 10.5, color: colors.mutedForeground },
  trophyValue: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.foreground },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  barName: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.foreground, width: 96 },
  bar: { flex: 1, height: 7, borderRadius: 4, backgroundColor: colors.muted, overflow: 'hidden' },
  barFill: { height: 7, backgroundColor: colors.primary },
  barVal: { fontFamily: fonts.bold, fontSize: 11.5, color: colors.foreground, width: 72, textAlign: 'right' },
});
