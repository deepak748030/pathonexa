import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Search, FlaskConical, SlidersHorizontal, ChevronRight, CheckCircle2, Clock, XCircle, IndianRupee } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import StatCard from '@/components/StatCard';
import Avatar from '@/components/Avatar';
import { Card, SectionTitle, GridPanel, FadeIn, ListRow } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { reportStats, reports as localReports } from '@/lib/labData';
import { endpoints } from '@/lib/api';

export default function Reports() {
  const [search, setSearch] = React.useState('');
  const [reports, setReports] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        const data = await endpoints.reports.getAll();
        if (data) setReports(data);
      } catch (e: any) {
        console.warn('Failed to load reports from backend, showing local data');
        console.error('Failed to load reports:', e.message || e);
        setReports(localReports);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const filtered = reports.filter(r => 
    (r.patient?.name || r.patient).toLowerCase().includes(search.toLowerCase()) || 
    r.reportId.toLowerCase().includes(search.toLowerCase()) ||
    r.test.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 size={12} color={colors.green} />;
      case 'Pending': return <Clock size={12} color={colors.orange} />;
      case 'Cancelled': return <XCircle size={12} color={colors.red} />;
      default: return null;
    }
  };

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
        title="Reports" 
        subtitle="Track laboratory investigations"
        right={
          <Pressable style={styles.addBtn} onPress={() => router.push('/create-report')}>
            <FlaskConical size={18} color="#FFFFFF" />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <FadeIn>
          <GridPanel columns={2}>
            {reportStats.map(s => (
              <StatCard key={s.label} label={s.label} value={s.value} tone={s.tone} compact />
            ))}
          </GridPanel>
        </FadeIn>

        <SectionTitle title="All Reports" />
        <FadeIn delay={60}>
          <View style={styles.searchBar}>
            <View style={styles.searchInputWrap}>
              <Search size={18} color={colors.mutedForeground} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search patient, ID or test..."
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
                <Text style={styles.emptyText}>{search ? 'No reports found matching search' : 'No reports found'}</Text>
              </View>
            ) : (
              filtered.map((r, i) => (
                <ListRow key={r.id || r._id} last={i === filtered.length - 1} onPress={() => router.push('/report-preview')}>
                  <View style={styles.reportRow}>
                    <Avatar name={r.patient?.name || r.patient} color={r.color} size={36} />
                    <View style={styles.reportInfo}>
                      <Text style={styles.reportPatient}>{r.patient?.name || r.patient}</Text>
                      <Text style={styles.reportTest} numberOfLines={1}>{r.test}</Text>
                      <View style={styles.reportMeta}>
                        <Text style={styles.metaText}>{r.reportId} · {r.date}</Text>
                      </View>
                    </View>
                    <View style={styles.reportStatus}>
                      <View style={styles.statusBadge}>
                        {getStatusIcon(r.status)}
                        <Text style={[styles.statusText, { color: r.status === 'Completed' ? colors.green : r.status === 'Pending' ? colors.orange : colors.red }]}>
                          {r.status}
                        </Text>
                      </View>
                      <View style={styles.paymentRow}>
                        <IndianRupee size={10} color={r.paid ? colors.green : colors.red} />
                        <Text style={[styles.paymentText, { color: r.paid ? colors.green : colors.red }]}>
                          ₹{r.amount}
                        </Text>
                      </View>
                    </View>
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
  searchInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 44, backgroundColor: colors.card, borderRadius: radius.sm, paddingHorizontal: 12, borderWeight: 1, borderColor: colors.border },
  searchInput: { flex: 1, height: '100%', marginLeft: 8, fontFamily: fonts.medium, fontSize: 13, color: colors.foreground },
  filterBtn: { width: 44, height: 44, backgroundColor: colors.card, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', borderWeight: 1, borderColor: colors.border },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reportInfo: { flex: 1, minWidth: 0 },
  reportPatient: { fontSize: 13, fontFamily: fonts.bold, color: colors.foreground },
  reportTest: { fontSize: 11, fontFamily: fonts.semibold, color: colors.primary, marginTop: 1 },
  reportMeta: { marginTop: 2 },
  metaText: { fontSize: 10, fontFamily: fonts.regular, color: colors.mutedForeground },
  reportStatus: { alignItems: 'flex-end', gap: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 10, fontFamily: fonts.bold },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  paymentText: { fontSize: 11, fontFamily: fonts.bold },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontFamily: fonts.medium, color: colors.mutedForeground, fontSize: 14 },
});
