// Dashboard — UI PDF screen 1 & 9 (behind drawer)
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlueHeader, HeaderIconBtn, ScrollPage, Card, DashStat, SectionHead, Avatar, StatusPill, Chevron } from '../../components/kit';
import { LineChart, DonutChart } from '../../components/charts';
import { useDrawer } from '../../components/Drawer';
import { C } from '../../src/theme';
import { greeting, dashStats, quickActions, weekSeries, weekSummary, recentReports } from '../../src/data';

export default function Dashboard() {
  const { setOpen } = useDrawer();
  const router = useRouter();
  return (
    <ScrollPage>
      <BlueHeader
        menu
        onBack={() => setOpen(true)}
        title={greeting.title}
        sub={greeting.sub}
        right={
          <>
            <HeaderIconBtn icon="bell" badge={3} />
            <View style={styles.labLogo}>
              <MaterialCommunityIcons name="microscope" size={17} color={C.primary} />
              <Text style={styles.labLogoText}>{'SRPL\nLAB'}</Text>
            </View>
          </>
        }
      />

      <View style={styles.body}>
        {/* stat grid */}
        <View style={styles.statGrid}>
          {dashStats.map((s) => (
            <DashStat key={s.label} {...s} />
          ))}
        </View>

        {/* quick actions */}
        <SectionHead title="Quick Actions" action="View All" />
        <View style={styles.quickRow}>
          {quickActions.map((q) => (
            <TouchableOpacity
              key={q.label}
              style={styles.quickTile}
              onPress={() => {
                if (q.label === 'New Patient') router.push('/add-patient');
                else if (q.label === 'New Report') router.push('/create-report');
              }}
            >
              <MaterialCommunityIcons name={q.icon as any} size={22} color={C.primary} />
              <Text style={styles.quickLabel} numberOfLines={1}>
                {q.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* reports overview */}
        <Card style={{ marginTop: 14 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Reports Overview</Text>
            <View style={styles.weekChip}>
              <Text style={styles.weekChipText}>This Week</Text>
              <MaterialCommunityIcons name="chevron-down" size={14} color={C.sub} />
            </View>
          </View>
          <LineChart data={weekSeries} />
          <View style={styles.weekFoot}>
            <View style={styles.weekFootCell}>
              <Text style={styles.footLabel}>Total Reports</Text>
              <Text style={styles.footValue}>{weekSummary.reports}</Text>
            </View>
            <View style={styles.vDiv} />
            <View style={styles.weekFootCell}>
              <Text style={styles.footLabel}>Total Revenue</Text>
              <Text style={[styles.footValue, { color: C.green }]}>{weekSummary.revenue}</Text>
            </View>
            <View style={styles.vDiv} />
            <View style={styles.weekFootCell}>
              <Text style={styles.footLabel}>Avg. Per Day</Text>
              <Text style={[styles.footValue, { color: C.primary }]}>{weekSummary.avg}</Text>
            </View>
          </View>
        </Card>

        {/* recent reports */}
        <SectionHead title="Recent Reports" action="View All" onAction={() => router.push('/reports')} />
        <Card style={{ padding: 4 }}>
          {recentReports.map((r, i) => (
            <View key={r.id} style={[styles.reportRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.borderSoft }]}>
              <Avatar initials={r.initials} tone={r.tone} size={40} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.reportName}>{r.name}</Text>
                <Text style={styles.reportSub} numberOfLines={1}>
                  PID: {r.pid} &nbsp;|&nbsp; {r.test}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                <Text style={styles.reportAmount}>{r.amount}</Text>
                <StatusPill status={r.status} />
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.reportTime}>{r.time}</Text>
              </View>
              <View style={{ marginLeft: 6 }}>
                <Chevron />
              </View>
            </View>
          ))}
        </Card>

        {/* today's reports donut */}
        <SectionHead title="Today's Reports" />
        <Card>
          <DonutChart
            total="48"
            segments={[
              { label: 'Completed', value: 36, color: '#0E9F6E' },
              { label: 'Pending', value: 12, color: '#E8890C' },
              { label: 'Cancelled', value: 0, color: '#9CA3AF' },
            ]}
          />
        </Card>
      </View>
    </ScrollPage>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 14 },
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
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  quickRow: { flexDirection: 'row', gap: 8 },
  quickTile: {
    flex: 1,
    backgroundColor: '#EDF3FE',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  quickLabel: { fontSize: 10, color: C.text, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  weekChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 10,
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
  reportName: { fontSize: 13, fontWeight: '700', color: C.text },
  reportSub: { fontSize: 10.5, color: C.faint, marginTop: 2 },
  reportAmount: { fontSize: 12.5, fontWeight: '800', color: C.text },
  reportTime: { fontSize: 10, color: C.faint },
});
