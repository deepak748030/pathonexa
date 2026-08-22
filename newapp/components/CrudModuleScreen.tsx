import React from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { T } from './T';
import {
  BlueHeader,
  Card,
  InfiniteListFooter,
  Press,
  SearchBar,
  Skeleton,
} from './kit';
import { api } from '../src/api';
import { C, F, PAGE_GUTTER } from '../src/theme';
import { useInfiniteData } from '../src/useInfiniteData';
import { useFeedback } from '../src/feedback';

export type CrudField = {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
  kind?: 'text' | 'number' | 'phone' | 'email' | 'multiline' | 'select';
  options?: string[];
  max?: number;
};

export type CrudModuleConfig = {
  key: string;
  title: string;
  subtitle: string;
  singular: string;
  icon: string;
  fields: CrudField[];
  primaryKey?: string;
  secondaryKeys?: string[];
  defaultValues?: Record<string, string>;
  validate?: (values: Record<string, string>) => string | null;
};

type CrudRecord = Record<string, any> & { _id?: string; id?: string };

const PAGE_SIZE = 15;

function recordId(item: CrudRecord) {
  return String(item._id || item.id || '');
}

function initialValues(config: CrudModuleConfig, item?: CrudRecord | null) {
  return Object.fromEntries(config.fields.map((field) => [
    field.key,
    item?.[field.key] == null
      ? String(config.defaultValues?.[field.key] ?? '')
      : String(item[field.key]),
  ]));
}

function displayValue(item: CrudRecord, key: string) {
  const value = item[key];
  if (value === undefined || value === null || value === '') return '';
  const number = Number(value);
  if (key === 'commission' && Number.isFinite(number)) return `${number}% commission`;
  if (key === 'value' && Number.isFinite(number)) {
    return item.mode === 'Percentage' ? `${number}%` : `₹${number.toLocaleString('en-IN')}`;
  }
  if (key.toLowerCase().includes('price') && Number.isFinite(number)) return `₹${number.toLocaleString('en-IN')}`;
  return String(value);
}

