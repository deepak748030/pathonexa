import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Search, UserPlus, SlidersHorizontal, ChevronRight, Phone, Calendar, Users, TrendingUp, FlaskConical, IndianRupee } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import StatCard from '@/components/StatCard';
import Avatar from '@/components/Avatar';
import { Card, SectionTitle, GridPanel, FadeIn, ListRow } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { patientStats, patients as localPatients } from '@/lib/labData';
import { endpoints } from '@/lib/api';

const statIcons: Record<string, any> = {
  'Total Patients': Users,
  'New This Week': TrendingUp,
  'Tests This Week': FlaskConical,
  'This Week Collection': IndianRupee,
};

export default function Patients() {
  const [search, setSearch] = React.useState('');
  const [patients, setPatients] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [data, remoteStats] = await Promise.all([
          endpoints.patients.getAll(),
          endpoints.patients.getStats(),
        ]);
        if (data) setPatients(data);
        if (remoteStats) setStats(remoteStats);
      } catch (e: any) {
        console.warn('Failed to load patients from backend, showing local data');
        console.error('Failed to load patients:', e.message || e);
        setPatients(localPatients);
        setStats(patientStats);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.pid && p.pid.toLowerCase().includes(search.toLowerCase())) ||
    (p.mobile && p.mobile.includes(search))
  );

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

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <FadeIn>
          <GridPanel columns={2}>
              {(stats.length > 0 ? stats : patientStats).map(s => {
                const Icon = statIcons[s.label] || Users;
                return (
                  <StatCard 
                    key={s.label} 
                    label={s.label} 
                    value={s.value} 
                    tone={s.tone} 
                    compact 
                    icon={<Icon size={14} color={colors[s.tone === 'primary' ? 'primary' : s.tone as keyof typeof colors] || colors.primary} />}
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
            <Pressable style={styles.filterBtn}>
              <SlidersHorizontal size={18} color={colors.foreground} />
            </Pressable>
          </View>
        </FadeIn>

        <FadeIn delay={120}>
          <Card style={{ padding: 0 }}>
            {filtered.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>{search ? 'No patients found matching search' : 'No patients found'}</Text>
              </View>
            ) : (
              filtered.map((p, i) => (
                <ListRow key={p.id || p._id} last={i === filtered.length - 1} onPress={() => {}}>
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
                        {p.lastTestDate && (
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
  searchBar: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  searchInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 44, backgroundColor: colors.card, borderRadius: radius.sm, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, height: '100%', marginLeft: 8, fontFamily: fonts.medium, fontSize: 13, color: colors.foreground },
  filterBtn: { width: 44, height: 44, backgroundColor: colors.card, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 14, fontFamily: fonts.bold, color: colors.foreground },
  patientMeta: { fontSize: 11, fontFamily: fonts.medium, color: colors.mutedForeground, marginTop: 1 },
  patientContact: { flexDirection: 'row', gap: 12, marginTop: 4 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  contactText: { fontSize: 10, fontFamily: fonts.regular, color: colors.mutedForeground },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontFamily: fonts.medium, color: colors.mutedForeground, fontSize: 14 },
});