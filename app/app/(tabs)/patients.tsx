import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, TextInput } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Menu, Search, SlidersHorizontal, Plus, Phone, ChevronRight, Users, UserPlus,
  ClipboardList, IndianRupee, ScanLine, Download, Upload, Layers, Copy,
  Barcode,
} from 'lucide-react-native';
import ScreenHeader, { HeaderIcon, HeaderPill } from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import SearchBar from '@/components/SearchBar';
import Avatar from '@/components/Avatar';
import { Card, FadeIn, OfflineBanner, EmptyState, Badge } from '@/components/UI';
import PrimaryButton from '@/components/PrimaryButton';
import { colors, fonts, radius, shadow, toneMap } from '@/lib/theme';
import { endpoints } from '@/lib/api';
import { useServerStatus } from '@/lib/serverStatus';
import { displayMobile, testTone } from '@/lib/format';
import { toCsv, fromCsv, shareFile } from '@/lib/share';

const STAT_ICONS = [
  { Icon: Users, tone: 'primary' as const },
  { Icon: UserPlus, tone: 'green' as const },
  { Icon: ClipboardList, tone: 'purple' as const },
  { Icon: IndianRupee, tone: 'orange' as const },
];

const FOOT = [
  { label: 'Import Patients', Icon: Download, action: 'import' as const },
  { label: 'Export Patients', Icon: Upload, action: 'export' as const },
  { label: 'Patient Groups', Icon: Layers, action: 'groups' as const },
  { label: 'Duplicates', Icon: Copy, action: 'duplicates' as const },
];

const CSV_TEMPLATE = 'name,mobile,age,gender,blood,city,address\nRamesh Kumar,9876543210,32,Male,B+,Lucknow,12 Vikas Nagar';

