// Reports — UI PDF screen 5
import React from 'react';
import { T } from '../../components/T';
import { FlatList, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
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
  SquareBtn,
  StatusPill,
} from '../../components/kit';
import { useDrawer } from '../../components/Drawer';
import { C, PAGE_GUTTER } from '../../src/theme';
import { toneColor, reportStats, reportRows, dateChips, type ReportRow } from '../../src/data';
import { useInfiniteData } from '../../src/useInfiniteData';

const PAGE_SIZE = 10;
const STATUS_FILTERS = ['All', 'Pending', 'Completed', 'Cancelled'] as const;
const PRESET_TOTALS = [48, 40, 240, 960];
const PRESET_DATES = [
  ['26 Jul 2024'],
  ['25 Jul 2024'],
  ['26 Jul 2024', '25 Jul 2024', '24 Jul 2024', '23 Jul 2024', '22 Jul 2024', '21 Jul 2024', '20 Jul 2024'],
  ['26 Jul 2024', '19 Jul 2024', '12 Jul 2024', '05 Jul 2024', '28 Jun 2024'],
];
const DAY_MS = 86_400_000;

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date.getTime();
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(timestamp));
}

function getTabTotals(dateIndex: number, customDays: number) {
  const all = dateIndex === 4 ? customDays * 48 : PRESET_TOTALS[dateIndex] ?? PRESET_TOTALS[0];
  const pending = Math.round(all / 4);
  return [all, pending, all - pending, 0];
}

function createReport(index: number, tab: number, dateIndex: number, customStart: number, customDays: number): ReportRow {
  const source = reportRows[index % reportRows.length];
  const serial = index + 1;
  const status: ReportRow['status'] = tab === 1 ? 'Pending' : tab === 2 ? 'Completed' : serial % 4 === 0 ? 'Pending' : 'Completed';
  const presetDates = PRESET_DATES[dateIndex] ?? PRESET_DATES[0];
  const date = dateIndex === 4 ? formatDate(customStart + (index % customDays) * DAY_MS) : presetDates[index % presetDates.length];
  return {
    ...source,
    id: `date-${dateIndex}-tab-${tab}-report-${serial}`,
    pid: `PT${250726000 + serial}`,
    rid: `RP${250726000 + serial}`,
    date,
    status,
  };
}

