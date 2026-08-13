import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ChevronLeft, Phone, FlaskConical } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import Avatar from '@/components/Avatar';
import { Card, FadeIn, ListRow, EmptyState, OfflineBanner } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { endpoints } from '@/lib/api';

export default function PatientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [patient, setPatient] = React.useState<any>(null);
  const [reports, setReports] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!id) return;
    try {
      const [p, all] = await Promise.all([endpoints.patients.getById(id), endpoints.reports.getAll()]);
      setPatient(p);
      const list = Array.isArray(all) ? all : [];
      setReports(list.filter((r) => {
        const pid = r.patient?._id || r.patient?.id || r.patient;
        return String(pid) === String(id) || r.patient?.pid === p?.pid;
      }));
    } catch (e: any) {
      console.warn(e?.message || e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Patient" left={<ChevronLeft size={24} color="#fff" />} onLeftPress={() => router.back()} />
        <EmptyState title="Patient not found" subtitle="This record may have been removed." />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={patient.name}
        subtitle={patient.pid}
        left={<ChevronLeft size={24} color="#fff" />}
        onLeftPress={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.primary} />}
      >
        <OfflineBanner />
        <FadeIn>
          <Card style={styles.hero}>
            <Avatar name={patient.name} color={patient.color} size={56} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{patient.name}</Text>
              <Text style={styles.meta}>{patient.age}y · {patient.gender}{patient.blood ? ` · ${patient.blood}` : ''}</Text>
              <View style={styles.phoneRow}>
                <Phone size={12} color={colors.mutedForeground} />
                <Text style={styles.meta}>{patient.mobile}</Text>
              </View>
            </View>
          </Card>
        </FadeIn>

        <Pressable
          style={styles.cta}
          onPress={() => router.push({ pathname: '/create-report', params: { patientId: patient._id || patient.id } } as any)}
        >
          <FlaskConical size={16} color="#fff" />
          <Text style={styles.ctaText}>Create report for this patient</Text>
        </Pressable>

        <Text style={styles.section}>Reports ({reports.length})</Text>
        <Card style={{ padding: 0 }}>
          {reports.length === 0 ? (
            <EmptyState title="No reports yet" subtitle="Create the first investigation." />
          ) : (
            reports.map((r, i) => (
              <ListRow
                key={r._id || r.id}
                last={i === reports.length - 1}
                onPress={() => router.push({ pathname: '/report-preview', params: { id: r._id || r.id } } as any)}
              >
                <View>
                  <Text style={styles.rowTitle}>{r.test}</Text>
                  <Text style={styles.rowSub}>{r.reportId} · {r.date} · ₹{r.amount} · {r.status}</Text>
                </View>
              </ListRow>
            ))
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: spacing.hPad, paddingTop: 10, paddingBottom: 32 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.foreground },
  meta: { fontFamily: fonts.medium, fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  cta: { marginTop: 12, height: 48, backgroundColor: colors.primary, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { color: '#fff', fontFamily: fonts.bold, fontSize: 14 },
  section: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground, marginTop: 18, marginBottom: 8 },
  rowTitle: { fontFamily: fonts.semibold, fontSize: 13, color: colors.foreground },
  rowSub: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
});
