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
  EmptyState,
  HeaderIconBtn,
  HeaderWhiteBtn,
  InfiniteListFooter,
  MiniStat,
  Page,
  SearchBar,
  SectionHead,
  Skeleton,
  SquareBtn,
  StatusPill,
} from '../../components/kit';
import { useDrawer } from '../../components/Drawer';
import { C, PAGE_GUTTER } from '../../src/theme';
import { api, type Report } from '../../src/api';
import { useInfiniteData } from '../../src/useInfiniteData';

const PAGE_SIZE = 10;
const STATUS_FILTERS = ['All', 'Pending', 'Completed', 'Cancelled'] as const;
const DAY_MS = 86_400_000;
const reportStatIcons = ['clipboard-text-outline', 'timer-sand', 'check-circle-outline', 'currency-rupee'];
const reportStatTones = ['blue', 'orange', 'green', 'purple'] as const;
const avatarTones = ['blue', 'green', 'purple', 'orange', 'pink'] as const;

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

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'P';
}

function avatarTone(name: string) {
  const hash = Array.from(name).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return avatarTones[hash % avatarTones.length];
}

function inputDate(timestamp: number) {
  const date = new Date(timestamp);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function isoDay(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function datePreset(index: number, customStart: number, customDays: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = today.getTime();
  if (index === 0) return { from: isoDay(end), to: isoDay(end) };
  if (index === 1) return { from: isoDay(end - DAY_MS), to: isoDay(end - DAY_MS) };
  if (index === 2) return { from: isoDay(end - 6 * DAY_MS), to: isoDay(end) };
  if (index === 3) return { from: isoDay(end - 29 * DAY_MS), to: isoDay(end) };
  return { from: isoDay(customStart), to: isoDay(customStart + (customDays - 1) * DAY_MS) };
}

function reportDateChips() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const label = (timestamp: number) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(new Date(timestamp));
  return [
    { t: 'Today', s: label(today.getTime()) },
    { t: 'Yesterday', s: label(today.getTime() - DAY_MS) },
    { t: 'Last 7 Days', s: `${label(today.getTime() - 6 * DAY_MS)} - ${label(today.getTime())}` },
    { t: 'Last 30 Days', s: `${label(today.getTime() - 29 * DAY_MS)} - ${label(today.getTime())}` },
  ];
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
  const today = React.useMemo(() => { const date = new Date(); date.setHours(0, 0, 0, 0); return date.getTime(); }, []);
  const [customStartText, setCustomStartText] = React.useState(() => inputDate(today - 29 * DAY_MS));
  const [customEndText, setCustomEndText] = React.useState(() => inputDate(today));
  const [customStart, setCustomStart] = React.useState(today - 29 * DAY_MS);
  const [customDays, setCustomDays] = React.useState(30);
  const [dateError, setDateError] = React.useState('');
  const [serverQuery, setServerQuery] = React.useState('');
  const [stats, setStats] = React.useState<Array<{ label: string; value: string; tone: string }>>([]);
  const [tabTotals, setTabTotals] = React.useState([0, 0, 0, 0]);
  const dateChips = React.useMemo(reportDateChips, []);
  const range = React.useMemo(() => datePreset(dateIndex, customStart, customDays), [customDays, customStart, dateIndex]);

  React.useEffect(() => {
    const timer = setTimeout(() => setServerQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);
  React.useEffect(() => {
    api.reports.stats().then(setStats).catch(() => setStats([]));
  }, []);
  React.useEffect(() => {
    let active = true;
    Promise.all(STATUS_FILTERS.map((status) => api.reports.list({
      page: 1,
      limit: 1,
      search: serverQuery,
      status: status === 'All' ? undefined : status,
      ...range,
    }).then((result) => result.pagination.total)))
      .then((counts) => { if (active) setTabTotals(counts); })
      .catch(() => { if (active) setTabTotals([0, 0, 0, 0]); });
    return () => { active = false; };
  }, [range, serverQuery]);

  const fetchPage = React.useCallback((page: number) => api.reports.list({
    page,
    limit: PAGE_SIZE,
    search: serverQuery,
    status: tab === 0 ? undefined : STATUS_FILTERS[tab],
    ...range,
  }), [range, serverQuery, tab]);
  const {
    items, loadMore, refresh, isLoading, isLoadingMore, isRefreshing, hasMore, loadedCount, total, error,
  } = useInfiniteData<Report>({
    fetchPage,
    resetKey: `${range.from}:${range.to}:${tab}:${serverQuery}`,
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
          {(stats.length ? stats : reportStatIcons.map((icon, index) => ({ icon, label: '', value: '', tone: reportStatTones[index] }))).map((stat, index) => (
            stats.length ? (
              <MiniStat key={stat.label} icon={reportStatIcons[index]} tone={reportStatTones[index]} value={stat.value} label={stat.label} />
            ) : (
              <View key={index} style={styles.statSkeleton}><Skeleton width={28} height={28} /><Skeleton width="60%" height={11} /><Skeleton width="75%" height={9} /></View>
            )
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
          {serverQuery ? `${loadedCount} of ${total} matching records loaded` : `${loadedCount} of ${total} loaded`}
        </T>
      </View>
    </>
  );

  return (
    <Page>
      <FlatList
        data={items}
        keyExtractor={(report) => report._id}
        ListHeaderComponent={header}
        renderItem={({ item: report, index }) => (
          <TouchableOpacity
            activeOpacity={0.72}
            onPress={() => router.push({ pathname: '/report-preview', params: { id: report._id } })}
            style={[
              styles.reportRow,
              index === 0 && styles.firstRow,
              index === items.length - 1 && styles.lastRow,
            ]}
          >
            <Avatar initials={initials(report.patient?.name || 'Patient')} tone={avatarTone(report.patient?.name || 'Patient')} size={42} />
            <View style={styles.reportMain}>
              <T style={styles.reportName}>{report.patient?.name || 'Patient'}</T>
              <T style={styles.reportMeta} numberOfLines={1}>
                PID: {report.patient?.pid || '—'} &nbsp;|&nbsp; {report.patient ? `${report.patient.age} Yrs | ${report.patient.gender}` : 'Patient unavailable'}
              </T>
              <T style={[styles.reportTest, { color: C.primary }]}>{report.test}</T>
              <T style={styles.reportDoctor}>{report.doctor ? `Ref. ${report.doctor}` : 'Self referred'}</T>
            </View>
            <View style={styles.reportDetails}>
              <T style={styles.reportLabel}>Report ID</T>
              <T style={styles.reportValue}>{report.reportId}</T>
              <T style={[styles.reportLabel, styles.dateLabel]}>Report Date</T>
              <T style={styles.reportValue}>{formatDate(new Date(report.createdAt || report.date || Date.now()).getTime())}</T>
              <T style={styles.reportValue}>{new Date(report.createdAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</T>
            </View>
            <View style={styles.reportAside}>
              <T style={styles.reportAmount}>₹{Number(report.amount || 0).toLocaleString('en-IN')}</T>
              <StatusPill status={report.status} />
            </View>
            <View style={styles.chevron}>
              <Chevron />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletonList}>
              {Array.from({ length: 6 }, (_, index) => (
                <View key={index} style={styles.reportRowSkeleton}>
                  <Skeleton width={42} height={42} radius={21} />
                  <View style={styles.reportSkeletonMain}><Skeleton width="65%" height={12} /><Skeleton width="50%" height={9} /><Skeleton width="75%" height={9} /></View>
                  <View style={styles.reportSkeletonDetails}><Skeleton width={65} height={9} /><Skeleton width={72} height={9} /></View>
                  <Skeleton width={48} height={18} />
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon={error ? 'alert-circle-outline' : 'file-search-outline'}
              tone={error ? 'red' : 'blue'}
              title={error || 'No reports found'}
              subtitle={error ? 'Pull down to retry, or check your connection.' : 'Create your first report to see it here.'}
            />
          )
        }
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
  statSkeleton: { width: '25%', minHeight: 76, alignItems: 'center', justifyContent: 'center', gap: 5 },
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
  skeletonList: { marginHorizontal: PAGE_GUTTER },
  reportRowSkeleton: { minHeight: 86, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderBottomWidth: 0, borderColor: C.borderSoft, backgroundColor: C.card },
  reportSkeletonMain: { flex: 1.4, marginLeft: 4, gap: 6 },
  reportSkeletonDetails: { flex: 1, gap: 7 },
  list: { backgroundColor: C.headerTop },
  // flexGrow keeps the grey content filling the viewport, so a short/empty
  // list never exposes the blue header background as a "blue box".
  listContent: { flexGrow: 1, paddingBottom: 110, backgroundColor: C.bg },
});
