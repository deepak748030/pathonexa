import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Menu, Search, SlidersHorizontal, Plus, ChevronRight, FileText, Hourglass, CheckCircle2, IndianRupee, Calendar } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import StatCard from '@/components/StatCard';
import Avatar from '@/components/Avatar';
import { Card } from '@/components/UI';
import { colors, fonts, radius, spacing, shadow } from '@/lib/theme';
import { reports, reportStats } from '@/lib/labData';

const statIcons = [FileText, Hourglass, CheckCircle2, IndianRupee];
const ranges = ['Today\n26 Jul', 'Yesterday\n25 Jul', 'Last 7 Days\n19 - 26 Jul', 'Last 30 Days\n27 Jun - 26 Jul'];
const filters = ['All (48)', 'Pending (12)', 'Completed (36)', 'Cancelled (0)'];

const statusTone = { Completed: colors.green, Pending: colors.orange, Cancelled: colors.red } as const;

export default function Reports() {
  const [range, setRange] = useState(0);
  const [filter, setFilter] = useState(0);
  const [q, setQ] = useState('');

  const list = reports
    .filter((r) => (filter === 0 ? true : r.status === filters[filter].split(' ')[0]))
    .filter((r) => (r.patient + r.test + r.doctor + r.reportId).toLowerCase().includes(q.toLowerCase()));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Reports"
        subtitle="All lab reports and details"
        left={<Menu size={22} color="#FFFFFF" />}
        onLeftPress={() => router.push('/menu' as any)}
        right={
          <>
            <Search size={19} color="#FFFFFF" />
            <SlidersHorizontal size={18} color="#FFFFFF" />
            <Pressable style={styles.addBtn} onPress={() => router.push('/create-report' as any)}>
              <Plus size={13} color={colors.primary} strokeWidth={3} />
              <Text style={styles.addBtnText}>Create Report</Text>
            </Pressable>
          </>
        }
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {reportStats.map((s, i) => {
            const Icon = statIcons[i];
            return (
              <View key={s.label} style={styles.gridItem}>
                <StatCard compact label={s.label} value={s.value} tone={s.tone} icon={<Icon size={16} color={colors[s.tone === 'primary' ? 'primary' : s.tone]} />} />
              </View>
            );
          })}
        </View>

        <View style={styles.searchBox}>
          <Search size={16} color={colors.mutedForeground} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by Patient, Report ID, Test or Doctor..."
            placeholderTextColor={colors.mutedForeground}
            style={styles.searchInput}
          />
          <Calendar size={16} color={colors.primary} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {ranges.map((r, i) => (
            <Pressable key={r} onPress={() => setRange(i)} style={[styles.rangeChip, range === i && styles.rangeChipActive]}>
              <Text style={[styles.rangeText, range === i && { color: colors.primary }]}>{r}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.tabs}>
          {filters.map((f, i) => (
            <Pressable key={f} onPress={() => setFilter(i)} style={[styles.tab, filter === i && styles.tabActive]}>
              <Text style={[styles.tabText, filter === i && { color: '#FFFFFF' }]} numberOfLines={1}>{f}</Text>
            </Pressable>
          ))}
        </View>

        <Card style={{ padding: 0, marginTop: 10 }}>
          {list.map((r) => (
            <Pressable key={r.id} style={styles.row} onPress={() => router.push('/report-preview' as any)}>
              <Avatar name={r.patient} color={r.color} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{r.patient}</Text>
                <Text style={styles.meta}>PID: {r.pid}  |  {r.age} Yrs  |  {r.gender}</Text>
                <Text style={[styles.test, { color: statusTone[r.status] }]}>{r.test}</Text>
                <Text style={styles.meta}>Ref. {r.doctor}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.meta}>Report ID</Text>
                <Text style={styles.small}>{r.reportId}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.meta}>Report Date</Text>
                <Text style={styles.small}>{r.date}</Text>
                <Text style={styles.meta}>{r.time}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.amount}>₹{r.amount}</Text>
                <Text style={[styles.status, { color: statusTone[r.status] }]}>{r.status}</Text>
              </View>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </Pressable>
          ))}
          <Text style={styles.footer}>Showing 1 to {list.length} of 48 reports</Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.sm },
  addBtnText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 11 },
  body: { paddingHorizontal: spacing.hPad, paddingBottom: 24, marginTop: -14 },
  grid: { flexDirection: 'row', gap: 6 },
  gridItem: { flex: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: 10, marginTop: 10, ...shadow },
  searchInput: { flex: 1, height: 40, color: colors.foreground, fontFamily: fonts.regular, fontSize: 12 },
  chips: { gap: 6, paddingVertical: 10 },
  rangeChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  rangeChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  rangeText: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 10, textAlign: 'center' },
  tabs: { flexDirection: 'row', gap: 6 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: radius.sm, backgroundColor: colors.card, ...shadow },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.mutedForeground, fontFamily: fonts.semibold, fontSize: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  name: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 12 },
  meta: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 9, marginTop: 1 },
  small: { color: colors.foreground, fontFamily: fonts.medium, fontSize: 9 },
  test: { fontFamily: fonts.medium, fontSize: 10, marginTop: 1 },
  amount: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 12 },
  status: { fontFamily: fonts.medium, fontSize: 9 },
  footer: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10, padding: 10 },
});
