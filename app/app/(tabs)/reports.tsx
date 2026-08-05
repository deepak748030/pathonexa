import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Menu, Search, SlidersHorizontal, Plus, ChevronRight, FileText, Hourglass, CheckCircle2, IndianRupee, Calendar } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import StatCard from '@/components/StatCard';
import Avatar from '@/components/Avatar';
import { Card, GridPanel, FadeIn, ListRow, SectionTitle } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { reports, reportStats } from '@/lib/labData';

const statIcons = [FileText, Hourglass, CheckCircle2, IndianRupee];
const ranges = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days'];
const rangeSubs = ['26 Jul', '25 Jul', '19 - 26 Jul', '27 Jun - 26 Jul'];
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
    <View style={styles.screen}>
      <ScreenHeader
        title="Reports"
        subtitle="All lab reports and details"
        left={<Menu size={22} color="#FFFFFF" />}
        onLeftPress={() => router.push('/menu' as any)}
        right={<SlidersHorizontal size={19} color="#FFFFFF" />}
        actions={
          <>
            <View style={styles.headerSearch}>
              <Search size={15} color="rgba(255,255,255,0.9)" />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Search patient, report ID or test"
                placeholderTextColor="rgba(255,255,255,0.75)"
                style={styles.headerInput}
              />
              <Calendar size={15} color="rgba(255,255,255,0.9)" />
            </View>
            <Pressable style={styles.addBtn} onPress={() => router.push('/create-report' as any)}>
              <Plus size={14} color={colors.primary} strokeWidth={3} />
              <Text style={styles.addBtnText}>New</Text>
            </Pressable>
          </>
        }
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <FadeIn>
          <GridPanel columns={2}>
            {reportStats.map((s, i) => {
              const Icon = statIcons[i];
              return (
                <StatCard
                  key={s.label}
                  compact
                  label={s.label}
                  value={s.value}
                  tone={s.tone}
                  icon={<Icon size={15} color={colors[s.tone === 'primary' ? 'primary' : s.tone]} />}
                />
              );
            })}
          </GridPanel>
        </FadeIn>

        <SectionTitle title="Date Range" />
        <FadeIn delay={60}>
          <GridPanel columns={4}>
            {ranges.map((r, i) => (
              <Pressable
                key={r}
                onPress={() => setRange(i)}
                style={[styles.rangeChip, range === i && styles.rangeChipActive]}
              >
                <Text style={[styles.rangeText, range === i && styles.rangeTextActive]} numberOfLines={1}>{r}</Text>
                <Text style={[styles.rangeSub, range === i && styles.rangeTextActive]} numberOfLines={1}>{rangeSubs[i]}</Text>
              </Pressable>
            ))}
          </GridPanel>
        </FadeIn>

        <SectionTitle title="Status" />
        <FadeIn delay={100}>
          <GridPanel columns={4}>
            {filters.map((f, i) => (
              <Pressable key={f} onPress={() => setFilter(i)} style={[styles.tab, filter === i && styles.tabActive]}>
                <Text style={[styles.tabText, filter === i && styles.tabTextActive]} numberOfLines={1}>{f}</Text>
              </Pressable>
            ))}
          </GridPanel>
        </FadeIn>

        <SectionTitle title={`Report List (${list.length})`} />
        <FadeIn delay={140}>
          <Card style={{ padding: 0 }}>
            {list.map((r, i) => (
              <ListRow key={r.id} last={i === list.length - 1} onPress={() => router.push('/report-preview' as any)}>
                <View style={styles.row}>
                  <Avatar name={r.patient} color={r.color} size={38} />
                  <View style={styles.col}>
                    <Text style={styles.name} numberOfLines={1}>{r.patient}</Text>
                    <Text style={styles.meta} numberOfLines={1}>{r.pid} · {r.age} Yrs · {r.gender}</Text>
                    <Text style={[styles.test, { color: statusTone[r.status] }]} numberOfLines={1}>{r.test}</Text>
                    <Text style={styles.meta} numberOfLines={1}>Ref. {r.doctor}</Text>
                  </View>
                  <View style={styles.right}>
                    <Text style={styles.amount}>₹{r.amount}</Text>
                    <Text style={[styles.status, { color: statusTone[r.status] }]}>{r.status}</Text>
                    <Text style={styles.meta} numberOfLines={1}>{r.date}</Text>
                    <Text style={styles.meta} numberOfLines={1}>{r.reportId}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </View>
              </ListRow>
            ))}
            {list.length === 0 && <Text style={styles.empty}>No reports found for this filter.</Text>}
          </Card>
        </FadeIn>
        <Text style={styles.footer}>Showing {list.length} of 48 reports</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  headerSearch: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radius.sm, paddingHorizontal: 10, height: 32 },
  headerInput: { flex: 1, color: '#FFFFFF', fontFamily: fonts.regular, fontSize: 12, padding: 0 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 10, height: 32, borderRadius: radius.sm },
  addBtnText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 12 },
  body: { paddingHorizontal: spacing.hPad, paddingTop: 4, paddingBottom: 28 },
  rangeChip: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 4, backgroundColor: colors.card },
  rangeChipActive: { backgroundColor: colors.primaryLight },
  rangeText: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 10, textAlign: 'center' },
  rangeSub: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 9, marginTop: 2, textAlign: 'center' },
  rangeTextActive: { color: colors.primary },
  tab: { alignItems: 'center', justifyContent: 'center', paddingVertical: 11, paddingHorizontal: 4, backgroundColor: colors.card },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.mutedForeground, fontFamily: fonts.semibold, fontSize: 10 },
  tabTextActive: { color: '#FFFFFF' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  col: { flex: 1, minWidth: 0 },
  right: { alignItems: 'flex-end' },
  name: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 13 },
  meta: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 9, marginTop: 1 },
  test: { fontFamily: fonts.medium, fontSize: 10, marginTop: 1 },
  amount: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 13 },
  status: { fontFamily: fonts.medium, fontSize: 9, marginTop: 1 },
  empty: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 12, textAlign: 'center', paddingVertical: 24 },
  footer: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10, textAlign: 'center', marginTop: 10 },
});