export default function Patients() {
  const check = useServerStatus((s) => s.check);
  const [search, setSearch] = React.useState('');
  const [showSearch, setShowSearch] = React.useState(true);
  const [patients, setPatients] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [tool, setTool] = React.useState<null | 'import' | 'groups' | 'duplicates'>(null);
  const [csv, setCsv] = React.useState('');
  const [dupes, setDupes] = React.useState<any[]>([]);
  const [busy, setBusy] = React.useState(false);

  const loadData = React.useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    try {
      const [data, remoteStats] = await Promise.all([
        endpoints.patients.getAll(),
        endpoints.patients.getStats(),
      ]);
      const list = Array.isArray(data) ? data : [];
      setPatients(list);
      setStats(Array.isArray(remoteStats) && remoteStats.length ? remoteStats : [
        { label: 'Total Patients', value: String(list.length), tone: 'primary' },
        { label: 'New This Week', value: '0', tone: 'green' },
        { label: 'Tests This Week', value: '0', tone: 'purple' },
        { label: 'This Week Collection', value: '₹0', tone: 'orange' },
      ]);
    } catch (e: any) {
      console.warn('Failed to load patients:', e?.message || e);
      setPatients([]);
      setStats([
        { label: 'Total Patients', value: '0', tone: 'primary' },
        { label: 'New This Week', value: '0', tone: 'green' },
        { label: 'Tests This Week', value: '0', tone: 'purple' },
        { label: 'This Week Collection', value: '₹0', tone: 'orange' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(React.useCallback(() => { check(); loadData(true); }, [check, loadData]));

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadData(), check()]);
    setRefreshing(false);
  }, [loadData, check]);

  /* Patients toolbar: import (CSV) · export (CSV) · groups · duplicate finder */
  const exportPatients = async () => {
    const rows = patients.map((p) => ({
      pid: p.pid, name: p.name, age: p.age, gender: p.gender, blood: p.blood,
      mobile: p.mobile, altMobile: p.altMobile, email: p.email, address: p.address,
      city: p.city, state: p.state, pincode: p.pincode, group: p.group,
      lastTest: p.lastTest, lastTestDate: p.lastTestDate,
    }));
    if (!rows.length) return Alert.alert('Nothing to export', 'Add patients first.');
    const ok = await shareFile(`pathonexa-patients-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows), 'text/csv');
    if (!ok) Alert.alert('Export failed', 'Could not share the CSV on this device.');
  };

  const importPatients = async () => {
    const rows = fromCsv(csv);
    if (!rows.length) return Alert.alert('Nothing to import', 'Paste CSV rows with a header line first.');
    setBusy(true);
    try {
      const res = await endpoints.patients.importMany(rows.map((r) => ({
        name: r.name, mobile: r.mobile, age: Number(r.age || 0), gender: r.gender || 'Male',
        blood: r.blood, city: r.city, address: r.address, state: r.state, pincode: r.pincode,
        email: r.email, group: r.group,
      })));
      setCsv('');
      setTool(null);
      await loadData();
      Alert.alert('Import finished', `${res.created} added · ${res.skipped} skipped`);
    } catch (e: any) {
      Alert.alert('Import failed', e?.message || 'Server error');
    } finally {
      setBusy(false);
    }
  };

  const openTool = async (action: string) => {
    if (action === 'export') return exportPatients();
    if (action === 'duplicates') {
      setBusy(true);
      try {
        const list = await endpoints.patients.duplicates();
        setDupes(Array.isArray(list) ? list : []);
      } catch { setDupes([]); } finally { setBusy(false); }
    }
    setTool((t) => (t === action ? null : (action as any)));
  };

  const groups = React.useMemo(() => {
    const map = new Map<string, any[]>();
    patients.forEach((p) => {
      const key = p.group || p.city || 'Ungrouped';
      map.set(key, [...(map.get(key) || []), p]);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [patients]);

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.pid || '').toLowerCase().includes(q) ||
      (p.mobile || '').includes(q)
    );
  });

  return (
    <AppScreen
      refreshing={refreshing}
      onRefresh={onRefresh}
      keyboard
      header={
        <ScreenHeader
          title="Patients"
          subtitle="Manage all patient records"
          left={<Menu size={22} color="#FFFFFF" strokeWidth={2.4} />}
          onLeftPress={() => router.push('/menu' as any)}
          right={
            <>
              <HeaderIcon onPress={() => setShowSearch((v) => !v)}>
                <Search size={18} color="#FFFFFF" />
              </HeaderIcon>
              <HeaderIcon onPress={() => setSearch('')}>
                <SlidersHorizontal size={18} color="#FFFFFF" />
              </HeaderIcon>
              <HeaderPill onPress={() => router.push('/add-patient')}>
                <Plus size={14} color="#FFFFFF" strokeWidth={2.6} />
                <Text style={styles.pillTxt}>Add Patient</Text>
              </HeaderPill>
            </>
          }
        />
      }
    >
      <OfflineBanner />

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          <FadeIn>
            <View style={styles.statRow}>
              {stats.map((s, i) => {
                const meta = STAT_ICONS[i] || STAT_ICONS[0];
                const t = toneMap[s.tone as keyof typeof toneMap] || toneMap.primary;
                return (
                  <View key={s.label} style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: t.bg }]}>
                      <meta.Icon size={16} color={t.fg} strokeWidth={2.2} />
                    </View>
                    <Text style={styles.statValue} numberOfLines={1}>
                      {s.label.includes('Collection') ? s.value : s.value}
                    </Text>
                    <Text style={styles.statLabel} numberOfLines={2}>{s.label}</Text>
                  </View>
                );
              })}
            </View>
          </FadeIn>

          {showSearch && (
            <FadeIn delay={40}>
              <View style={styles.searchRow}>
                <SearchBar value={search} onChangeText={setSearch} placeholder="Search by Name, Mobile, Patient ID..." />
                <Pressable style={styles.scanBtn}>
                  <ScanLine size={18} color={colors.foreground} />
                </Pressable>
              </View>
            </FadeIn>
          )}

          <FadeIn delay={80}>
            <Card style={{ padding: 0, marginTop: 12 }}>
              {filtered.length === 0 ? (
                <EmptyState
                  title={search ? 'No patients match your search' : 'No patients found'}
                  subtitle={search ? 'Try a different name, ID or 10-digit mobile.' : 'Add your first patient with + Add Patient.'}
                />
              ) : filtered.map((p, i) => {
                const tone = testTone(p.lastTest);
                return (
                  <Pressable
                    key={p.id || p._id}
                    style={[styles.row, i === filtered.length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => router.push({ pathname: '/patient/[id]', params: { id: p._id || p.id } } as any)}
                  >
                    <Avatar name={p.name} color={p.color} size={44} />
                    <View style={styles.info}>
                      <Text style={styles.name}>{p.name}</Text>
                      <View style={styles.pidRow}>
                        <Text style={styles.pid}>PID: {p.pid}</Text>
                        <Barcode size={12} color={colors.mutedForeground} />
                      </View>
                      <Text style={styles.meta}>
                        {p.age} Yrs  ·  {p.gender}{p.blood ? `  ·  ${p.blood}` : ''}
                      </Text>
                    </View>
                    <View style={styles.right}>
                      <View style={styles.phoneRow}>
                        <Phone size={11} color={colors.mutedForeground} />
                        <Text style={styles.phone}>{displayMobile(p.mobile).replace('+91 ', '')}</Text>
                      </View>
                      {!!p.lastTestDate && <Text style={styles.last}>Last Test: {p.lastTestDate}</Text>}
                      {!!p.lastTest && (
                        <Text style={[styles.test, { color: toneMap[tone].fg }]} numberOfLines={1}>{p.lastTest}</Text>
                      )}
                    </View>
                    <ChevronRight size={16} color={colors.mutedForeground} />
                  </Pressable>
                );
              })}
            </Card>
          </FadeIn>

          <FadeIn delay={120}>
            <View style={styles.foot}>
              {FOOT.map((f) => (
                <Pressable key={f.label} style={styles.footBtn} onPress={() => openTool(f.action)}>
                  <f.Icon size={16} color={colors.primary} strokeWidth={2.1} />
                  <Text style={styles.footTxt}>{f.label}</Text>
                </Pressable>
              ))}
            </View>
          </FadeIn>

          {tool === 'import' && (
            <FadeIn>
              <Card style={{ marginTop: 12 }}>
                <Text style={styles.toolTitle}>Import patients (CSV)</Text>
                <Text style={styles.toolSub}>
                  Paste rows with a header line. Columns: name, mobile, age, gender, blood, city, address.
                </Text>
                <TextInput
                  style={styles.csv}
                  value={csv}
                  onChangeText={setCsv}
                  multiline
                  placeholder={CSV_TEMPLATE}
                  placeholderTextColor={colors.placeholder}
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton title="Use sample" ghost onPress={() => setCsv(CSV_TEMPLATE)} />
                  </View>
                  <View style={{ flex: 1.3 }}>
                    <PrimaryButton title="Import" onPress={importPatients} loading={busy} />
                  </View>
                </View>
              </Card>
            </FadeIn>
          )}

          {tool === 'groups' && (
            <FadeIn>
              <Card style={{ marginTop: 12 }}>
                <Text style={styles.toolTitle}>Patient groups</Text>
                {groups.map(([name, list]) => (
                  <Pressable key={name} style={styles.groupRow} onPress={() => { setSearch(name === 'Ungrouped' ? '' : name); setTool(null); }}>
                    <Layers size={14} color={colors.primary} />
                    <Text style={styles.groupName}>{name}</Text>
                    <Badge text={`${list.length}`} tone="primary" />
                  </Pressable>
                ))}
              </Card>
            </FadeIn>
          )}

          {tool === 'duplicates' && (
            <FadeIn>
              <Card style={{ marginTop: 12 }}>
                <Text style={styles.toolTitle}>Possible duplicates</Text>
                {busy ? <ActivityIndicator color={colors.primary} /> : dupes.length === 0 ? (
                  <Text style={styles.toolSub}>No duplicate mobile numbers or names found. 🎉</Text>
                ) : dupes.map((d) => (
                  <View key={d.key} style={styles.dupBlock}>
                    <Text style={styles.groupName}>{d.key} · {d.count} records</Text>
                    {d.patients.map((p: any) => (
                      <Pressable
                        key={p._id}
                        style={styles.groupRow}
                        onPress={() => router.push({ pathname: '/patient/[id]', params: { id: p._id } } as any)}
                      >
                        <Copy size={13} color={colors.orange} />
                        <Text style={styles.groupName}>{p.name} · {p.pid}</Text>
                        <ChevronRight size={14} color={colors.mutedForeground} />
                      </Pressable>
                    ))}
                  </View>
                ))}
              </Card>
            </FadeIn>
          )}
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  pillTxt: { color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 12 },
  toolTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground, marginBottom: 6 },
  toolSub: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.mutedForeground, lineHeight: 17, marginBottom: 10 },
  csv: {
    minHeight: 92, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm,
    padding: 10, fontFamily: fonts.regular, fontSize: 11, color: colors.foreground,
    textAlignVertical: 'top', marginBottom: 10,
  },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.border },
  groupName: { flex: 1, fontFamily: fonts.semibold, fontSize: 12.5, color: colors.foreground },
  dupBlock: { marginTop: 8 },
  statRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md,
    alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, ...shadow,
  },
  statIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.foreground },
  statLabel: { fontFamily: fonts.medium, fontSize: 9.5, color: colors.mutedForeground, textAlign: 'center', marginTop: 2, lineHeight: 12 },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  scanBtn: {
    width: 46, height: 46, borderRadius: radius.sm, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground },
  pidRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  pid: { fontFamily: fonts.medium, fontSize: 11, color: colors.mutedForeground },
  meta: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  right: { alignItems: 'flex-end', maxWidth: 130 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  phone: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.foreground },
  last: { fontFamily: fonts.regular, fontSize: 10, color: colors.mutedForeground, marginTop: 3 },
  test: { fontFamily: fonts.semibold, fontSize: 11, marginTop: 2 },
  foot: {
    flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.md,
    marginTop: 14, overflow: 'hidden', ...shadow,
  },
  footBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12, gap: 4,
    borderRightWidth: 1, borderRightColor: colors.border,
  },
  footTxt: { fontFamily: fonts.semibold, fontSize: 9.5, color: colors.foreground, textAlign: 'center' },
});
