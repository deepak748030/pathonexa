// Patients — UI PDF screen 2
import React from 'react';
import { T } from '../../components/T';
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  Avatar,
  BlueHeader,
  Card,
  Chevron,
  HeaderIconBtn,
  HeaderWhiteBtn,
  InfiniteListFooter,
  MiniStat,
  Page,
  SearchBar,
  SectionHead,
  Skeleton,
  SquareBtn,
} from '../../components/kit';
import { useDrawer } from '../../components/Drawer';
import { C, PAGE_GUTTER } from '../../src/theme';
import { api, type Patient } from '../../src/api';
import { useInfiniteData } from '../../src/useInfiniteData';

const PAGE_SIZE = 12;
const PATIENT_FILTERS = ['All', 'Male', 'Female'] as const;
type PatientFilter = (typeof PATIENT_FILTERS)[number];

const footActions = [
  { icon: 'import', label: 'Import Patients' },
  { icon: 'export', label: 'Export Patients' },
  { icon: 'account-group-outline', label: 'Patient Groups' },
  { icon: 'content-copy', label: 'Duplicates' },
];

const patientStatIcons = ['account-multiple', 'account-plus-outline', 'clipboard-text-outline', 'currency-rupee'];
const patientStatTones = ['blue', 'green', 'purple', 'orange'] as const;
const avatarTones = ['blue', 'green', 'purple', 'orange', 'pink'] as const;

function patientInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'P';
}

function patientTone(name: string) {
  const hash = Array.from(name).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return avatarTones[hash % avatarTones.length];
}

