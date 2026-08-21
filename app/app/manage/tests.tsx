import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ChevronLeft, Plus, FlaskConical, ChevronRight, Package, Trash2 } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import Field from '@/components/Field';
import Select, { ChipSelect } from '@/components/Select';
import PrimaryButton from '@/components/PrimaryButton';
import SearchBar from '@/components/SearchBar';
import { Card, FadeIn, ListRow, EmptyState, OfflineBanner, Badge } from '@/components/UI';
import { colors, fonts, radius } from '@/lib/theme';
import { endpoints } from '@/lib/api';
import { inr, digitsOnly } from '@/lib/format';

const CATEGORIES = ['Hematology', 'Biochemistry', 'Immunology', 'Microbiology', 'Clinical Pathology', 'Serology', 'Histopathology'];
const DEPARTMENTS = ['Pathology', 'Radiology', 'Cardiology', 'Other'];

const EMPTY = {
  name: '', short: '', category: 'Hematology', department: 'Pathology',
  price: '', template: '', header: '', status: 'Active',
};

/** Test Master — unlimited tests, each with its own parameter definitions. */
export default function TestsScreen() {
  const [tab, setTab] = React.useState<'tests' | 'packages'>('tests');
  const [tests, setTests] = React.useState<any[]>([]);
  const [packages, setPackages] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ ...EMPTY });
  const [pkgForm, setPkgForm] = React.useState<{ name: string; price: string; tests: string[] }>({ name: '', price: '', tests: [] });
  const [saving, setSaving] = React.useState(false);
  const [q, setQ] = React.useState('');

  const load = React.useCallback(async () => {
    try {
      const [t, p] = await Promise.all([endpoints.meta.tests(), endpoints.meta.packages()]);
      setTests(Array.isArray(t) ? t : []);
      setPackages(Array.isArray(p) ? p : []);
    } catch (e: any) {
      console.warn(e?.message || e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  const saveTest = async () => {
    if (!form.name.trim()) return Alert.alert('Test name is required');
    if (!Number(form.price)) return Alert.alert('Enter the test price');
    setSaving(true);
    try {
      await endpoints.meta.create('tests', {
        ...form,
        group: form.category,
        price: Number(form.price),
        parameters: [],
      });
      setForm({ ...EMPTY });
      setShowForm(false);
      await load();
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Server error');
    } finally {
      setSaving(false);
    }
  };

  const savePackage = async () => {
    if (!pkgForm.name.trim()) return Alert.alert('Package name is required');
    if (!Number(pkgForm.price)) return Alert.alert('Enter the package price');
    setSaving(true);
    try {
      await endpoints.meta.create('packages', {
        name: pkgForm.name,
        price: Number(pkgForm.price),
        tests: pkgForm.tests,
      });
      setPkgForm({ name: '', price: '', tests: [] });
      setShowForm(false);
      await load();
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Server error');
    } finally {
      setSaving(false);
    }
  };

  const removeItem = (key: 'tests' | 'packages', id: string, label: string) => {
    Alert.alert(`Delete ${label}`, 'This moves the record to Deleted Records.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await endpoints.meta.remove(key, id);
            await load();
          } catch (e: any) {
            Alert.alert('Could not delete', e?.message || 'Server error');
          }
        },
      },
    ]);
  };

  const list = (tab === 'tests' ? tests : packages).filter((x) => {
    const s = q.toLowerCase().trim();
    if (!s) return true;
    return `${x.name} ${x.category || ''} ${x.department || ''}`.toLowerCase().includes(s);
  });

  const togglePkgTest = (name: string) => {
    setPkgForm((f) => ({
      ...f,
      tests: f.tests.includes(name) ? f.tests.filter((t) => t !== name) : [...f.tests, name],
    }));
  };

  return (
    <AppScreen
      keyboard
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
      header={
        <ScreenHeader
          title="Tests & Packages"
          subtitle={`${tests.length} tests · ${packages.length} packages`}
          left={<ChevronLeft size={24} color="#fff" />}
          onLeftPress={() => router.back()}
          right={
            <Pressable style={styles.addBtn} onPress={() => setShowForm((v) => !v)}>
              <Plus size={18} color="#fff" />
            </Pressable>
          }
        />
      }
    >
      <OfflineBanner />

      <ChipSelect
        value={tab}
        onChange={(v) => setTab(v as any)}
        options={[{ label: 'Tests', value: 'tests' }, { label: 'Packages', value: 'packages' }]}
      />

      {showForm && tab === 'tests' && (
        <FadeIn>
          <Card style={{ marginTop: 12 }}>
            <Text style={styles.section}>New test</Text>
            <Field label="Test name" required value={form.name} onChangeText={(t) => setForm((f) => ({ ...f, name: t }))} placeholder="Complete Blood Count (CBC)" />
            <View style={styles.split}>
              <View style={{ flex: 1 }}>
                <Field label="Short name" value={form.short} onChangeText={(t) => setForm((f) => ({ ...f, short: t }))} placeholder="CBC" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Price (₹)" required value={form.price} keyboardType="number-pad" onChangeText={(t) => setForm((f) => ({ ...f, price: digitsOnly(t, 6) }))} placeholder="250" />
              </View>
            </View>
            <View style={styles.split}>
              <View style={{ flex: 1 }}>
                <Select label="Category" value={form.category} options={CATEGORIES} onChange={(v) => setForm((f) => ({ ...f, category: v }))} />
              </View>
              <View style={{ flex: 1 }}>
                <Select label="Department" value={form.department} options={DEPARTMENTS} onChange={(v) => setForm((f) => ({ ...f, department: v }))} />
              </View>
            </View>
            <Field label="Template" value={form.template} onChangeText={(t) => setForm((f) => ({ ...f, template: t }))} placeholder="CBC Standard" />
            <Field label="Report header" value={form.header} onChangeText={(t) => setForm((f) => ({ ...f, header: t }))} placeholder="HEMATOLOGY REPORT" />
            <Select label="Status" value={form.status} options={['Active', 'Inactive']} onChange={(v) => setForm((f) => ({ ...f, status: v }))} />
            <PrimaryButton title="Save test" onPress={saveTest} loading={saving} />
            <Text style={styles.hint}>Add parameters (unit, ranges, critical values) by opening the test after saving.</Text>
          </Card>
        </FadeIn>
      )}

      {showForm && tab === 'packages' && (
        <FadeIn>
          <Card style={{ marginTop: 12 }}>
            <Text style={styles.section}>New package</Text>
            <Field label="Package name" required value={pkgForm.name} onChangeText={(t) => setPkgForm((f) => ({ ...f, name: t }))} placeholder="Full Body Checkup" />
            <Field label="Package price (₹)" required value={pkgForm.price} keyboardType="number-pad" onChangeText={(t) => setPkgForm((f) => ({ ...f, price: digitsOnly(t, 7) }))} placeholder="2499" />
            <Text style={styles.label}>Included tests ({pkgForm.tests.length})</Text>
            {tests.map((t) => {
              const on = pkgForm.tests.includes(t.name);
              return (
                <Pressable key={t._id || t.id} style={[styles.pick, on && styles.pickOn]} onPress={() => togglePkgTest(t.name)}>
                  <View style={[styles.check, on && styles.checkOn]} />
                  <Text style={[styles.pickTxt, on && { color: colors.primary }]} numberOfLines={1}>{t.name}</Text>
                  <Text style={styles.meta}>{inr(t.price)}</Text>
                </Pressable>
              );
            })}
            <View style={{ height: 10 }} />
            <PrimaryButton title="Save package" onPress={savePackage} loading={saving} />
          </Card>
        </FadeIn>
      )}

      <View style={{ marginVertical: 10 }}>
        <SearchBar value={q} onChangeText={setQ} placeholder={`Search ${tab}`} />
      </View>

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> : (
        <Card style={{ padding: 0, marginBottom: 20 }}>
          {list.length === 0 ? (
            <EmptyState title={`No ${tab}`} subtitle="Add one with the + button." />
          ) : list.map((x, i) => (
            <ListRow
              key={x._id || i}
              last={i === list.length - 1}
              onPress={tab === 'tests'
                ? () => router.push({ pathname: '/test/[id]', params: { id: x._id || x.id } } as any)
                : undefined}
            >
              <View style={styles.row}>
                <View style={styles.icon}>
                  {tab === 'tests'
                    ? <FlaskConical size={16} color={colors.primary} />
                    : <Package size={16} color={colors.purple} />}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.title} numberOfLines={1}>{x.name}</Text>
                    {tab === 'tests' && x.status ? <Badge text={x.status} tone={x.status === 'Active' ? 'green' : 'red'} /> : null}
                  </View>
                  <Text style={styles.meta} numberOfLines={1}>
                    {tab === 'tests'
                      ? `${x.category || x.group || 'Test'} · ${x.department || 'Pathology'} · ${(x.parameters || []).length} parameters`
                      : `${(x.tests || []).length} tests · ${(x.tests || []).slice(0, 3).join(', ')}${(x.tests || []).length > 3 ? '…' : ''}`}
                  </Text>
                </View>
                <Text style={styles.price}>{inr(x.price)}</Text>
                {tab === 'tests'
                  ? <ChevronRight size={16} color={colors.mutedForeground} />
                  : (
                    <Pressable hitSlop={8} onPress={() => removeItem('packages', x._id || x.id, 'package')}>
                      <Trash2 size={15} color={colors.danger} />
                    </Pressable>
                  )}
              </View>
            </ListRow>
          ))}
        </Card>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  addBtn: { width: 36, height: 36, borderRadius: radius.xs, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  section: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground, marginBottom: 10 },
  split: { flexDirection: 'row', gap: 10 },
  label: { fontSize: 12, fontFamily: fonts.semibold, color: colors.foreground, marginBottom: 6 },
  hint: { fontFamily: fonts.regular, fontSize: 10.5, color: colors.mutedForeground, marginTop: 8, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.semibold, fontSize: 13, color: colors.foreground, flexShrink: 1 },
  meta: { fontFamily: fonts.regular, fontSize: 10.5, color: colors.mutedForeground, marginTop: 2 },
  price: { fontFamily: fonts.bold, fontSize: 13, color: colors.foreground },
  pick: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 10,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, marginBottom: 6,
  },
  pickOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  pickTxt: { flex: 1, fontFamily: fonts.medium, fontSize: 12.5, color: colors.foreground },
  check: { width: 16, height: 16, borderRadius: 5, borderWidth: 1.6, borderColor: colors.inputBorder },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
