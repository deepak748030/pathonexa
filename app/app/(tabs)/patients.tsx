import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { UserPlus, SlidersHorizontal, ChevronRight, Phone, Calendar, Users, TrendingUp, FlaskConical, IndianRupee } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import SearchBar from '@/components/SearchBar';
import StatCard from '@/components/StatCard';
import Avatar from '@/components/Avatar';
import { Card, SectionTitle, GridPanel, FadeIn, ListRow, Chip, OfflineBanner, EmptyState } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { patientStats, patients as localPatients } from '@/lib/labData';
import { endpoints } from '@/lib/api';
import { useServerStatus } from '@/lib/serverStatus';

const statIcons: Record<string, any> = {
  'Total Patients': Users,
  'New This Week': TrendingUp,
  'Tests This Week': FlaskConical,
  'This Week Collection': IndianRupee,
};

const GENDERS = ['All', 'Male', 'Female'];

export default function Patients() {
  const check = useServerStatus((s) => s.check);
  const [search, setSearch] = React.useState('');
  const [gender, setGender] = React.useState('All');
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
      if (remoteStats?.length) {
        setStats(remoteStats);
      } else {
        setStats([
          { label: 'Total Patients', value: String(list.length), tone: 'primary' },
          { label: 'New This Week', value: '0', tone: 'green' },
          { label: 'Tests This Week', value: '0', tone: 'purple' },
          { label: 'This Week Collection', value: '₹0', tone: 'orange' },
        ]);
      }
    } catch (e: any) {
      console.warn('Failed to load patients from backend:', e?.message || e);
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

  useFocusEffect(
    React.useCallback(() => {
      check();
      loadData(true);
    }, [check, loadData])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadData(), check()]);
    setRefreshing(false);
  }, [loadData, check]);

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase().trim();
    const matchQ =
      !q ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.pid || '').toLowerCase().includes(q) ||
      (p.mobile || '').includes(q);
    const matchG = gender === 'All' || p.gender === gender;
    return matchQ && matchG;
  });

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Patients"
        subtitle="Manage your patient records"
        right={
          <Pressable style={styles.addBtn} onPress={() => router.push('/add-patient')}>
            <UserPlus size={18} color="#FFFFFF" />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <OfflineBanner />

        <FadeIn>
          <GridPanel columns={2}>
            {stats.map((s) => {
              const Icon = statIcons[s.label] || Users;
              const tone = (s.tone || 'primary') as keyof typeof colors;
              return (
                <StatCard
                  key={s.label}
                  label={s.label}
                  value={s.value}
                  tone={s.tone as any}
                  compact
                  icon={<Icon size={14} color={tone === 'primary' ? colors.primary : colors[tone]} />}
                />
              );
            })}
          </GridPanel>
        </FadeIn>

        <SectionTitle title="Patient List" />
        <FadeIn delay={60}>
          <View style={styles.searchBar}>
            <View style={styles.searchInputWrap}>
              <Search size={18} color={colors.mutedForeground} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search name, ID or mobile..."
                placeholderTextColor={colors.mutedForeground}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <Pressable style={styles.filterBtn} onPress={() => setGender('All')}>
              <SlidersHorizontal size={18} color={colors.foreground} />
            </Pressable>
          </View>

          {/* Segmented gender filter — mapped with gap 0 + hairline dividers */}
          <View style={styles.segment}>
            {GENDERS.map((g, i) => (
              <Chip
                key={g}
                label={g}
                active={gender === g}
                divider={i > 0}
                onPress={() => setGender(g)}
              />
            ))}
          </View>
        </FadeIn>

        <FadeIn delay={120}>
          <Card style={{ padding: 0 }}>
            {filtered.length === 0 ? (
              <EmptyState
                title={search ? 'No patients match your search' : 'No patients found'}
                subtitle={search ? 'Try a different name, ID or mobile number.' : 'Add your first patient with the + button above.'}
              />
            ) : (
              filtered.map((p, i) => (
                <ListRow
                  key={p.id || p._id}
                  last={i === filtered.length - 1}
                  onPress={() =>
                    router.push({ pathname: '/patient/[id]', params: { id: p._id || p.id } } as any)
                  }
                >
                  <View style={styles.patientRow}>
                    <Avatar name={p.name} color={p.color} size={40} />
                    <View style={styles.patientInfo}>
                      <Text style={styles.patientName}>{p.name}</Text>
                      <Text style={styles.patientMeta}>{p.pid} · {p.age}y · {p.gender}</Text>
                      <View style={styles.patientContact}>
                        <View style={styles.contactItem}>
                          <Phone size={10} color={colors.mutedForeground} />
                          <Text style={styles.contactText}>{p.mobile}</Text>
                        </View>
                        {!!p.lastTestDate && (
                          <View style={styles.contactItem}>
                            <Calendar size={10} color={colors.mutedForeground} />
                            <Text style={styles.contactText}>{p.lastTestDate}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <ChevronRight size={16} color={colors.mutedForeground} />
                  </View>
                </ListRow>
              ))
            )}
          </Card>
        </FadeIn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: spacing.hPad, paddingTop: 4, paddingBottom: 28 },
  addBtn: { width: 36, height: 36, borderRadius: radius.xs, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  filterBtn: { width: 38, height: 38, backgroundColor: colors.card, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  segment: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 10 },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  patientInfo: { flex: 1, minWidth: 0 },
  patientName: { fontSize: 14, fontFamily: fonts.bold, color: colors.foreground },
  patientMeta: { fontSize: 11, fontFamily: fonts.medium, color: colors.mutedForeground, marginTop: 1 },
  patientContact: { flexDirection: 'row', gap: 12, marginTop: 4 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  contactText: { fontSize: 10, fontFamily: fonts.regular, color: colors.mutedForeground },
});