function FormField({ field, value, onChange }: { field: CrudField; value: string; onChange: (value: string) => void }) {
  if (field.kind === 'select') {
    return (
      <View style={styles.formField}>
        <T style={styles.fieldLabel}>{field.label}{field.required ? <T style={styles.required}> *</T> : null}</T>
        <View style={styles.options}>
          {(field.options || []).map((option) => (
            <TouchableOpacity
              key={option}
              activeOpacity={0.75}
              onPress={() => onChange(option)}
              style={[styles.option, value === option && styles.optionActive]}
            >
              <T style={[styles.optionText, value === option && styles.optionTextActive]}>{option}</T>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  const numeric = field.kind === 'number' || field.kind === 'phone';
  return (
    <View style={styles.formField}>
      <T style={styles.fieldLabel}>{field.label}{field.required ? <T style={styles.required}> *</T> : null}</T>
      <TextInput
        value={value}
        onChangeText={(next) => onChange(field.kind === 'phone' ? next.replace(/\D/g, '').slice(0, 10) : next)}
        placeholder={field.placeholder}
        placeholderTextColor={C.faint}
        selectionColor={C.primary}
        keyboardType={field.kind === 'email' ? 'email-address' : numeric ? 'number-pad' : 'default'}
        multiline={field.kind === 'multiline'}
        textAlignVertical={field.kind === 'multiline' ? 'top' : 'center'}
        style={[styles.input, field.kind === 'multiline' && styles.multiline]}
      />
    </View>
  );
}

export function CrudModuleBody({ config, header }: { config: CrudModuleConfig; header?: React.ReactNode }) {
  const { toast, confirm } = useFeedback();
  const [saving, setSaving] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [serverQuery, setServerQuery] = React.useState('');
  const [editing, setEditing] = React.useState<CrudRecord | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [values, setValues] = React.useState<Record<string, string>>(() => initialValues(config));

  React.useEffect(() => {
    const timer = setTimeout(() => setServerQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchPage = React.useCallback((page: number) => api.meta.listPage<CrudRecord>(config.key, {
    page,
    limit: PAGE_SIZE,
    search: serverQuery || undefined,
  }), [config.key, serverQuery]);
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
  } = useInfiniteData<CrudRecord>({ fetchPage, resetKey: `${config.key}:${serverQuery}` });

  const openCreate = () => {
    setEditing(null);
    setValues(initialValues(config));
    setFormOpen(true);
  };

  const openEdit = (item: CrudRecord) => {
    setEditing(item);
    setValues(initialValues(config, item));
    setFormOpen(true);
  };

  const save = async () => {
    const missing = config.fields.find((field) => field.required && !String(values[field.key] || '').trim());
    if (missing) {
      toast({ kind: 'warning', title: 'Required field', message: `${missing.label} is required.` });
      return;
    }
    const invalidNumber = config.fields.find((field) => {
      if (field.kind !== 'number') return false;
      const raw = String(values[field.key] || '').trim();
      return raw !== '' && (!Number.isFinite(Number(raw)) || Number(raw) < 0
        || (field.max !== undefined && Number(raw) > field.max));
    });
    if (invalidNumber) {
      const maximum = invalidNumber.max === undefined ? '' : ` and no more than ${invalidNumber.max}`;
      toast({ kind: 'warning', title: 'Invalid value', message: `${invalidNumber.label} must be zero or a positive number${maximum}.` });
      return;
    }
    const invalidPhone = config.fields.find((field) => {
      const raw = String(values[field.key] || '').trim();
      return field.kind === 'phone' && raw !== '' && !/^[6-9]\d{9}$/.test(raw);
    });
    if (invalidPhone) {
      toast({ kind: 'warning', title: 'Invalid mobile number', message: `${invalidPhone.label} must be a valid 10-digit Indian mobile number.` });
      return;
    }
    const invalidEmail = config.fields.find((field) => {
      const raw = String(values[field.key] || '').trim();
      return field.kind === 'email' && raw !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
    });
    if (invalidEmail) {
      toast({ kind: 'warning', title: 'Invalid email', message: `Enter a valid ${invalidEmail.label.toLowerCase()}.` });
      return;
    }
    const customError = config.validate?.(values);
    if (customError) {
      toast({ kind: 'warning', title: 'Invalid value', message: customError });
      return;
    }
    const payload = Object.fromEntries(config.fields.flatMap((field) => {
      const raw = String(values[field.key] || '').trim();
      if (!editing && !field.required && raw === '') return [];
      return [[field.key, field.kind === 'number' && raw !== '' ? Number(raw) : raw]];
    }));
    setSaving(true);
    try {
      if (editing) await api.meta.update(config.key, recordId(editing), payload);
      else await api.meta.create(config.key, payload);
      setFormOpen(false);
      await refresh();
    } catch (saveError) {
      toast({ kind: 'error', title: 'Unable to save', message: saveError instanceof Error ? saveError.message : 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const remove = (item: CrudRecord) => {
    confirm({
      kind: 'warning',
      title: `Delete ${config.singular}`,
      message: `Delete “${displayValue(item, config.primaryKey || 'name') || config.singular}”? You can restore it from Deleted Records.`,
      confirmText: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await api.meta.remove(config.key, recordId(item));
          await refresh();
          toast({ kind: 'success', title: 'Deleted', message: `${config.singular} was moved to Deleted Records.` });
        } catch (removeError) {
          toast({ kind: 'error', title: 'Unable to delete', message: removeError instanceof Error ? removeError.message : 'Please try again.' });
        }
      },
    });
  };

  const primaryKey = config.primaryKey || 'name';
  const secondaryKeys = config.secondaryKeys || config.fields.map((field) => field.key).filter((key) => key !== primaryKey).slice(0, 2);

  const listHeader = (
    <>
      {header ? <View style={styles.customHeader}>{header}</View> : null}
      <View style={styles.tools}>
        <SearchBar compact placeholder={`Search ${config.title.toLowerCase()}`} value={query} onChangeText={setQuery} />
        <Press
          disabled={isLoading || isRefreshing}
          onPress={refresh}
          style={styles.refreshButton}
          accessibilityLabel={`Refresh ${config.title}`}
        >
          <MaterialCommunityIcons name={isRefreshing ? 'clock-outline' : 'refresh'} size={18} color={C.primary} />
        </Press>
        <Press onPress={openCreate} style={styles.addButton} accessibilityLabel={`Add ${config.singular}`}>
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          <T style={styles.addText}>Add</T>
        </Press>
      </View>
      {!!error && (
        <TouchableOpacity activeOpacity={0.75} onPress={refresh} style={styles.errorBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={17} color={C.red} />
          <T style={styles.errorText}>{error} Tap to retry.</T>
        </TouchableOpacity>
      )}
    </>
  );

  return (
    <>
      <FlatList
        style={styles.list}
        data={records}
        keyExtractor={(item, index) => recordId(item) || `${displayValue(item, primaryKey)}-${index}`}
        ListHeaderComponent={listHeader}
        renderItem={({ item, index }) => {
          const secondary = secondaryKeys.map((key) => displayValue(item, key)).filter(Boolean).join(' · ');
          return (
            <View style={[styles.row, styles.dataRow, index === 0 && styles.firstDataRow]}>
              <View style={styles.rowIcon}>
                <MaterialCommunityIcons name={config.icon as any} size={19} color={C.primary} />
              </View>
              <TouchableOpacity activeOpacity={0.72} onPress={() => openEdit(item)} style={styles.rowCopy}>
                <T style={styles.rowTitle} numberOfLines={1}>{displayValue(item, primaryKey) || config.singular}</T>
                {!!secondary && <T style={styles.rowSub} numberOfLines={2}>{secondary}</T>}
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} onPress={() => openEdit(item)} style={styles.rowAction} accessibilityLabel={`Edit ${config.singular}`}>
                <MaterialCommunityIcons name="pencil-outline" size={17} color={C.primary} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} onPress={() => remove(item)} style={styles.rowAction} accessibilityLabel={`Delete ${config.singular}`}>
                <MaterialCommunityIcons name="trash-can-outline" size={17} color={C.red} />
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={isLoading ? (
          <Card style={styles.listCard}>
            {Array.from({ length: 5 }).map((_, index) => (
              <View key={index} style={[styles.row, index > 0 && styles.rowBorder]}>
                <Skeleton width={36} height={36} radius={4} />
                <View style={styles.rowCopy}>
                  <Skeleton width="56%" height={12} />
                  <Skeleton width="38%" height={9} style={styles.skeletonSub} />
                </View>
              </View>
            ))}
          </Card>
        ) : (
          <Card style={styles.listCard}>
            <View style={styles.empty}>
              <MaterialCommunityIcons name={config.icon as any} size={30} color={C.faint} />
              <T style={styles.emptyTitle}>{serverQuery ? 'No matching records' : `No ${config.title.toLowerCase()} yet`}</T>
              <T style={styles.emptySub}>{serverQuery ? 'Try a different search.' : `Tap Add to create your first ${config.singular.toLowerCase()}.`}</T>
            </View>
          </Card>
        )}
        ListFooterComponent={isLoading ? null : (
          <View>
            <InfiniteListFooter loading={isLoadingMore} hasMore={hasMore} count={records.length} />
            <T style={styles.count}>{loadedCount} of {total} records loaded</T>
          </View>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        refreshing={isRefreshing}
        onRefresh={refresh}
        initialNumToRender={PAGE_SIZE}
        maxToRenderPerBatch={PAGE_SIZE}
        windowSize={7}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />

      <Modal visible={formOpen} transparent animationType="fade" onRequestClose={() => !saving && setFormOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <View style={styles.modalHeadIcon}>
                <MaterialCommunityIcons name={config.icon as any} size={20} color={C.primary} />
              </View>
              <View style={styles.modalHeadCopy}>
                <T style={styles.modalTitle}>{editing ? `Edit ${config.singular}` : `Add ${config.singular}`}</T>
                <T style={styles.modalSub}>{editing ? 'Update the saved information.' : `Create a new ${config.singular.toLowerCase()} record.`}</T>
              </View>
              <TouchableOpacity disabled={saving} onPress={() => setFormOpen(false)} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={20} color={C.sub} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              {config.fields.map((field) => (
                <FormField
                  key={field.key}
                  field={field}
                  value={values[field.key] || ''}
                  onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))}
                />
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity disabled={saving} activeOpacity={0.75} onPress={() => setFormOpen(false)} style={styles.cancelButton}>
                <T style={styles.cancelText}>Cancel</T>
              </TouchableOpacity>
              <TouchableOpacity disabled={saving} activeOpacity={0.75} onPress={save} style={[styles.saveButton, saving && styles.disabled]}>
                <MaterialCommunityIcons name={saving ? 'clock-outline' : 'content-save-outline'} size={17} color="#fff" />
                <T style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</T>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function CrudModuleScreen({ config }: { config: CrudModuleConfig }) {
  const router = useRouter();
  return (
    <View style={styles.screen}>
      <BlueHeader
        title={config.title}
        sub={config.subtitle}
        onBack={() => router.back()}
      />
      <CrudModuleBody config={config} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  list: { flex: 1 },
  pageContent: { flexGrow: 1, paddingHorizontal: PAGE_GUTTER, paddingTop: 4, paddingBottom: 28 },
  customHeader: { marginBottom: 4 },
  tools: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  refreshButton: { width: 36, height: 36, marginLeft: 4, borderRadius: 4, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  addButton: {
    height: 36,
    minWidth: 64,
    marginLeft: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 4 },
  errorBox: { flexDirection: 'row', alignItems: 'center', padding: 8, borderWidth: 1, borderColor: '#F8CACA', backgroundColor: C.redSoft, borderRadius: 4, marginBottom: 4 },
  errorText: { flex: 1, marginLeft: 4, color: C.red, fontSize: 10.5 },
  listCard: { padding: 0, overflow: 'hidden' },
  row: { minHeight: 56, paddingHorizontal: 6, paddingVertical: 7, flexDirection: 'row', alignItems: 'center' },
  dataRow: { backgroundColor: '#fff', borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: C.border },
  firstDataRow: { borderTopWidth: 1, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  rowBorder: { borderTopWidth: 1, borderTopColor: C.borderSoft },
  rowIcon: { width: 36, height: 36, borderRadius: 4, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, minWidth: 0, marginLeft: 4 },
  rowTitle: { color: C.text, fontSize: 12.5, fontWeight: '700' },
  rowSub: { color: C.sub, fontSize: 10.5, marginTop: 2, lineHeight: 14 },
  rowAction: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  skeletonSub: { marginTop: 5 },
  empty: { minHeight: 190, alignItems: 'center', justifyContent: 'center', padding: 16 },
  emptyTitle: { color: C.text, fontSize: 13, fontWeight: '700', marginTop: 6 },
  emptySub: { color: C.sub, fontSize: 10.5, textAlign: 'center', marginTop: 3 },
  count: { color: C.faint, fontSize: 10, textAlign: 'center', marginTop: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(9,20,40,0.52)', justifyContent: 'center', paddingHorizontal: PAGE_GUTTER, paddingVertical: 20 },
  modalCard: { maxHeight: '88%', width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 6, overflow: 'hidden' },
  modalHead: { minHeight: 60, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: C.borderSoft, flexDirection: 'row', alignItems: 'center' },
  modalHeadIcon: { width: 36, height: 36, borderRadius: 4, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  modalHeadCopy: { flex: 1, marginLeft: 4 },
  modalTitle: { color: C.text, fontSize: 14, fontWeight: '800' },
  modalSub: { color: C.sub, fontSize: 10, marginTop: 2 },
  closeButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  formScroll: { paddingHorizontal: 8, paddingTop: 8, paddingBottom: 4 },
  formField: { marginBottom: 7 },
  fieldLabel: { color: C.text, fontSize: 10.5, fontWeight: '600', marginBottom: 4 },
  required: { color: C.red },
  input: { minHeight: 39, borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingHorizontal: 9, paddingVertical: 7, color: C.text, fontSize: 12, fontFamily: F.regular, backgroundColor: '#fff' },
  multiline: { minHeight: 68 },
  options: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -2 },
  option: { minHeight: 34, justifyContent: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingHorizontal: 9, marginHorizontal: 2, marginBottom: 4 },
  optionActive: { borderColor: C.primary, backgroundColor: C.primaryPale },
  optionText: { color: C.sub, fontSize: 10.5, fontWeight: '600' },
  optionTextActive: { color: C.primary, fontWeight: '700' },
  modalActions: { borderTopWidth: 1, borderTopColor: C.borderSoft, padding: 8, flexDirection: 'row' },
  cancelButton: { flex: 1, height: 40, borderWidth: 1, borderColor: C.borderStrong, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginRight: 2 },
  cancelText: { color: C.sub, fontSize: 12, fontWeight: '700' },
  saveButton: { flex: 1, height: 40, borderRadius: 4, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginLeft: 2 },
  saveText: { color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 4 },
  disabled: { opacity: 0.58 },
});
