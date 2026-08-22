import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { T } from '../components/T';
import { BlueHeader, Card, Press, SearchBar, Skeleton } from '../components/kit';
import { api, type DeletedRecord } from '../src/api';
import { C, PAGE_GUTTER } from '../src/theme';

const FILTERS = ['All', 'Patients', 'Reports', 'Other'];

function titleFor(record: DeletedRecord) {
  if (record.kind === 'reports') return record.reportId || record.test || 'Deleted report';
  if (record.kind === 'patients') return record.name || record.pid || 'Deleted patient';
  return record.name || record.title || `Deleted ${record.kind}`;
}

function detailFor(record: DeletedRecord) {
  if (record.kind === 'reports') {
    const patient = typeof record.patient === 'object' ? record.patient?.name : '';
    return [patient, record.test, record.status].filter(Boolean).join(' · ');
  }
  if (record.kind === 'patients') return [record.pid, record.mobile, record.city].filter(Boolean).join(' · ');
  return [record.kind, record.mobile, record.status].filter(Boolean).join(' · ');
}

function kindLabel(kind: string) {
  const labels: Record<string, string> = {
    patients: 'Patient', reports: 'Report', doctors: 'Doctor', tests: 'Test', packages: 'Package',
    employees: 'Employee', centers: 'Center', payments: 'Payment method', discounts: 'Adjustment', templates: 'Template',
  };
  return labels[kind] || kind.replace(/s$/, '');
}

function filterMatches(record: DeletedRecord, filter: string) {
  if (filter === 'Patients') return record.kind === 'patients';
  if (filter === 'Reports') return record.kind === 'reports';
  if (filter === 'Other') return !['patients', 'reports'].includes(record.kind);
  return true;
}

