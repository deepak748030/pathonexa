import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
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
import { Card, FadeIn, OfflineBanner, EmptyState } from '@/components/UI';
import { colors, fonts, radius, shadow, toneMap } from '@/lib/theme';
import { endpoints } from '@/lib/api';
import { useServerStatus } from '@/lib/serverStatus';
import { displayMobile, inr, testTone } from '@/lib/format';

const STAT_ICONS = [
  { Icon: Users, tone: 'primary' as const },
  { Icon: UserPlus, tone: 'green' as const },
  { Icon: ClipboardList, tone: 'purple' as const },
  { Icon: IndianRupee, tone: 'orange' as const },
];

const FOOT = [
  { label: 'Import Patients', Icon: Download, href: '/manage/backup' },
  { label: 'Export Patients', Icon: Upload, href: '/manage/backup' },
  { label: 'Patient Groups', Icon: Layers, href: '/manage/discounts' },
  { label: 'Duplicates', Icon: Copy, href: '/manage/deleted' },
];

export default function Patients() {
  const check = useServerStatus((s) => s.check);
  const [search, setSearch] = React.useState('');
  const [showSearch, setShowSearch] = React.useState(true);
  const [patients, setPatients] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

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
                <Pressable key={f.label} style={styles.footBtn} onPress={() => router.push(f.href as any)}>
                  <f.Icon size={16} color={colors.primary} strokeWidth={2.1} />
                  <Text style={styles.footTxt}>{f.label}</Text>
                </Pressable>
              ))}
            </View>
          </FadeIn>
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  pillTxt: { color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 12 },
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
