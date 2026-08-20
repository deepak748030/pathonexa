import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ChevronLeft, Plus, Trash2, Receipt, TrendingDown } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import Field from '@/components/Field';
import Select, { ChipSelect } from '@/components/Select';
import PrimaryButton from '@/components/PrimaryButton';
import SearchBar from '@/components/SearchBar';
import { Card, FadeIn, ListRow, EmptyState, OfflineBanner } from '@/components/UI';
import { colors, fonts, radius, shadow } from '@/lib/theme';
import { endpoints } from '@/lib/api';
import { inr, digitsOnly } from '@/lib/format';

const FALLBACK_CATEGORIES = [
  'Electricity', 'Rent', 'Staff Salary', 'Chemical', 'Needle', 'Syringe',
  'Tube', 'Printer Ink', 'Internet', 'Other',
];

export default function Expenses() {
  const [items, setItems] = React.useState<any[]>([]);
  const [summary, setSummary] = React.useState<any>(null);
  const [categories, setCategories] = React.useState<string[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [filter, setFilter] = React.useState('All');
  const [q, setQ] = React.useState('');
  const [form, setForm] = React.useState({ name: '', category: 'Electricity', amount: '', mode: 'Cash', note: '' });
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const [list, sum] = await Promise.all([endpoints.expenses.list(), endpoints.expenses.summary()]);
      setItems(Array.isArray(list) ? list : []);
      setSummary(sum);
      if (sum?.categories?.length) setCategories(sum.categories);
    } catch (e: any) {
      console.warn(e?.message || e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  const save = async () => {
    if (!form.name.trim()) return Alert.alert('Expense name is required');
    if (!Number(form.amount)) return Alert.alert('Enter the amount');
    setSaving(true);
    try {
      await endpoints.expenses.create({ ...form, amount: Number(form.amount) });
      setForm({ name: '', category: form.category, amount: '', mode: form.mode, note: '' });
      setShowForm(false);
      await load();
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Server error');
    } finally {
      setSaving(false);
    }
  };

  const remove = (id: string) => {
    Alert.alert('Delete expense', 'This entry will move to Deleted Records.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await endpoints.expenses.remove(id);
            await load();
          } catch (e: any) {
            Alert.alert('Could not delete', e?.message || 'Server error');
          }
        },
      },
    ]);
  };

  const filtered = items.filter((e) => {
    if (filter !== 'All' && (e.category || 'Other') !== filter) return false;
    const s = q.toLowerCase().trim();
    if (!s) return true;
    return `${e.name} ${e.category} ${e.note}`.toLowerCase().includes(s);
  });

  const maxCat = Math.max(1, ...(summary?.byCategory || []).map((c: any) => c.amount));

  return (
    <AppScreen
      keyboard
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
      header={
        <ScreenHeader
          title="Expenses"
          subtitle="Track and report lab spending"
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
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : (
        <>
          <FadeIn>
            <View style={styles.grid}>
              <Tile label="Today" value={inr(summary?.today)} tone={colors.red} />
              <Tile label="This Month" value={inr(summary?.thisMonth)} tone={colors.orange} />
              <Tile label="Total" value={inr(summary?.total)} tone={colors.primary} />
            </View>
          </FadeIn>

          {showForm && (
            <FadeIn>
              <Card style={{ marginTop: 12 }}>
                <Text style={styles.section}>Add expense</Text>
                <Field label="Expense name" required value={form.name} onChangeText={(t) => setForm((f) => ({ ...f, name: t }))} placeholder="Electricity bill" />
                <Select label="Category" required value={form.category} options={categories} onChange={(v) => setForm((f) => ({ ...f, category: v }))} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Field label="Amount (₹)" required value={form.amount} keyboardType="number-pad" onChangeText={(t) => setForm((f) => ({ ...f, amount: digitsOnly(t, 7) }))} placeholder="500" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Select label="Paid via" value={form.mode} options={['Cash', 'UPI', 'Card', 'Bank Transfer']} onChange={(v) => setForm((f) => ({ ...f, mode: v }))} />
                  </View>
                </View>
                <Field label="Note" value={form.note} onChangeText={(t) => setForm((f) => ({ ...f, note: t }))} placeholder="Bill number / vendor" />
                <PrimaryButton title="Save expense" onPress={save} loading={saving} />
              </Card>
            </FadeIn>
          )}

          <Text style={styles.section}>Category wise</Text>
          <Card>
            {(summary?.byCategory || []).length === 0 ? (
              <EmptyState title="No expenses yet" />
            ) : summary.byCategory.map((c: any) => (
              <View key={c.category} style={styles.catRow}>
                <Text style={styles.catName} numberOfLines={1}>{c.category}</Text>
                <View style={styles.bar}>
                  <View style={[styles.barFill, { width: `${Math.round((c.amount / maxCat) * 100)}%` }]} />
                </View>
                <Text style={styles.catVal}>{inr(c.amount)}</Text>
              </View>
            ))}
          </Card>

          <Text style={styles.section}>Monthly expense report</Text>
          <Card style={{ padding: 0 }}>
            {(summary?.monthly || []).length === 0 ? <EmptyState title="No data" /> : summary.monthly.map((m: any, i: number) => (
              <ListRow key={m.key} last={i === summary.monthly.length - 1}>
                <View style={styles.row}>
                  <TrendingDown size={15} color={colors.danger} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{m.label}</Text>
                    <Text style={styles.meta}>{m.count} entries</Text>
                  </View>
                  <Text style={[styles.amount, { color: colors.danger }]}>{inr(m.amount)}</Text>
                </View>
              </ListRow>
            ))}
          </Card>

          <Text style={styles.section}>All expenses</Text>
          <View style={{ marginBottom: 8 }}>
            <SearchBar value={q} onChangeText={setQ} placeholder="Search expense" />
          </View>
          <ChipSelect small value={filter} onChange={setFilter} options={['All', ...categories]} />

          <Card style={{ padding: 0, marginTop: 10, marginBottom: 20 }}>
            {filtered.length === 0 ? (
              <EmptyState title="No expenses" subtitle="Add one with the + button." />
            ) : filtered.map((e, i) => (
              <ListRow key={e._id || i} last={i === filtered.length - 1}>
                <View style={styles.row}>
                  <View style={styles.icon}><Receipt size={15} color={colors.danger} /></View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.title} numberOfLines={1}>{e.name}</Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {e.category || 'Other'}{e.mode ? ` · ${e.mode}` : ''}{e.note ? ` · ${e.note}` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.amount, { color: colors.danger }]}>{inr(e.amount)}</Text>
                  <Pressable hitSlop={8} onPress={() => remove(e._id || e.id)}>
                    <Trash2 size={15} color={colors.danger} />
                  </Pressable>
                </View>
              </ListRow>
            ))}
          </Card>
        </>
      )}
    </AppScreen>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileV, tone ? { color: tone } : null]} numberOfLines={1}>{value}</Text>
      <Text style={styles.tileL}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: { width: 36, height: 36, borderRadius: radius.xs, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 12, ...shadow },
  tileV: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.foreground },
  tileL: { fontFamily: fonts.medium, fontSize: 10, color: colors.mutedForeground, marginTop: 3 },
  section: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground, marginTop: 16, marginBottom: 8 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  catName: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.foreground, width: 92 },
  bar: { flex: 1, height: 7, borderRadius: 4, backgroundColor: colors.muted, overflow: 'hidden' },
  barFill: { height: 7, backgroundColor: colors.orange },
  catVal: { fontFamily: fonts.bold, fontSize: 11.5, color: colors.foreground, width: 68, textAlign: 'right' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.redLight, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.foreground },
  meta: { fontFamily: fonts.regular, fontSize: 10.5, color: colors.mutedForeground, marginTop: 2 },
  amount: { fontFamily: fonts.bold, fontSize: 13 },
});