function dateLabel(value?: string) {
  if (!value) return 'Deletion time unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Deletion time unavailable';
  return `Deleted ${date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
}

export default function DeletedRecordsScreen() {
  const router = useRouter();
  const [records, setRecords] = React.useState<DeletedRecord[]>([]);
  const [filter, setFilter] = React.useState('All');
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [restoring, setRestoring] = React.useState('');
  const [error, setError] = React.useState('');
  const requestRef = React.useRef(0);

  const load = React.useCallback(async (refresh = false) => {
    const request = ++requestRef.current;
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const next = await api.deleted.list();
      if (request !== requestRef.current) return;
      setRecords(next);
      setError('');
    } catch (loadError) {
      if (request !== requestRef.current) return;
      setError(loadError instanceof Error ? loadError.message : 'Unable to load deleted records.');
    } finally {
      if (request === requestRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  React.useEffect(() => {
    load().catch(() => {});
    return () => { requestRef.current += 1; };
  }, [load]);

  const restore = (record: DeletedRecord) => {
    const id = String(record._id || record.id || '');
    Alert.alert(
      `Restore ${kindLabel(record.kind)}?`,
      `“${titleFor(record)}” will return to its original module.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore', onPress: async () => {
            setRestoring(id);
            try {
              await api.deleted.restore(id);
              setRecords((current) => current.filter((item) => String(item._id || item.id) !== id));
              Alert.alert('Record restored', `${titleFor(record)} is available again.`);
            } catch (restoreError) {
              Alert.alert('Unable to restore', restoreError instanceof Error ? restoreError.message : 'Please try again.');
            } finally {
              setRestoring('');
            }
          },
        },
      ],
    );
  };

  const normalizedQuery = query.trim().toLocaleLowerCase('en-IN');
  const filtered = records.filter((record) => filterMatches(record, filter) && (!normalizedQuery || [
    titleFor(record), detailFor(record), record.kind, record.reportId, record.pid,
  ].some((value) => String(value || '').toLocaleLowerCase('en-IN').includes(normalizedQuery))));

  return (
    <View style={styles.screen}>
      <BlueHeader title="Deleted Records" sub="Review and restore removed data" onBack={() => router.back()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.searchRow}>
          <SearchBar compact placeholder="Search deleted records" value={query} onChangeText={setQuery} />
          <Press disabled={loading || refreshing} onPress={() => load(true)} style={styles.refreshButton} accessibilityLabel="Refresh deleted records">
            <MaterialCommunityIcons name={refreshing ? 'clock-outline' : 'refresh'} size={18} color={C.primary} />
          </Press>
        </View>
        <View style={styles.filters}>
          {FILTERS.map((item) => (
            <TouchableOpacity key={item} activeOpacity={0.72} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}>
              <T style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</T>
              <T style={[styles.filterCount, filter === item && styles.filterTextActive]}>
                {records.filter((record) => filterMatches(record, item)).length}
              </T>
            </TouchableOpacity>
          ))}
        </View>

        {!!error && (
          <TouchableOpacity onPress={() => load()} style={styles.error} activeOpacity={0.75}>
            <MaterialCommunityIcons name="alert-circle-outline" size={17} color={C.red} />
            <T style={styles.errorText}>{error} Tap to retry.</T>
          </TouchableOpacity>
        )}

        <Card style={styles.listCard}>
          {loading ? Array.from({ length: 5 }).map((_, index) => (
            <View key={index} style={[styles.row, index > 0 && styles.borderTop]}>
              <Skeleton width={38} height={38} radius={4} />
              <View style={styles.rowCopy}>
                <Skeleton width="60%" height={12} />
                <Skeleton width="42%" height={9} style={styles.skeletonSub} />
              </View>
            </View>
          )) : filtered.length ? filtered.map((record, index) => {
            const id = String(record._id || record.id || '');
            const isRestoring = restoring === id;
            return (
              <View key={id} style={[styles.row, index > 0 && styles.borderTop]}>
                <View style={styles.kindIcon}>
                  <MaterialCommunityIcons
                    name={record.kind === 'patients' ? 'account-outline' : record.kind === 'reports' ? 'file-document-outline' : 'archive-outline'}
                    size={19}
                    color={C.red}
                  />
                </View>
                <View style={styles.rowCopy}>
                  <View style={styles.titleLine}>
                    <T style={styles.rowTitle} numberOfLines={1}>{titleFor(record)}</T>
                    <View style={styles.kindBadge}><T style={styles.kindText}>{kindLabel(record.kind)}</T></View>
                  </View>
                  {!!detailFor(record) && <T style={styles.rowDetail} numberOfLines={1}>{detailFor(record)}</T>}
                  <T style={styles.rowDate}>{dateLabel(record.deletedAt)}</T>
                </View>
                <TouchableOpacity disabled={!!restoring} activeOpacity={0.72} onPress={() => restore(record)} style={[styles.restoreButton, !!restoring && !isRestoring && styles.disabled]}>
                  <MaterialCommunityIcons name={isRestoring ? 'clock-outline' : 'restore'} size={17} color={C.primary} />
                  <T style={styles.restoreText}>{isRestoring ? 'Wait' : 'Restore'}</T>
                </TouchableOpacity>
              </View>
            );
          }) : (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><MaterialCommunityIcons name="delete-empty-outline" size={32} color={C.green} /></View>
              <T style={styles.emptyTitle}>{query || filter !== 'All' ? 'No matching deleted records' : 'Recycle bin is empty'}</T>
              <T style={styles.emptySub}>{query || filter !== 'All' ? 'Change your search or filter.' : 'Deleted records will appear here and can be restored.'}</T>
            </View>
          )}
        </Card>
        {!loading && <T style={styles.note}>Restore patients before restoring reports linked to them.</T>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: PAGE_GUTTER, paddingTop: 4, paddingBottom: 28 },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  refreshButton: { width: 36, height: 36, marginLeft: 4, borderWidth: 1, borderColor: C.border, borderRadius: 4, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  filters: { flexDirection: 'row', marginTop: 4, marginBottom: 4 },
  filter: { flex: 1, minHeight: 34, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 1, borderRadius: 4 },
  filterActive: { borderColor: C.primary, backgroundColor: C.primaryPale },
  filterText: { color: C.sub, fontSize: 9.5, fontWeight: '600' },
  filterTextActive: { color: C.primary, fontWeight: '800' },
  filterCount: { color: C.faint, fontSize: 8.5, marginLeft: 3 },
  error: { flexDirection: 'row', alignItems: 'center', padding: 8, borderWidth: 1, borderColor: '#F8CACA', borderRadius: 4, backgroundColor: C.redSoft, marginBottom: 4 },
  errorText: { flex: 1, color: C.red, fontSize: 10.5, marginLeft: 4 },
  listCard: { padding: 0, overflow: 'hidden' },
  row: { minHeight: 69, paddingHorizontal: 6, paddingVertical: 7, flexDirection: 'row', alignItems: 'center' },
  borderTop: { borderTopWidth: 1, borderTopColor: C.borderSoft },
  kindIcon: { width: 38, height: 38, borderRadius: 4, backgroundColor: C.redSoft, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, minWidth: 0, marginLeft: 5 },
  titleLine: { flexDirection: 'row', alignItems: 'center' },
  rowTitle: { maxWidth: '72%', color: C.text, fontSize: 11.5, fontWeight: '700' },
  kindBadge: { marginLeft: 4, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 3, backgroundColor: C.blueSoft },
  kindText: { color: C.primary, fontSize: 7.5, fontWeight: '700', textTransform: 'capitalize' },
  rowDetail: { color: C.sub, fontSize: 9.5, marginTop: 2 },
  rowDate: { color: C.faint, fontSize: 8.5, marginTop: 2 },
  restoreButton: { minWidth: 70, height: 34, borderWidth: 1, borderColor: C.primaryBorder, backgroundColor: C.primaryPale, borderRadius: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  restoreText: { color: C.primary, fontSize: 9.5, fontWeight: '700', marginLeft: 3 },
  skeletonSub: { marginTop: 5 },
  empty: { minHeight: 210, alignItems: 'center', justifyContent: 'center', padding: 16 },
  emptyIcon: { width: 52, height: 52, borderRadius: 6, backgroundColor: C.greenSoft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: C.text, fontSize: 13, fontWeight: '800', marginTop: 7 },
  emptySub: { color: C.sub, fontSize: 10.5, textAlign: 'center', marginTop: 3 },
  note: { color: C.faint, fontSize: 9.5, textAlign: 'center', marginTop: 6 },
  disabled: { opacity: 0.48 },
});
