// Reports — UI PDF screen 5
import React from 'react';
import { T } from '../../components/T';
import { FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  Avatar,
  BlueHeader,
  Chevron,
  HeaderIconBtn,
  HeaderWhiteBtn,
  InfiniteListFooter,
  MiniStat,
  Page,
  SearchBar,
  SectionHead,
  SegTabs,
  SquareBtn,
  StatusPill,
} from '../../components/kit';
import { useDrawer } from '../../components/Drawer';
import { C, PAGE_GUTTER } from '../../src/theme';
import { toneColor, reportStats, reportRows, dateChips, type ReportRow } from '../../src/data';
import { useInfiniteData } from '../../src/useInfiniteData';

const PAGE_SIZE = 10;
const TABS = ['All (48)', 'Pending (12)', 'Completed (36)', 'Cancelled (0)'];
const TAB_TOTALS = [48, 12, 36, 0];

function createReport(index: number, tab: number): ReportRow {
  const source = reportRows[index % reportRows.length];
  const serial = index + 1;
  const status: ReportRow['status'] = tab === 1 ? 'Pending' : tab === 2 ? 'Completed' : serial % 4 === 0 ? 'Pending' : 'Completed';
  return {
    ...source,
    id: `tab-${tab}-report-${serial}`,
    pid: `PT${250726000 + serial}`,
    rid: `RP${250726000 + serial}`,
    status,
  };
}

