import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ChevronLeft, Plus, Trash2, Search } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import { Card, FadeIn, ListRow, EmptyState, OfflineBanner } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { endpoints } from '@/lib/api';

type Field = { key: string; label: string; placeholder: string; keyboard?: 'default' | 'number-pad' };

const CONFIG: Record<string, { title: string; api: string; fields: Field[]; subtitle: (x: any) => string; titleOf: (x: any) => string }> = {
  doctors: {
    title: 'Doctors',
    api: 'doctors',
    fields: [
      { key: 'name', label: 'Doctor name', placeholder: 'Dr. Name' },
      { key: 'degree', label: 'Degree', placeholder: 'MBBS, MD' },
      { key: 'mobile', label: 'Mobile', placeholder: '10-digit number', keyboard: 'number-pad' },
      { key: 'commission', label: 'Commission %', placeholder: '15', keyboard: 'number-pad' },
    ],
    titleOf: (x) => x.name,
    subtitle: (x) => `${x.degree || '—'} · ${x.mobile || ''} · ${x.commission || 0}%`,
  },
  tests: {
    title: 'Tests & Packages',
    api: 'tests',
    fields: [
      { key: 'name', label: 'Test name', placeholder: 'CBC' },
      { key: 'group', label: 'Group', placeholder: 'Hematology' },
      { key: 'price', label: 'Price (₹)', placeholder: '250', keyboard: 'number-pad' },
    ],
    titleOf: (x) => x.name,
    subtitle: (x) => `${x.group || 'Test'} · ₹${x.price ?? 0}`,
  },
  employees: {
    title: 'Lab Employees',
    api: 'employees',
    fields: [
      { key: 'name', label: 'Name', placeholder: 'Staff name' },
      { key: 'role', label: 'Role', placeholder: 'Technician' },
      { key: 'mobile', label: 'Mobile', placeholder: '10-digit number', keyboard: 'number-pad' },
    ],
    titleOf: (x) => x.name,
    subtitle: (x) => `${x.role || ''} · ${x.mobile || ''}`,
  },
  centers: {
    title: 'Collection Centers',
    api: 'centers',
    fields: [
      { key: 'name', label: 'Center name', placeholder: 'Main Lab' },
      { key: 'city', label: 'City', placeholder: 'Lucknow' },
      { key: 'phone', label: 'Phone', placeholder: 'Landline / mobile' },
    ],
    titleOf: (x) => x.name,
    subtitle: (x) => `${x.city || ''} · ${x.phone || ''}`,
  },
  payments: {
    title: 'Payment Methods',
    api: 'payments',
    fields: [{ key: 'name', label: 'Method name', placeholder: 'UPI / Cash / Card' }],
    titleOf: (x) => x.name,
    subtitle: (x) => (x.active === false ? 'Inactive' : 'Active'),
  },
  discounts: {
    title: 'Discount & Charges',
    api: 'discounts',
    fields: [
      { key: 'name', label: 'Name', placeholder: 'Senior citizen' },
      { key: 'percent', label: 'Percent', placeholder: '10', keyboard: 'number-pad' },
    ],
    titleOf: (x) => x.name,
    subtitle: (x) => `${x.percent || 0}%`,
  },
  templates: {
    title: 'Report Templates',
    api: 'templates',
    fields: [
      { key: 'name', label: 'Template name', placeholder: 'CBC Standard' },
      { key: 'test', label: 'Linked test', placeholder: 'CBC' },
    ],
    titleOf: (x) => x.name,
    subtitle: (x) => x.test || 'Custom',
  },
  deleted: {
    title: 'Deleted Records',
    api: 'deleted',
    fields: [],
    titleOf: (x) => x.name || x.reportId || 'Record',
    subtitle: (x) => `${x.kind || ''} · ${x.deletedAt ? new Date(x.deletedAt).toLocaleString() : ''}`,
  },
};

