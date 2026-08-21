// Patients — UI PDF screen 2
import React from 'react';
import { T } from '../../components/T';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
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
  SquareBtn,
} from '../../components/kit';
import { useDrawer } from '../../components/Drawer';
import { C, PAGE_GUTTER } from '../../src/theme';
import { toneColor, patients, patientStats, type Patient } from '../../src/data';
import { useInfiniteData } from '../../src/useInfiniteData';

const TOTAL_PATIENTS = 1248;
const PAGE_SIZE = 12;

const footActions = [
  { icon: 'import', label: 'Import Patients' },
  { icon: 'export', label: 'Export Patients' },
  { icon: 'account-group-outline', label: 'Patient Groups' },
  { icon: 'content-copy', label: 'Duplicates' },
];

function createPatient(index: number): Patient {
  const source = patients[index % patients.length];
  const serial = index + 1;
  return {
    ...source,
    id: `patient-${serial}`,
    pid: `PT${250727000 + serial}`,
  };
}

export default function Patients() {
  const { setOpen } = useDrawer();
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const matchingIndexes = React.useMemo(() => {
    if (!normalizedQuery) return null;
    return Array.from({ length: TOTAL_PATIENTS }, (_, index) => index).filter((index) => {
      const patient = createPatient(index);
      return [patient.name, patient.pid, patient.phone, patient.test].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [normalizedQuery]);
  const makePatient = React.useCallback(
    (index: number) => createPatient(matchingIndexes ? matchingIndexes[index] : index),
    [matchingIndexes],
  );
  const { items, loadMore, refresh, isLoadingMore, isRefreshing, hasMore, loadedCount, total } = useInfiniteData({
    total: matchingIndexes?.length ?? TOTAL_PATIENTS,
    pageSize: PAGE_SIZE,
    createItem: makePatient,
    resetKey: normalizedQuery,
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
            <HeaderIconBtn icon="magnify" />
            <HeaderIconBtn icon="filter-variant" />
            <HeaderWhiteBtn icon="plus" label="Add Patient" onPress={() => router.push('/add-patient')} />
          </>
        }
      />

      <View style={styles.body}>
        <View style={styles.statRow}>
          {patientStats.map((stat) => (
            <MiniStat key={stat.label} {...stat} />
          ))}
        </View>

        <View style={[styles.row, styles.searchRow]}>
          <SearchBar placeholder="Search by Name, Mobile, Patient ID..." value={query} onChangeText={setQuery} />
          <SquareBtn icon="barcode-scan" />
        </View>

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
          {normalizedQuery ? `${loadedCount} of ${total} matching records loaded` : `${loadedCount} of ${total} loaded`}
        </T>
      </View>
    </>
  );

  return (
    <Page>
      <FlatList
        data={items}
        keyExtractor={(patient) => patient.id}
        ListHeaderComponent={header}
        renderItem={({ item: patient, index }) => (
          <View
            style={[
              styles.patientRow,
              index === 0 && styles.firstRow,
              index === items.length - 1 && styles.lastRow,
            ]}
          >
            <Avatar initials={patient.initials} tone={patient.tone} />
            <View style={styles.patientMain}>
              <T style={styles.patientName}>{patient.name}</T>
              <View style={styles.row}>
                <T style={styles.patientPid}>PID: {patient.pid}</T>
                <MaterialCommunityIcons name="barcode" size={13} color={C.faint} style={styles.barcode} />
              </View>
              <T style={styles.patientMeta}>
                {patient.age} &nbsp;•&nbsp; {patient.gender} &nbsp;•&nbsp; {patient.blood}
              </T>
            </View>
            <View style={styles.patientAside}>
              <View style={styles.row}>
                <MaterialCommunityIcons name="phone" size={11} color={C.sub} style={styles.phoneIcon} />
                <T style={styles.patientPhone}>{patient.phone}</T>
              </View>
              <T style={styles.patientLast}>Last Test: {patient.lastTest}</T>
              <T style={[styles.patientTest, { color: toneColor[patient.testTone].fg }]}>{patient.test}</T>
            </View>
            <View style={styles.chevron}>
              <Chevron />
            </View>
          </View>
        )}
        ListEmptyComponent={<T style={styles.empty}>No matching patients found.</T>}
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
  toolsCard: { marginTop: 8, paddingVertical: 10 },
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
  firstRow: { borderTopLeftRadius: 12, borderTopRightRadius: 12, borderTopColor: C.border },
  lastRow: { borderBottomWidth: 1, borderBottomColor: C.border, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
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
  listContent: { paddingBottom: 110 },
});
