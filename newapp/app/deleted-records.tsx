import React from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { T } from '../components/T';
import {
  BlueHeader,
  Card,
  InfiniteListFooter,
  Press,
  SearchBar,
  Skeleton,
} from '../components/kit';
import { api, type DeletedRecord } from '../src/api';
import { C, PAGE_GUTTER } from '../src/theme';
import { useInfiniteData } from '../src/useInfiniteData';
import { useFeedback } from '../src/feedback';

const PAGE_SIZE = 15;
const FILTERS = ['All', 'Patients', 'Reports', 'Other'] as const;
type DeletedFilter = (typeof FILTERS)[number];

function filterKind(filter: DeletedFilter) {
  if (filter === 'Patients') return 'patients';
  if (filter === 'Reports') return 'reports';
  if (filter === 'Other') return 'other';
  return undefined;
}

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

function dateLabel(value?: string) {
  if (!value) return 'Deletion time unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Deletion time unavailable';
  return `Deleted ${date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
}

export default function DeletedRecordsScreen() {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const [filter, setFilter] = React.useState<DeletedFilter>('All');
  const [query, setQuery] = React.useState('');
  const [serverQuery, setServerQuery] = React.useState('');
  const [restoring, setRestoring] = React.useState('');
  const [counts, setCounts] = React.useState([0, 0, 0, 0]);
  const countsGeneration = React.useRef(0);

  React.useEffect(() => {
    const timer = setTimeout(() => setServerQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchPage = React.useCallback((page: number) => api.deleted.list({
    page,
    limit: PAGE_SIZE,
    search: serverQuery || undefined,
    kind: filterKind(filter),
  }), [filter, serverQuery]);
  const {
    items: records,
    loadMore,
    refresh,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasMore,
    loadedCount,
    total,
    error,
  } = useInfiniteData<DeletedRecord>({ fetchPage, resetKey: `${serverQuery}:${filter}` });

  const loadCounts = React.useCallback(async () => {
    const generation = ++countsGeneration.current;
    try {
      const next = await Promise.all(FILTERS.map((item) => api.deleted.list({
        page: 1,
        limit: 1,
        search: serverQuery || undefined,
        kind: filterKind(item),
      }).then((result) => result.pagination.total)));
      if (generation === countsGeneration.current) setCounts(next);
    } catch {
      if (generation === countsGeneration.current) setCounts([0, 0, 0, 0]);
    }
  }, [serverQuery]);

  React.useEffect(() => {
    loadCounts().catch(() => {});
    return () => { countsGeneration.current += 1; };
  }, [loadCounts]);

  const refreshAll = React.useCallback(async () => {
    await Promise.all([refresh(), loadCounts()]);
  }, [loadCounts, refresh]);

  const restore = (record: DeletedRecord) => {
    const id = String(record._id || record.id || '');
    confirm({
      kind: 'info',
      title: `Restore ${kindLabel(record.kind)}?`,
      message: `“${titleFor(record)}” will return to its original module.`,
      confirmText: 'Restore',
      onConfirm: async () => {
        setRestoring(id);
        try {
          await api.deleted.restore(id);
          await refreshAll();
          toast({ kind: 'success', title: 'Record restored', message: `${titleFor(record)} is available again.` });
        } catch (restoreError) {
          toast({ kind: 'error', title: 'Unable to restore', message: restoreError instanceof Error ? restoreError.message : 'Please try again.' });
        } finally {
          setRestoring('');
        }
      },
    });
  };

  const header = (
    <>
      <View style={styles.searchRow}>
        <SearchBar compact placeholder="Search deleted records" value={query} onChangeText={setQuery} />
        <Press disabled={isLoading || isRefreshing} onPress={refreshAll} style={styles.refreshButton} accessibilityLabel="Refresh deleted records">
          <MaterialCommunityIcons name={isRefreshing ? 'clock-outline' : 'refresh'} size={18} color={C.primary} />
        </Press>
      </View>
      <View style={styles.filters}>
        {FILTERS.map((item, index) => (
          <TouchableOpacity
            key={item}
            activeOpacity={0.72}
            onPress={() => setFilter(item)}
            style={[styles.filter, filter === item && styles.filterActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === item }}
          >
            <T style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</T>
            <T style={[styles.filterCount, filter === item && styles.filterTextActive]}>{counts[index]}</T>
          </TouchableOpacity>
        ))}
      </View>
      {!!error && (
        <TouchableOpacity onPress={refreshAll} style={styles.error} activeOpacity={0.75}>
          <MaterialCommunityIcons name="alert-circle-outline" size={17} color={C.red} />
          <T style={styles.errorText}>{error} Tap to retry.</T>
        </TouchableOpacity>
      )}
    </>
  );

  return (
    <View style={styles.screen}>
      <BlueHeader title="Deleted Records" sub="Review and restore removed data" onBack={() => router.back()} />
      <FlatList
        style={styles.list}
        data={records}
        keyExtractor={(record) => String(record._id || record.id)}
        ListHeaderComponent={header}
        renderItem={({ item: record, index }) => {
          const id = String(record._id || record.id || '');
          const isRestoring = restoring === id;
          return (
            <View style={[styles.row, styles.dataRow, index === 0 && styles.firstDataRow]}>
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
        }}
        ListEmptyComponent={isLoading ? (
          <Card style={styles.listCard}>
            {Array.from({ length: 5 }).map((_, index) => (
              <View key={index} style={[styles.row, index > 0 && styles.borderTop]}>
                <Skeleton width={38} height={38} radius={4} />
                <View style={styles.rowCopy}>
                  <Skeleton width="60%" height={12} />
                  <Skeleton width="42%" height={9} style={styles.skeletonSub} />
                </View>
              </View>
            ))}
          </Card>
        ) : (
          <Card style={styles.listCard}>
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><MaterialCommunityIcons name="delete-empty-outline" size={32} color={C.green} /></View>
              <T style={styles.emptyTitle}>{serverQuery || filter !== 'All' ? 'No matching deleted records' : 'Recycle bin is empty'}</T>
              <T style={styles.emptySub}>{serverQuery || filter !== 'All' ? 'Change your search or filter.' : 'Deleted records will appear here and can be restored.'}</T>
            </View>
          </Card>
        )}
        ListFooterComponent={isLoading ? null : (
          <View>
            <InfiniteListFooter loading={isLoadingMore} hasMore={hasMore} count={records.length} />
            <T style={styles.loadedText}>{loadedCount} of {total} records loaded</T>
            <T style={styles.note}>Restore patients before restoring reports linked to them.</T>
          </View>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        refreshing={isRefreshing}
        onRefresh={refreshAll}
        initialNumToRender={PAGE_SIZE}
        maxToRenderPerBatch={PAGE_SIZE}
        windowSize={7}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  list: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: PAGE_GUTTER, paddingTop: 4, paddingBottom: 28 },
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
  dataRow: { backgroundColor: '#fff', borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: C.border },
  firstDataRow: { borderTopWidth: 1, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
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
  loadedText: { color: C.faint, fontSize: 9.5, textAlign: 'center', marginTop: 2 },
  note: { color: C.faint, fontSize: 9.5, textAlign: 'center', marginTop: 4 },
  disabled: { opacity: 0.48 },
});