export default function ManageScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const cfg = CONFIG[slug || ''] || CONFIG.doctors;
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState<Record<string, string>>({});
  const [q, setQ] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const data = slug === 'deleted' ? await endpoints.meta.deleted() : await endpoints.meta.list(cfg.api);
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.warn(e?.message || e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [cfg.api, slug]);

  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  const onSave = async () => {
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (payload.price) payload.price = Number(payload.price);
      if (payload.commission) payload.commission = Number(payload.commission);
      if (payload.percent) payload.percent = Number(payload.percent);
      await endpoints.meta.create(cfg.api, payload);
      setForm({});
      setShowForm(false);
      await load();
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Server error');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await endpoints.meta.remove(cfg.api, id);
      await load();
    } catch (e: any) {
      Alert.alert('Could not delete', e?.message || 'Server error');
    }
  };

  const filtered = items.filter((it) => {
    const s = q.toLowerCase().trim();
    if (!s) return true;
    return `${cfg.titleOf(it)} ${cfg.subtitle(it)}`.toLowerCase().includes(s);
  });

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={cfg.title}
        subtitle={`${items.length} records`}
        left={<ChevronLeft size={24} color="#FFFFFF" />}
        onLeftPress={() => router.back()}
        right={
          cfg.fields.length ? (
            <Pressable style={styles.addBtn} onPress={() => setShowForm((v) => !v)}>
              <Plus size={18} color="#FFFFFF" />
            </Pressable>
          ) : null
        }
      />
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.primary} />}
      >
        <OfflineBanner />
        {showForm && cfg.fields.length > 0 && (
          <FadeIn>
            <Card style={styles.form}>
              {cfg.fields.map((f) => (
                <View key={f.key} style={styles.inputGroup}>
                  <Text style={styles.label}>{f.label}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.placeholder}
                    value={form[f.key] || ''}
                    keyboardType={f.keyboard || 'default'}
                    onChangeText={(t) => setForm((prev) => ({ ...prev, [f.key]: t }))}
                  />
                </View>
              ))}
              <Pressable style={styles.save} onPress={onSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
              </Pressable>
            </Card>
          </FadeIn>
        )}

        <View style={styles.search}>
          <Search size={16} color={colors.mutedForeground} />
          <TextInput style={styles.searchInput} placeholder="Search..." placeholderTextColor={colors.placeholder} value={q} onChangeText={setQ} />
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <Card style={{ padding: 0 }}>
            {filtered.length === 0 ? (
              <EmptyState title="No records" subtitle="Add one with the + button." />
            ) : (
              filtered.map((it, i) => (
                <ListRow key={it._id || it.id || i} last={i === filtered.length - 1}>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{cfg.titleOf(it)}</Text>
                      <Text style={styles.rowSub}>{cfg.subtitle(it)}</Text>
                    </View>
                    {cfg.fields.length > 0 && (
                      <Pressable onPress={() => onDelete(it._id || it.id)} hitSlop={8}>
                        <Trash2 size={16} color={colors.danger} />
                      </Pressable>
                    )}
                  </View>
                </ListRow>
              ))
            )}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: spacing.hPad, paddingTop: 8, paddingBottom: 32 },
  addBtn: { width: 36, height: 36, borderRadius: radius.xs, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  form: { marginBottom: 12 },
  inputGroup: { marginBottom: 10 },
  label: { fontSize: 11, fontFamily: fonts.semibold, color: colors.mutedForeground, marginBottom: 5 },
  input: { height: 40, borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: radius.md, paddingHorizontal: 10, fontFamily: fonts.medium, fontSize: 13, color: colors.foreground, backgroundColor: colors.inputBg },
  save: { height: 42, backgroundColor: colors.primary, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  saveText: { color: '#fff', fontFamily: fonts.bold, fontSize: 14 },
  search: { flexDirection: 'row', alignItems: 'center', height: 40, backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  searchInput: { flex: 1, marginLeft: 8, fontFamily: fonts.medium, fontSize: 13, color: colors.foreground },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowTitle: { fontFamily: fonts.semibold, fontSize: 13, color: colors.foreground },
  rowSub: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
});