export default function Reports() {
  const { setOpen } = useDrawer();
  const router = useRouter();
  const [tab, setTab] = React.useState(0);
  const [dateIndex, setDateIndex] = React.useState(0);
  const [query, setQuery] = React.useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const matchingIndexes = React.useMemo(() => {
    if (!normalizedQuery) return null;
    return Array.from({ length: TAB_TOTALS[tab] }, (_, index) => index).filter((index) => {
      const report = createReport(index, tab);
      return [report.name, report.pid, report.rid, report.test, report.doctor].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [normalizedQuery, tab]);
  const makeReport = React.useCallback(
    (index: number) => createReport(matchingIndexes ? matchingIndexes[index] : index, tab),
    [matchingIndexes, tab],
  );
  const { items, loadMore, refresh, isLoadingMore, isRefreshing, hasMore, loadedCount, total } = useInfiniteData({
    total: matchingIndexes?.length ?? TAB_TOTALS[tab],
    pageSize: PAGE_SIZE,
    createItem: makeReport,
    resetKey: `${tab}:${normalizedQuery}`,
  });

  const header = (
    <>
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
          {reportStats.map((stat) => (
            <MiniStat key={stat.label} {...stat} />
          ))}
        </View>

        <View style={[styles.row, styles.searchRow]}>
          <SearchBar
            placeholder="Search by Patient, Report ID, Test or Doctor..."
            value={query}
            onChangeText={setQuery}
          />
          <SquareBtn icon="calendar-month-outline" />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dateScroller}
          contentContainerStyle={styles.dateContent}
        >
          {dateChips.map((date, index) => {
            const active = index === dateIndex;
            return (
              <TouchableOpacity
                key={date.t}
                style={[styles.chip, active && styles.activeChip]}
                onPress={() => setDateIndex(index)}
              >
                <T style={[styles.chipTitle, active && styles.activeChipText]}>{date.t}</T>
                <T style={[styles.chipSub, active && styles.activeChipText]}>{date.s}</T>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={[styles.chip, styles.customChip]}>
            <MaterialCommunityIcons name="calendar-month-outline" size={14} color={C.sub} />
            <T style={styles.chipTitleGray}>Custom Range</T>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.tabs}>
          <SegTabs tabs={TABS} active={tab} onChange={setTab} />
        </View>

        <SectionHead title="Report Records" />
        <T style={styles.loadedText}>
          {normalizedQuery ? `${loadedCount} of ${total} matching records loaded` : `${loadedCount} of ${total} loaded`}
        </T>
      </View>
    </>
  );

  return (
    <Page>
      <FlatList
        data={items}
        keyExtractor={(report) => report.id}
        ListHeaderComponent={header}
        renderItem={({ item: report, index }) => (
          <View
            style={[
              styles.reportRow,
              index === 0 && styles.firstRow,
              index === items.length - 1 && styles.lastRow,
            ]}
          >
            <Avatar initials={report.initials} tone={report.tone} size={42} />
            <View style={styles.reportMain}>
              <T style={styles.reportName}>{report.name}</T>
              <T style={styles.reportMeta} numberOfLines={1}>
                PID: {report.pid} &nbsp;|&nbsp; {report.meta}
              </T>
              <T style={[styles.reportTest, { color: toneColor[report.testTone].fg }]}>{report.test}</T>
              <T style={styles.reportDoctor}>{report.doctor}</T>
            </View>
            <View style={styles.reportDetails}>
              <T style={styles.reportLabel}>Report ID</T>
              <T style={styles.reportValue}>{report.rid}</T>
              <T style={[styles.reportLabel, styles.dateLabel]}>Report Date</T>
              <T style={styles.reportValue}>{report.date}</T>
              <T style={styles.reportValue}>{report.time}</T>
            </View>
            <View style={styles.reportAside}>
              <T style={styles.reportAmount}>{report.amount}</T>
              <StatusPill status={report.status} />
            </View>
            <View style={styles.chevron}>
              <Chevron />
            </View>
          </View>
        )}
        ListEmptyComponent={<T style={styles.empty}>No reports in this filter.</T>}
        ListFooterComponent={
          <InfiniteListFooter loading={isLoadingMore} hasMore={hasMore} count={items.length} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        refreshing={isRefreshing}
        onRefresh={refresh}
        initialNumToRender={PAGE_SIZE}
        maxToRenderPerBatch={PAGE_SIZE}
        windowSize={7}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: PAGE_GUTTER },
  row: { flexDirection: 'row', alignItems: 'center' },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 0, marginTop: 8 },
  searchRow: { marginTop: 8 },
  dateScroller: { marginTop: 8 },
  dateContent: { gap: 0 },
  chip: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#fff',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },
  activeChip: { borderColor: C.primary, backgroundColor: '#F3F8FF' },
  activeChipText: { color: C.primary },
  customChip: { flexDirection: 'row', gap: 4, justifyContent: 'center' },
  chipTitle: { fontSize: 11.5, fontWeight: '700', color: C.text },
  chipTitleGray: { fontSize: 11.5, fontWeight: '600', color: C.sub },
  chipSub: { fontSize: 10, color: C.faint, marginTop: 2 },
  tabs: { marginTop: 8 },
  loadedText: { fontSize: 10.5, color: C.faint, marginBottom: 4 },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: PAGE_GUTTER,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: C.card,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderColor: C.borderSoft,
  },
  firstRow: { borderTopLeftRadius: 4, borderTopRightRadius: 4, borderTopColor: C.border },
  lastRow: { borderBottomWidth: 1, borderBottomColor: C.border, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  reportMain: { flex: 1.4, marginLeft: 4 },
  reportDetails: { flex: 1 },
  reportAside: { alignItems: 'flex-end', marginLeft: 4 },
  reportName: { fontSize: 13, fontWeight: '700', color: C.text },
  reportMeta: { fontSize: 10, color: C.faint, marginTop: 2 },
  reportTest: { fontSize: 11, fontWeight: '700', marginTop: 3 },
  reportDoctor: { fontSize: 10, color: C.sub, marginTop: 3 },
  reportLabel: { fontSize: 9.5, color: C.faint },
  reportValue: { fontSize: 10.5, color: C.text, fontWeight: '600', marginTop: 1 },
  dateLabel: { marginTop: 4 },
  reportAmount: { fontSize: 12.5, fontWeight: '800', color: C.text },
  chevron: { marginLeft: 4 },
  empty: { textAlign: 'center', color: C.faint, fontSize: 12, paddingVertical: 24 },
  listContent: { paddingBottom: 110 },
});