export default function Reports() {
  const { setOpen } = useDrawer();
  const router = useRouter();
  const searchRef = React.useRef<TextInput>(null);
  const [tab, setTab] = React.useState(0);
  const [dateIndex, setDateIndex] = React.useState(0);
  const [query, setQuery] = React.useState('');
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [customRangeOpen, setCustomRangeOpen] = React.useState(false);
  const [customStartText, setCustomStartText] = React.useState('01/07/2024');
  const [customEndText, setCustomEndText] = React.useState('26/07/2024');
  const [customStart, setCustomStart] = React.useState(() => new Date(2024, 6, 1).getTime());
  const [customDays, setCustomDays] = React.useState(26);
  const [dateError, setDateError] = React.useState('');
  const tabTotals = React.useMemo(() => getTabTotals(dateIndex, customDays), [dateIndex, customDays]);
  const normalizedQuery = query.trim().toLowerCase();
  const matchingIndexes = React.useMemo(() => {
    if (!normalizedQuery) return null;
    return Array.from({ length: tabTotals[tab] }, (_, index) => index).filter((index) => {
      const report = createReport(index, tab, dateIndex, customStart, customDays);
      return [report.name, report.pid, report.rid, report.test, report.doctor].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [normalizedQuery, tab, tabTotals, dateIndex, customStart, customDays]);
  const makeReport = React.useCallback(
    (index: number) => createReport(matchingIndexes ? matchingIndexes[index] : index, tab, dateIndex, customStart, customDays),
    [matchingIndexes, tab, dateIndex, customStart, customDays],
  );
  const { items, loadMore, refresh, isLoadingMore, isRefreshing, hasMore, loadedCount, total } = useInfiniteData({
    total: matchingIndexes?.length ?? tabTotals[tab],
    pageSize: PAGE_SIZE,
    createItem: makeReport,
    resetKey: `${dateIndex}:${customStart}:${customDays}:${tab}:${normalizedQuery}`,
  });

  const applyCustomRange = React.useCallback(() => {
    const start = parseDate(customStartText);
    const end = parseDate(customEndText);
    if (start === null || end === null || end < start) {
      setDateError('Enter a valid start and end date.');
      return;
    }
    const days = Math.min(365, Math.floor((end - start) / DAY_MS) + 1);
    setCustomStart(start);
    setCustomDays(days);
    setDateIndex(4);
    setDateError('');
    setCustomRangeOpen(false);
  }, [customEndText, customStartText]);

  const header = (
    <>
      <BlueHeader
        menu
        onBack={() => setOpen(true)}
        title="Reports"
        sub="All lab reports and details"
        right={
          <>
            <HeaderIconBtn
              icon="magnify"
              onPress={() => searchRef.current?.focus()}
              accessibilityLabel="Focus report search"
            />
            <HeaderIconBtn
              icon="filter-variant"
              badge={tab === 0 ? undefined : 1}
              onPress={() => setFilterOpen((open) => !open)}
              accessibilityLabel="Show report filters"
            />
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
            compact
            inputRef={searchRef}
            placeholder="Patient, report ID, test or doctor"
            value={query}
            onChangeText={setQuery}
          />
          <SquareBtn
            compact
            icon="filter-variant"
            active={filterOpen || tab !== 0}
            onPress={() => setFilterOpen((open) => !open)}
            accessibilityLabel="Filter reports"
          />
        </View>

        {filterOpen ? (
          <View style={styles.filterBar}>
            <T style={styles.filterLabel}>Status</T>
            <View style={styles.filterOptions}>
              {STATUS_FILTERS.map((filter, index) => {
                const selected = tab === index;
                return (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.filterChip, selected && styles.filterChipActive]}
                    onPress={() => {
                      setTab(index);
                      setFilterOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <T style={[styles.filterChipText, selected && styles.filterChipTextActive]} numberOfLines={1}>
                      {filter} {tabTotals[index]}
                    </T>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

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
                onPress={() => {
                  setDateIndex(index);
                  setCustomRangeOpen(false);
                  setDateError('');
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <T style={[styles.chipTitle, active && styles.activeChipText]}>{date.t}</T>
                <T style={[styles.chipSub, active && styles.activeChipText]}>{date.s}</T>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.chip, styles.customChip, dateIndex === 4 && styles.activeChip]}
            onPress={() => setCustomRangeOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityState={{ selected: dateIndex === 4 }}
          >
            <MaterialCommunityIcons name="calendar-month-outline" size={14} color={dateIndex === 4 ? C.primary : C.sub} />
            <View>
              <T style={[styles.chipTitleGray, dateIndex === 4 && styles.activeChipText]}>Custom Range</T>
              {dateIndex === 4 ? (
                <T style={[styles.chipSub, styles.activeChipText]}>{customStartText} – {customEndText}</T>
              ) : null}
            </View>
          </TouchableOpacity>
        </ScrollView>

        {customRangeOpen ? (
          <View style={styles.customRangePanel}>
            <TextInput
              style={styles.dateInput}
              value={customStartText}
              onChangeText={(value) => setCustomStartText(formatDateInput(value))}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={C.faint}
              keyboardType="number-pad"
              maxLength={10}
              accessibilityLabel="Custom range start date"
            />
            <MaterialCommunityIcons name="arrow-right" size={14} color={C.faint} />
            <TextInput
              style={styles.dateInput}
              value={customEndText}
              onChangeText={(value) => setCustomEndText(formatDateInput(value))}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={C.faint}
              keyboardType="number-pad"
              maxLength={10}
              accessibilityLabel="Custom range end date"
            />
            <TouchableOpacity style={styles.applyDateButton} onPress={applyCustomRange} accessibilityRole="button">
              <T style={styles.applyDateText}>Apply</T>
            </TouchableOpacity>
          </View>
        ) : null}
        {dateError ? <T style={styles.dateError}>{dateError}</T> : null}

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
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: PAGE_GUTTER },
  row: { flexDirection: 'row', alignItems: 'center' },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 0, marginTop: 8 },
  searchRow: { marginTop: 6 },
  filterBar: {
    minHeight: 34,
    marginTop: 4,
    paddingLeft: 7,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    backgroundColor: C.card,
  },
  filterLabel: { width: 48, fontSize: 10.5, fontWeight: '700', color: C.sub },
  filterOptions: { flex: 1, flexDirection: 'row', alignItems: 'stretch' },
  filterChip: {
    flex: 1,
    minHeight: 32,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: C.borderSoft,
  },
  filterChipActive: { backgroundColor: C.primaryPale },
  filterChipText: { fontSize: 9.5, fontWeight: '600', color: C.sub },
  filterChipTextActive: { color: C.primary, fontWeight: '700' },
  dateScroller: { marginTop: 4 },
  dateContent: { gap: 0 },
  chip: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#fff',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 5,
    alignItems: 'center',
  },
  activeChip: { borderColor: C.primary, backgroundColor: '#F3F8FF' },
  activeChipText: { color: C.primary },
  customChip: { flexDirection: 'row', gap: 4, justifyContent: 'center' },
  chipTitle: { fontSize: 10.5, fontWeight: '700', color: C.text },
  chipTitleGray: { fontSize: 10.5, fontWeight: '600', color: C.sub },
  chipSub: { fontSize: 9.5, color: C.faint, marginTop: 1 },
  customRangePanel: {
    minHeight: 38,
    marginTop: 4,
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    backgroundColor: C.card,
  },
  dateInput: {
    flex: 1,
    minWidth: 0,
    height: 30,
    paddingHorizontal: 5,
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: C.borderSoft,
    borderRadius: 3,
    color: C.text,
    fontSize: 10.5,
  },
  applyDateButton: {
    height: 30,
    marginLeft: 3,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    backgroundColor: C.primary,
  },
  applyDateText: { color: '#fff', fontSize: 10.5, fontWeight: '700' },
  dateError: { marginTop: 2, color: C.red, fontSize: 10 },
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
  list: { backgroundColor: C.headerTop },
  listContent: { paddingBottom: 110, backgroundColor: C.bg },
});
