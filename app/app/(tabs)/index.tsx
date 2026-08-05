import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import {
  Menu, Bell, ClipboardList, IndianRupee, Hourglass, Wallet, Users, Receipt,
  UserPlus, FlaskConical, CreditCard, Stethoscope, LayoutGrid, ChevronRight,
} from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import StatCard from '@/components/StatCard';
import Avatar from '@/components/Avatar';
import { Card, SectionTitle, GridPanel, FadeIn, ListRow } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { chart, dashboardStats, lab, reports } from '@/lib/labData';

const icons: Record<string, any> = {
  reports: ClipboardList, revenue: IndianRupee, pending: Hourglass,
  amount: Wallet, commission: Users, expense: Receipt,
};

const quickActions = [
  { label: 'New Patient', Icon: UserPlus, href: '/add-patient' },
  { label: 'New Report', Icon: FlaskConical, href: '/create-report' },
  { label: 'Payment', Icon: CreditCard, href: '/(tabs)/reports' },
  { label: 'Add Doctor', Icon: Stethoscope, href: '/(tabs)/more' },
  { label: 'More', Icon: LayoutGrid, href: '/(tabs)/more' },
];

export default function Dashboard() {
  const width = Dimensions.get('window').width;
  const recent = reports.slice(0, 3);

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Good Morning, Ravi"
        subtitle={lab.shortName}
        left={<Menu size={22} color="#FFFFFF" />}
        onLeftPress={() => router.push('/menu' as any)}
        right={
          <>
            <Bell size={20} color="#FFFFFF" />
            <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
          </>
        }
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <FadeIn>
          <GridPanel columns={3}>
            {dashboardStats.map((s) => {
              const Icon = icons[s.key];
              return (
                <StatCard
                  key={s.key}
                  label={s.label}
                  value={s.value}
                  sub={s.sub}
                  tone={s.tone}
                  icon={<Icon size={14} color={colors[s.tone === 'primary' ? 'primary' : s.tone]} />}
                  onPress={() => router.push('/(tabs)/reports' as any)}
                />
              );
            })}
          </GridPanel>
        </FadeIn>

        <SectionTitle title="Quick Actions" action="View All" onAction={() => router.push('/(tabs)/more' as any)} />
        <FadeIn delay={60}>
          <GridPanel columns={5}>
            {quickActions.map((a) => (
              <Pressable
                key={a.label}
                style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
                onPress={() => router.push(a.href as any)}
              >
                <a.Icon size={18} color={colors.primary} />
                <Text style={styles.actionText} numberOfLines={2}>{a.label}</Text>
              </Pressable>
            ))}
          </GridPanel>
        </FadeIn>

        <SectionTitle title="Reports Overview" />
        <FadeIn delay={120}>
          <Card style={{ padding: 0 }}>
            <View style={styles.chartWrap}>
              <LineChart
                data={{ labels: chart.labels, datasets: [{ data: chart.values }] }}
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
                <Text style={styles.chartValue}>{chart.totalReports}</Text>
              </View>
              <View style={[styles.chartCell, styles.chartDivider]}>
                <Text style={styles.chartLabel}>Total Revenue</Text>
                <Text style={[styles.chartValue, { color: colors.green }]}>{chart.totalRevenue}</Text>
              </View>
              <View style={styles.chartCell}>
                <Text style={styles.chartLabel}>Avg. Per Day</Text>
                <Text style={styles.chartValue}>{chart.avgPerDay}</Text>
              </View>
            </View>
          </Card>
        </FadeIn>

        <SectionTitle title="Recent Reports" action="View All" onAction={() => router.push('/(tabs)/reports' as any)} />
        <FadeIn delay={180}>
          <Card style={{ padding: 0 }}>
            {recent.map((r, i) => (
              <ListRow key={r.id} last={i === recent.length - 1} onPress={() => router.push('/report-preview' as any)}>
                <View style={styles.recentRow}>
                  <Avatar name={r.patient} color={r.color} size={34} />
                  <View style={styles.recentCol}>
                    <Text style={styles.recentName} numberOfLines={1}>{r.patient}</Text>
                    <Text style={styles.recentMeta} numberOfLines={1}>{r.pid} · {r.test}</Text>
                    <Text style={styles.recentTime}>{r.time}</Text>
                  </View>
                  <View style={styles.recentRight}>
                    <Text style={styles.recentAmount}>₹{r.amount}</Text>
                    <Text style={[styles.recentPaid, { color: r.paid ? colors.green : colors.red }]}>
                      {r.paid ? 'Paid' : 'Unpaid'}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </View>
              </ListRow>
            ))}
          </Card>
        </FadeIn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  logo: { width: 28, height: 28, borderRadius: radius.xs, backgroundColor: '#FFFFFF' },
  body: { paddingHorizontal: spacing.hPad, paddingTop: 14, paddingBottom: 28 },
  action: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 4, backgroundColor: colors.card },
  actionPressed: { backgroundColor: colors.muted },
  actionText: { color: colors.foreground, fontFamily: fonts.medium, fontSize: 9, textAlign: 'center' },
  chartWrap: { overflow: 'hidden', paddingTop: 10 },
  chart: { marginLeft: -18, paddingRight: 0 },
  chartFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 10 },
  chartCell: { flex: 1, alignItems: 'center' },
  chartDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  chartLabel: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10 },
  chartValue: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 15, marginTop: 2 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recentCol: { flex: 1, minWidth: 0 },
  recentRight: { alignItems: 'flex-end' },
  recentName: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 13 },
  recentMeta: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10, marginTop: 1 },
  recentAmount: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 13 },
  recentPaid: { fontFamily: fonts.medium, fontSize: 9, marginTop: 2 },
  recentTime: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 9, marginTop: 1 },
});
