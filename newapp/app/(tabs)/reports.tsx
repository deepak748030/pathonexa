// Reports — UI PDF screen 5
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlueHeader, HeaderIconBtn, HeaderWhiteBtn, ScrollPage, Card, MiniStat, SearchBar, SquareBtn, Avatar, SegTabs, Chevron, StatusPill } from '../../components/kit';
import { useDrawer } from '../../components/Drawer';
import { C } from '../../src/theme';
import { toneColor, reportStats, reportRows, dateChips } from '../../src/data';

export default function Reports() {
  const { setOpen } = useDrawer();
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const tabs = ['All (48)', 'Pending (12)', 'Completed (36)', 'Cancelled (0)'];
  const rows =
    tab === 1 ? reportRows.filter((r) => r.status === 'Pending') : tab === 2 ? reportRows.filter((r) => r.status === 'Completed') : tab === 3 ? [] : reportRows;

  return (
    <ScrollPage>
      <BlueHeader
        menu
        onBack={() => setOpen(true)}
        title="Reports"
        sub="All lab reports and details"
        right={
          <>
            <HeaderIconBtn icon="magnify" />
            <HeaderIconBtn icon="filter-variant" />
            <HeaderWhiteBtn icon="plus" label="Create Report" onPress={() => router.push('/create-report')} />
          </>
        }
      />

      <View style={styles.body}>
        <View style={styles.statRow}>
          {reportStats.map((s) => (
            <MiniStat key={s.label} {...s} />
          ))}
        </View>

        <View style={[styles.row, { marginTop: 14 }]}>
          <SearchBar placeholder="Search by Patient, Report ID, Test or Doctor..." />
          <SquareBtn icon="calendar-month-outline" />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
          {dateChips.map((d) => (
            <TouchableOpacity key={d.t} style={[styles.chip, d.active && { borderColor: C.primary, backgroundColor: '#F3F8FF' }]}>
              <Text style={[styles.chipTitle, d.active && { color: C.primary }]}>{d.t}</Text>
              <Text style={[styles.chipSub, d.active && { color: C.primary }]}>{d.s}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.chip, styles.chipRow]}>
            <MaterialCommunityIcons name="calendar-month-outline" size={14} color={C.sub} />
            <Text style={styles.chipTitleGray}>Custom Range</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={{ marginTop: 14 }}>
          <SegTabs tabs={tabs} active={tab} onChange={setTab} />
        </View>

        <Card style={{ marginTop: 12, padding: 4 }}>
          {rows.map((r, i) => (
            <View key={r.id} style={[styles.rRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.borderSoft }]}>
              <Avatar initials={r.initials} tone={r.tone} size={42} />
              <View style={{ flex: 1.4, marginLeft: 10 }}>
                <Text style={styles.rName}>{r.name}</Text>
                <Text style={styles.rMeta} numberOfLines={1}>
                  PID: {r.pid} &nbsp;|&nbsp; {r.meta}
                </Text>
                <Text style={[styles.rTest, { color: toneColor[r.testTone].fg }]}>{r.test}</Text>
                <Text style={styles.rDoc}>{r.doctor}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rLbl}>Report ID</Text>
                <Text style={styles.rVal}>{r.rid}</Text>
                <Text style={[styles.rLbl, { marginTop: 6 }]}>Report Date</Text>
                <Text style={styles.rVal}>{r.date}</Text>
                <Text style={styles.rVal}>{r.time}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', marginLeft: 6 }}>
                <Text style={styles.rAmount}>{r.amount}</Text>
                <StatusPill status={r.status} />
              </View>
              <View style={{ marginLeft: 6 }}>
                <Chevron />
              </View>
            </View>
          ))}
          {rows.length === 0 && <Text style={styles.empty}>No reports in this filter.</Text>}
        </Card>

        <View style={styles.pager}>
          <Text style={styles.pagerText}>Showing 1 to 10 of 48 reports</Text>
          <View style={styles.row}>
            {['1', '2', '3', '4', '5'].map((p, i) => (
              <TouchableOpacity key={p} style={[styles.pageBtn, i === 0 && { backgroundColor: C.primary }]}>
                <Text style={[styles.pageBtnText, i === 0 && { color: '#fff' }]}>{p}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.pageBtn}>
              <MaterialCommunityIcons name="chevron-right" size={13} color={C.sub} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollPage>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  chipRow: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  chipTitle: { fontSize: 11.5, fontWeight: '700', color: C.text },
  chipTitleGray: { fontSize: 11.5, fontWeight: '600', color: C.sub },
  chipSub: { fontSize: 10, color: C.faint, marginTop: 2 },
  rRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  rName: { fontSize: 13, fontWeight: '700', color: C.text },
  rMeta: { fontSize: 10, color: C.faint, marginTop: 2 },
  rTest: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  rDoc: { fontSize: 10, color: C.sub, marginTop: 4 },
  rLbl: { fontSize: 9.5, color: C.faint },
  rVal: { fontSize: 10.5, color: C.text, fontWeight: '600', marginTop: 1 },
  rAmount: { fontSize: 12.5, fontWeight: '800', color: C.text },
  empty: { textAlign: 'center', color: C.faint, fontSize: 12, paddingVertical: 24 },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, flexWrap: 'wrap', gap: 8 },
  pagerText: { fontSize: 10.5, color: C.sub },
  pageBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },
  pageBtnText: { fontSize: 11, color: C.sub, fontWeight: '600' },
});
