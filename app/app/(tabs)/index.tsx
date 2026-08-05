import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import {
  Menu, Bell, ClipboardList, IndianRupee, Hourglass, Wallet, Users, Receipt,
  UserPlus, FlaskConical, CreditCard, Stethoscope, LayoutGrid,
} from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import StatCard from '@/components/StatCard';
import Avatar from '@/components/Avatar';
import { Card, SectionTitle } from '@/components/UI';
import { colors, fonts, radius, spacing, shadow } from '@/lib/theme';
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
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Good Morning, Ravi 👋"
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
        <View style={styles.grid}>
          {dashboardStats.map((s) => {
            const Icon = icons[s.key];
            return (
              <View key={s.key} style={styles.gridItem}>
                <StatCard
                  label={s.label}
                  value={s.value}
                  sub={s.sub}
                  tone={s.tone}
                  icon={<Icon size={15} color={colors[s.tone === 'primary' ? 'primary' : s.tone]} />}
                  onPress={() => router.push('/(tabs)/reports' as any)}
                />
              </View>
            );
          })}
        </View>

        <SectionTitle title="Quick Actions" action="View All" onAction={() => router.push('/(tabs)/more' as any)} />
        <View style={styles.actions}>
          {quickActions.map((a) => (
            <Pressable key={a.label} style={styles.action} onPress={() => router.push(a.href as any)}>
              <a.Icon size={18} color={colors.primary} />
              <Text style={styles.actionText} numberOfLines={1}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        <SectionTitle title="Reports Overview" />
        <Card>
          <LineChart
            data={{ labels: chart.labels, datasets: [{ data: chart.values }] }}
            width={width - spacing.hPad * 2 - 24}
            height={170}
            withInnerLines={false}
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
            style={{ marginLeft: -14 }}
          />
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

        <SectionTitle title="Recent Reports" action="View All" onAction={() => router.push('/(tabs)/reports' as any)} />
        <Card style={{ padding: 0 }}>
          {reports.slice(0, 3).map((r) => (
            <Pressable key={r.id} style={styles.recent} onPress={() => router.push('/report-preview' as any)}>
              <Avatar name={r.patient} color={r.color} />
              <View style={{ flex: 1 }}>
                <Text style={styles.recentName}>{r.patient}</Text>
                <Text style={styles.recentMeta}>PID: {r.pid}  |  {r.test}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.recentAmount}>₹{r.amount}</Text>
                <Text style={[styles.recentPaid, { color: r.paid ? colors.green : colors.red }]}>{r.paid ? 'Paid' : 'Unpaid'}</Text>
              </View>
              <Text style={styles.recentTime}>{r.time}</Text>
            </Pressable>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFFFFF' },
  body: { paddingHorizontal: spacing.hPad, paddingBottom: 24, marginTop: -14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.gap },
  gridItem: { width: '31.5%' },
  actions: { flexDirection: 'row', gap: 6 },
  action: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, alignItems: 'center', gap: 4, paddingVertical: 10, ...shadow },
  actionText: { color: colors.foreground, fontFamily: fonts.medium, fontSize: 9 },
  chartFooter: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 },
  chartCell: { flex: 1, alignItems: 'center' },
  chartDivider: { borderLeftWidth: StyleSheet.hairlineWidth, borderRightWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  chartLabel: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10 },
  chartValue: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 15 },
  recent: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  recentName: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 12 },
  recentMeta: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10, marginTop: 1 },
  recentAmount: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 12 },
  recentPaid: { fontFamily: fonts.medium, fontSize: 9 },
  recentTime: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 9 },
});
