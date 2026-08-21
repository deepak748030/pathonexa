import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Switch } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ChevronLeft, Plus, Save, Trash2, ArrowUp, ArrowDown } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import Field from '@/components/Field';
import Select from '@/components/Select';
import PrimaryButton from '@/components/PrimaryButton';
import { Card, FadeIn, EmptyState, OfflineBanner } from '@/components/UI';
import { colors, fonts, radius } from '@/lib/theme';
import { endpoints } from '@/lib/api';
import { inr, digitsOnly } from '@/lib/format';

type Param = {
  order: number; name: string; short: string; unit: string; range: string;
  criticalLow: string; criticalHigh: string; maleRange: string; femaleRange: string;
  childRange: string; decimals: number; bold: boolean; highlight: boolean; group: string;
};

const blankParam = (order: number, group: string): Param => ({
  order, name: '', short: '', unit: '', range: '', criticalLow: '', criticalHigh: '',
  maleRange: '', femaleRange: '', childRange: '', decimals: 1, bold: false, highlight: false,
  group: group || 'Results',
});

/**
 * Test Master detail — every parameter field required by the specification:
 * name, short name, unit, normal range, critical high/low, decimals,
 * male / female / child ranges, print order, bold and highlight.
 */
export default function TestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [test, setTest] = React.useState<any>(null);
  const [params, setParams] = React.useState<Param[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [open, setOpen] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    if (!id) return;
    try {
      const t = await endpoints.meta.get('tests', String(id));
      setTest(t);
      setParams((t?.parameters || []).map((p: any, i: number) => ({ ...blankParam(i + 1, t?.name), ...p })));
    } catch (e: any) {
      console.warn(e?.message || e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  const setField = (k: string, v: any) => setTest((t: any) => ({ ...t, [k]: v }));
  const setParam = (i: number, k: keyof Param, v: any) =>
    setParams((list) => list.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)));

  const move = (i: number, dir: -1 | 1) => {
    setParams((list) => {
      const next = [...list];
      const j = i + dir;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j], next[i]];
      return next.map((p, idx) => ({ ...p, order: idx + 1 }));
    });
  };

  const addParam = () => {
    setParams((list) => [...list, blankParam(list.length + 1, list[list.length - 1]?.group || test?.name || 'Results')]);
    setOpen(params.length);
  };

  const removeParam = (i: number) => {
    setParams((list) => list.filter((_, idx) => idx !== i).map((p, idx) => ({ ...p, order: idx + 1 })));
    setOpen(null);
  };

  const save = async () => {
    if (!test?.name?.trim()) return Alert.alert('Test name is required');
    setSaving(true);
    try {
      await endpoints.meta.update('tests', String(id), {
        name: test.name,
        short: test.short,
        category: test.category,
        group: test.category || test.group,
        department: test.department,
        price: Number(test.price || 0),
        template: test.template,
        header: test.header,
        status: test.status,
        parameters: params
          .filter((p) => p.name.trim())
          .map((p, i) => ({ ...p, order: i + 1, decimals: Number(p.decimals || 0) })),
      });
      Alert.alert('Saved', 'Test master updated.');
      await load();
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Server error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppScreen header={<ScreenHeader title="Test" left={<ChevronLeft size={24} color="#fff" />} onLeftPress={() => router.back()} />}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
      </AppScreen>
    );
  }

  if (!test) {
    return (
      <AppScreen header={<ScreenHeader title="Test" left={<ChevronLeft size={24} color="#fff" />} onLeftPress={() => router.back()} />}>
        <EmptyState title="Test not found" />
      </AppScreen>
    );
  }

  return (
    <AppScreen
      keyboard
      header={
        <ScreenHeader
          title={test.name}
          subtitle={`${test.category || 'Test'} · ${params.length} parameters · ${inr(test.price)}`}
          left={<ChevronLeft size={24} color="#fff" />}
          onLeftPress={() => router.back()}
          right={
            <Pressable style={styles.addBtn} onPress={save}>
              <Save size={17} color="#fff" />
            </Pressable>
          }
        />
      }
      footer={
        <View style={styles.footer}>
          <PrimaryButton title="Save test master" onPress={save} loading={saving} icon={<Save size={16} color="#fff" />} />
        </View>
      }
    >
      <OfflineBanner />

      <FadeIn>
        <Card>
          <Text style={styles.section}>Test details</Text>
          <Field label="Test name" required value={test.name || ''} onChangeText={(t) => setField('name', t)} />
          <View style={styles.split}>
            <View style={{ flex: 1 }}>
              <Field label="Short name" value={test.short || ''} onChangeText={(t) => setField('short', t)} placeholder="CBC" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Price (₹)" value={String(test.price ?? '')} keyboardType="number-pad" onChangeText={(t) => setField('price', digitsOnly(t, 6))} />
            </View>
          </View>
          <View style={styles.split}>
            <View style={{ flex: 1 }}>
              <Field label="Category" value={test.category || ''} onChangeText={(t) => setField('category', t)} placeholder="Hematology" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Department" value={test.department || ''} onChangeText={(t) => setField('department', t)} placeholder="Pathology" />
            </View>
          </View>
          <Field label="Template" value={test.template || ''} onChangeText={(t) => setField('template', t)} placeholder="CBC Standard" />
          <Field label="Report header" value={test.header || ''} onChangeText={(t) => setField('header', t)} placeholder="HEMATOLOGY REPORT" />
          <Select label="Status" value={test.status || 'Active'} options={['Active', 'Inactive']} onChange={(v) => setField('status', v)} />
        </Card>
      </FadeIn>

      <View style={styles.paramHead}>
        <Text style={styles.section}>Parameters ({params.length})</Text>
        <Pressable style={styles.addParam} onPress={addParam}>
          <Plus size={14} color={colors.primary} />
          <Text style={styles.addParamTxt}>Add parameter</Text>
        </Pressable>
      </View>

      {params.length === 0 ? (
        <Card><EmptyState title="No parameters" subtitle="Add the first parameter of this test." /></Card>
      ) : params.map((p, i) => {
        const expanded = open === i;
        return (
          <Card key={`${p.name}-${i}`} style={{ marginBottom: 8, padding: 0 }}>
            <Pressable style={styles.pRow} onPress={() => setOpen(expanded ? null : i)}>
              <View style={styles.pIndex}><Text style={styles.pIndexTxt}>{i + 1}</Text></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.pName, p.bold && { fontFamily: fonts.extrabold }]} numberOfLines={1}>
                  {p.name || 'New parameter'}{p.short ? ` (${p.short})` : ''}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {p.unit || '—'} · {p.range || 'no range'}{p.criticalHigh ? ` · critical >${p.criticalHigh}` : ''}
                </Text>
              </View>
              <Pressable hitSlop={6} onPress={() => move(i, -1)}><ArrowUp size={14} color={colors.mutedForeground} /></Pressable>
              <Pressable hitSlop={6} onPress={() => move(i, 1)}><ArrowDown size={14} color={colors.mutedForeground} /></Pressable>
              <Pressable hitSlop={6} onPress={() => removeParam(i)}><Trash2 size={14} color={colors.danger} /></Pressable>
            </Pressable>

            {expanded && (
              <View style={styles.pBody}>
                <View style={styles.split}>
                  <View style={{ flex: 1.4 }}>
                    <Field label="Parameter name" value={p.name} onChangeText={(t) => setParam(i, 'name', t)} placeholder="Hemoglobin" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Short name" value={p.short} onChangeText={(t) => setParam(i, 'short', t)} placeholder="HGB" />
                  </View>
                </View>
                <View style={styles.split}>
                  <View style={{ flex: 1 }}>
                    <Field label="Unit" value={p.unit} onChangeText={(t) => setParam(i, 'unit', t)} placeholder="g/dL" />
                  </View>
                  <View style={{ flex: 1.4 }}>
                    <Field label="Normal range" value={p.range} onChangeText={(t) => setParam(i, 'range', t)} placeholder="11.0 - 16.0" />
                  </View>
                </View>
                <View style={styles.split}>
                  <View style={{ flex: 1 }}>
                    <Field label="Critical low" value={p.criticalLow} onChangeText={(t) => setParam(i, 'criticalLow', t)} placeholder="7.0" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Critical high" value={p.criticalHigh} onChangeText={(t) => setParam(i, 'criticalHigh', t)} placeholder="20.0" />
                  </View>
                </View>
                <View style={styles.split}>
                  <View style={{ flex: 1 }}>
                    <Field label="Male range" value={p.maleRange} onChangeText={(t) => setParam(i, 'maleRange', t)} placeholder="13.0 - 17.0" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Female range" value={p.femaleRange} onChangeText={(t) => setParam(i, 'femaleRange', t)} placeholder="11.5 - 15.5" />
                  </View>
                </View>
                <View style={styles.split}>
                  <View style={{ flex: 1 }}>
                    <Field label="Child range" value={p.childRange} onChangeText={(t) => setParam(i, 'childRange', t)} placeholder="11.0 - 14.0" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Decimal places" value={String(p.decimals ?? 1)} keyboardType="number-pad" onChangeText={(t) => setParam(i, 'decimals', Number(digitsOnly(t, 1) || 0))} />
                  </View>
                </View>
                <Field label="Print group" value={p.group} onChangeText={(t) => setParam(i, 'group', t)} placeholder="Red Blood Cell (RBC) Profile" />
                <View style={styles.toggles}>
                  <View style={styles.toggle}>
                    <Text style={styles.toggleTxt}>Bold on report</Text>
                    <Switch value={!!p.bold} onValueChange={(v) => setParam(i, 'bold', v)} trackColor={{ true: colors.primary }} />
                  </View>
                  <View style={styles.toggle}>
                    <Text style={styles.toggleTxt}>Highlight</Text>
                    <Switch value={!!p.highlight} onValueChange={(v) => setParam(i, 'highlight', v)} trackColor={{ true: colors.primary }} />
                  </View>
                </View>
              </View>
            )}
          </Card>
        );
      })}

      <View style={{ height: 20 }} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  addBtn: { width: 36, height: 36, borderRadius: radius.xs, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  section: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground, marginBottom: 10 },
  split: { flexDirection: 'row', gap: 10 },
  paramHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 },
  addParam: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.pill },
  addParamTxt: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.primary },
  pRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  pIndex: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  pIndexTxt: { fontFamily: fonts.bold, fontSize: 11, color: colors.primary },
  pName: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.foreground },
  meta: { fontFamily: fonts.regular, fontSize: 10.5, color: colors.mutedForeground, marginTop: 2 },
  pBody: { paddingHorizontal: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  toggles: { flexDirection: 'row', gap: 10 },
  toggle: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleTxt: { fontFamily: fonts.medium, fontSize: 12, color: colors.foreground },
  footer: { padding: 12, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
});
