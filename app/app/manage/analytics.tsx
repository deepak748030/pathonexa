import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { ChevronLeft, IndianRupee, TrendingUp, Wallet, FlaskConical } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import { Card, FadeIn, OfflineBanner } from '@/components/UI';
import { colors, fonts, radius, shadow, spacing } from '@/lib/theme';
import { endpoints } from '@/lib/api';

export default function AnalyticsScreen() {
  const width = Dimensions.get('window').width;
  const [chart, setChart] = React.useState<any>(null);
  const [stats, setStats] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const [c, s] = await Promise.all([endpoints.dashboard.getChart(), endpoints.dashboard.getStats()]);
      setChart(c);
      setStats(Array.isArray(s) ? s : []);
    } catch {
      setChart(null);
      setStats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  return (
    <AppScreen header={<ScreenHeader title="Analytics" subtitle="Daily · weekly · monthly" left={<ChevronLeft size={24} color="#fff" />} onLeftPress={() => router.back()} />}>
      <OfflineBanner />
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} /> : (
        <FadeIn>
          <View style={styles.grid}>
            {stats.slice(0, 4).map((s) => (
              <View key={s.label} style={styles.card}>
                <Text style={styles.v}>{s.value}</Text>
                <Text style={styles.l}>{s.label}</Text>
              </View>
            ))}
          </View>
          <Card style={{ padding: 0, marginTop: 12 }}>
            <Text style={styles.h}>Weekly reports</Text>
            <LineChart
              data={{
                labels: chart?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{ data: chart?.values?.length ? chart.values : [0, 0, 0, 0, 0, 0, 0] }],
              }}
              width={Math.max(260, width - spacing.hPad * 2 - 8)}
              height={180}
              bezier
              fromZero
              withInnerLines={false}
              chartConfig={{
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: () => colors.primary,
                labelColor: () => colors.mutedForeground,
                propsForDots: { r: '4' },
              }}
              style={{ marginLeft: -12 }}
            />
          </Card>
          <View style={styles.row}>
            <Insight Icon={IndianRupee} title="Revenue" value={chart?.totalRevenue || '₹0'} />
            <Insight Icon={TrendingUp} title="Avg / day" value={chart?.avgPerDay || '0'} />
            <Insight Icon={FlaskConical} title="Reports" value={chart?.totalReports || '0'} />
            <Insight Icon={Wallet} title="Pending" value={stats.find((s) => s.key === 'amount')?.value || '₹0'} />
          </View>
        </FadeIn>
      )}
    </AppScreen>
  );
}

function Insight({ Icon, title, value }: { Icon: any; title: string; value: string }) {
  return (
    <View style={styles.ins}>
      <Icon size={16} color={colors.primary} />
      <Text style={styles.iv}>{value}</Text>
      <Text style={styles.il}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { width: '48%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 14, ...shadow },
  v: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.foreground },
  l: { fontFamily: fonts.medium, fontSize: 11, color: colors.mutedForeground, marginTop: 4 },
  h: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground, padding: 14, paddingBottom: 0 },
  row: { flexDirection: 'row', gap: 8, marginTop: 12 },
  ins: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 10, alignItems: 'center', ...shadow },
  iv: { fontFamily: fonts.bold, fontSize: 13, color: colors.foreground, marginTop: 6 },
  il: { fontFamily: fonts.regular, fontSize: 10, color: colors.mutedForeground, marginTop: 2 },
});