function displayDate(value?: string) {
  if (!value) return 'No previous test';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Patients() {
  const { setOpen } = useDrawer();
  const router = useRouter();
  const searchRef = React.useRef<TextInput>(null);
  const [query, setQuery] = React.useState('');
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [patientFilter, setPatientFilter] = React.useState<PatientFilter>('All');
  const [serverQuery, setServerQuery] = React.useState('');
  const [stats, setStats] = React.useState<Array<{ label: string; value: string; tone: string }>>([]);
  React.useEffect(() => {
    const timer = setTimeout(() => setServerQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);
  React.useEffect(() => {
    api.patients.stats().then(setStats).catch(() => setStats([]));
  }, []);

  const fetchPage = React.useCallback((page: number) => api.patients.list({
    page,
    limit: PAGE_SIZE,
    search: serverQuery,
    gender: patientFilter === 'All' ? undefined : patientFilter,
  }), [patientFilter, serverQuery]);
  const {
    items, loadMore, refresh, isLoading, isLoadingMore, isRefreshing, hasMore, loadedCount, total, error,
  } = useInfiniteData<Patient>({
    fetchPage,
    resetKey: `${serverQuery}:${patientFilter}`,
  });

  const header = (
    <>
      <BlueHeader
        menu
        onBack={() => setOpen(true)}
        title="Patients"
        sub="Manage all patient records"
        right={
          <>
            <HeaderIconBtn
              icon="magnify"
              onPress={() => searchRef.current?.focus()}
              accessibilityLabel="Focus patient search"
            />
            <HeaderIconBtn
              icon="filter-variant"
              badge={patientFilter === 'All' ? undefined : 1}
              onPress={() => setFilterOpen((open) => !open)}
              accessibilityLabel="Show patient filters"
            />
            <HeaderWhiteBtn icon="plus" label="Add Patient" onPress={() => router.push('/add-patient')} />
          </>
        }
      />

      <View style={styles.body}>
        <View style={styles.statRow}>
          {(stats.length ? stats : patientStatIcons.map((icon, index) => ({ icon, label: '', value: '', tone: patientStatTones[index] }))).map((stat, index) => (
            stats.length ? (
              <MiniStat
                key={stat.label}
                icon={patientStatIcons[index]}
                tone={patientStatTones[index]}
                value={stat.value}
                label={stat.label}
              />
            ) : (
              <View key={index} style={styles.statSkeleton}><Skeleton width={28} height={28} /><Skeleton width="60%" height={11} /><Skeleton width="75%" height={9} /></View>
            )
          ))}
        </View>

        <View style={[styles.row, styles.searchRow]}>
          <SearchBar
            compact
            inputRef={searchRef}
            placeholder="Name, mobile or patient ID"
            value={query}
            onChangeText={setQuery}
          />
          <SquareBtn
            compact
            icon="filter-variant"
            active={filterOpen || patientFilter !== 'All'}
            onPress={() => setFilterOpen((open) => !open)}
            accessibilityLabel="Filter patients"
          />
        </View>

        {filterOpen ? (
          <View style={styles.filterBar}>
            <T style={styles.filterLabel}>Gender</T>
            <View style={styles.filterOptions}>
              {PATIENT_FILTERS.map((filter) => {
                const selected = patientFilter === filter;
                return (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.filterChip, selected && styles.filterChipActive]}
                    onPress={() => {
                      setPatientFilter(filter);
                      setFilterOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <T style={[styles.filterChipText, selected && styles.filterChipTextActive]}>{filter}</T>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        <Card style={styles.toolsCard}>
          <View style={styles.row}>
            {footActions.map((action) => (
              <TouchableOpacity key={action.label} style={styles.footTile}>
                <MaterialCommunityIcons name={action.icon as any} size={20} color={C.primary} />
                <T style={styles.footLabel} numberOfLines={1}>
                  {action.label}
                </T>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <SectionHead title="Patient Directory" />
        <T style={styles.loadedText}>
          {serverQuery || patientFilter !== 'All'
            ? `${loadedCount} of ${total} matching records loaded`
            : `${loadedCount} of ${total} loaded`}
        </T>
      </View>
    </>
  );

  return (
    <Page>
      <FlatList
        data={items}
        keyExtractor={(patient) => patient._id}
        ListHeaderComponent={header}
        renderItem={({ item: patient, index }) => (
          <View
            style={[
              styles.patientRow,
              index === 0 && styles.firstRow,
              index === items.length - 1 && styles.lastRow,
            ]}
          >
            <Avatar initials={patientInitials(patient.name)} tone={patientTone(patient.name)} />
            <View style={styles.patientMain}>
              <T style={styles.patientName}>{patient.name}</T>
              <View style={styles.row}>
                <T style={styles.patientPid}>PID: {patient.pid}</T>
                <MaterialCommunityIcons name="barcode" size={13} color={C.faint} style={styles.barcode} />
              </View>
              <T style={styles.patientMeta}>
                {patient.age} Yrs &nbsp;•&nbsp; {patient.gender} &nbsp;•&nbsp; {patient.blood || '—'}
              </T>
            </View>
            <View style={styles.patientAside}>
              <View style={styles.row}>
                <MaterialCommunityIcons name="phone" size={11} color={C.sub} style={styles.phoneIcon} />
                <T style={styles.patientPhone}>{patient.mobile || '—'}</T>
              </View>
              <T style={styles.patientLast}>Last Test: {displayDate(patient.lastTestDate)}</T>
              <T style={[styles.patientTest, { color: C.primary }]}>{patient.lastTest || 'No test'}</T>
            </View>
            <View style={styles.chevron}>
              <Chevron />
            </View>
          </View>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletonList}>
              {Array.from({ length: 6 }, (_, index) => (
                <View key={index} style={styles.patientRowSkeleton}>
                  <Skeleton width={44} height={44} radius={22} />
                  <View style={styles.patientSkeletonCopy}><Skeleton width="55%" height={12} /><Skeleton width="38%" height={9} /><Skeleton width="68%" height={9} /></View>
                  <View style={styles.patientSkeletonAside}><Skeleton width={78} height={10} /><Skeleton width={64} height={9} /></View>
                </View>
              ))}
            </View>
          ) : <T style={styles.empty}>{error || 'No matching patients found.'}</T>
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
  filterLabel: { width: 54, fontSize: 10.5, fontWeight: '700', color: C.sub },
  filterOptions: { flex: 1, flexDirection: 'row', alignItems: 'stretch' },
  filterChip: {
    flex: 1,
    minHeight: 32,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: C.borderSoft,
  },
  filterChipActive: { backgroundColor: C.primaryPale },
  filterChipText: { fontSize: 10.5, fontWeight: '600', color: C.sub },
  filterChipTextActive: { color: C.primary, fontWeight: '700' },
  toolsCard: { marginTop: 6, paddingVertical: 10 },
  footTile: { flex: 1, alignItems: 'center', gap: 2 },
  footLabel: { fontSize: 10, color: C.text, fontWeight: '600' },
  loadedText: { fontSize: 10.5, color: C.faint, marginBottom: 4 },
  patientRow: {
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
  patientMain: { flex: 1, marginLeft: 4 },
  patientAside: { alignItems: 'flex-end' },
  patientName: { fontSize: 13.5, fontWeight: '700', color: C.text },
  patientPid: { fontSize: 10.5, color: C.faint, marginTop: 2 },
  patientMeta: { fontSize: 10.5, color: C.sub, marginTop: 3 },
  patientPhone: { fontSize: 11.5, color: C.text, fontWeight: '600' },
  patientLast: { fontSize: 10, color: C.faint, marginTop: 3 },
  patientTest: { fontSize: 11, fontWeight: '700', marginTop: 3 },
  barcode: { marginLeft: 4 },
  phoneIcon: { marginRight: 4 },
  chevron: { marginLeft: 4 },
  empty: { textAlign: 'center', color: C.faint, fontSize: 12, paddingVertical: 24 },
  skeletonList: { marginHorizontal: PAGE_GUTTER },
  patientRowSkeleton: { minHeight: 76, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderBottomWidth: 0, borderColor: C.borderSoft, backgroundColor: C.card },
  patientSkeletonCopy: { flex: 1, marginLeft: 4, gap: 6 },
  patientSkeletonAside: { alignItems: 'flex-end', gap: 7 },
  list: { backgroundColor: C.headerTop },
  listContent: { paddingBottom: 110, backgroundColor: C.bg },
});
