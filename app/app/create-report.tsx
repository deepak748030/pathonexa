import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, Modal, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft, Search, User, FlaskConical, Stethoscope, CreditCard, ChevronDown, X,
} from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import Avatar from '@/components/Avatar';
import Field from '@/components/Field';
import { Card, FadeIn, ListRow, EmptyState } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { tests as localTests, doctors as localDoctors, patients as localPatients } from '@/lib/labData';
import { endpoints } from '@/lib/api';

type SheetKind = 'patient' | 'test' | 'doctor' | null;

export default function CreateReport() {
  const params = useLocalSearchParams<{ patientId?: string }>();
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    patientId: '', testId: '', doctorId: '', amount: '', paid: false,
  });

  const [patients, setPatients] = React.useState<any[]>([]);
  const [tests, setTests] = React.useState<any[]>(localTests);
  const [doctors, setDoctors] = React.useState<any[]>(localDoctors);
  const [selectedPatient, setSelectedPatient] = React.useState<any>(null);
  const [sheet, setSheet] = React.useState<SheetKind>(null);
  const [query, setQuery] = React.useState('');

  // Load patients, tests & doctors from the server (sample data as fallback).
  React.useEffect(() => {
    async function fetchData() {
      try {
        const [p, t, d] = await Promise.all([
          endpoints.patients.getAll(),
          endpoints.meta.tests(),
          endpoints.meta.doctors(),
        ]);
        setPatients(Array.isArray(p) ? p : []);
        if (t?.length) setTests(t);
        if (d?.length) setDoctors(d);
      } catch (e: any) {
        console.warn('Could not load catalogues:', e?.message || e);
        setPatients([]);
      }
    }
    fetchData();
  }, []);

  // Pre-select the patient when opened from the Patients screen.
  React.useEffect(() => {
    if (!params.patientId || !patients.length) return;
    const p = patients.find((x) => (x._id || x.id) === params.patientId);
    if (p) {
      setSelectedPatient(p);
      setForm((f) => ({ ...f, patientId: p._id || p.id }));
    }
  }, [params.patientId, patients]);

  const handleSubmit = async () => {
    if (!form.patientId || !form.testId) {
      alert('Please select a patient and a test');
      return;
    }
    setLoading(true);
    try {
      const reportId = 'RP' + Date.now().toString().slice(-8);
      const test = tests.find((t) => (t._id || t.id) === form.testId) || localTests.find((t) => t.id === form.testId);
      const doctor = doctors.find((d) => (d._id || d.id) === form.doctorId) || localDoctors.find((d) => d.id === form.doctorId);

      const created = await endpoints.reports.create({
        reportId,
        patient: form.patientId,
        test: test?.name || 'Unknown Test',
        doctor: doctor?.name || 'Direct',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        amount: parseInt(form.amount) || test?.price || 0,
        paid: form.paid,
        status: 'Pending',
        color: selectedPatient?.color || '#DBEAFE',
      });

      router.replace({ pathname: '/report-preview', params: { id: created?._id || created?.id } } as any);
    } catch (e: any) {
      console.error('Create report error:', e);
      alert(e?.message || 'Failed to save report. Check the server connection.');
    } finally {
      setLoading(false);
    }
  };

  const SelectBox = ({ label, icon: Icon, placeholder, value, onPress }: any) => (
    <Field
      label={label}
      value={value || ''}
      placeholder={placeholder}
      icon={<Icon size={16} color={colors.primary} />}
      onPress={onPress}
      right={<ChevronDown size={16} color={colors.mutedForeground} />}
    />
  );

  const openSheet = (kind: SheetKind) => {
    setQuery('');
    setSheet(kind);
  };

  const sheetData: Record<Exclude<SheetKind, null>, { title: string; placeholder: string; rows: any[]; key: (x: any) => string; label: (x: any) => string; sub: (x: any) => string }> = {
    patient: {
      title: 'Select Patient', placeholder: 'Search patient name or mobile...', rows: patients,
      key: (p: any) => p._id || p.id, label: (p: any) => p.name, sub: (p: any) => `${p.pid || ''} · ${p.mobile}`,
    },
    test: {
      title: 'Select Test', placeholder: 'Search test name...', rows: tests,
      key: (t: any) => t._id || t.id, label: (t: any) => t.name, sub: (t: any) => `${t.group || ''} · ₹${t.price}`,
    },
    doctor: {
      title: 'Select Doctor', placeholder: 'Search doctor name...', rows: doctors,
      key: (d: any) => d._id || d.id, label: (d: any) => d.name, sub: (d: any) => d.degree || '',
    },
  };

  const current = sheet ? sheetData[sheet] : null;

  const pick = (item: any) => {
    if (sheet === 'patient') {
      setSelectedPatient(item);
      setForm((f) => ({ ...f, patientId: item._id || item.id }));
    } else if (sheet === 'test') {
      setForm((f) => ({ ...f, testId: item._id || item.id, amount: String(item.price || f.amount) }));
    } else if (sheet === 'doctor') {
      setForm((f) => ({ ...f, doctorId: item._id || item.id }));
    }
    setSheet(null);
  };

  const filteredRows = current
    ? current.rows.filter((r) => {
        const q = query.toLowerCase().trim();
        if (!q) return true;
        return [current.label(r), current.sub(r)].join(' ').toLowerCase().includes(q);
      })
    : [];

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Create Report"
        left={<ChevronLeft size={24} color="#FFFFFF" />}
        onLeftPress={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <FadeIn>
          <Card style={styles.formCard}>
            <SelectBox
              label="Select Patient"
              icon={User}
              placeholder="Search or select patient"
              value={selectedPatient?.name}
              onPress={() => openSheet('patient')}
            />

            <SelectBox
              label="Investigation / Test"
              icon={FlaskConical}
              placeholder="Select test name"
              value={tests.find((t) => (t._id || t.id) === form.testId)?.name || localTests.find((t) => t.id === form.testId)?.name}
              onPress={() => openSheet('test')}
            />

            <SelectBox
              label="Referring Doctor"
              icon={Stethoscope}
              placeholder="Select doctor or 'Direct'"
              value={doctors.find((d) => (d._id || d.id) === form.doctorId)?.name || localDoctors.find((d) => d.id === form.doctorId)?.name}
              onPress={() => openSheet('doctor')}
            />

            <Field
              label="Test Amount (₹)"
              value={form.amount}
              onChangeText={(t) => setForm((f) => ({ ...f, amount: t }))}
              placeholder="Enter amount"
              icon={<CreditCard size={16} color={colors.primary} />}
              keyboardType="number-pad"
            />

            <View style={styles.paymentToggle}>
              <Text style={styles.label}>Mark as Paid</Text>
              <Pressable
                style={[styles.toggle, form.paid && styles.toggleActive]}
                onPress={() => setForm((f) => ({ ...f, paid: !f.paid }))}
              >
                <View style={[styles.toggleDot, form.paid && styles.toggleDotActive]} />
              </Pressable>
            </View>

            <Pressable
              style={[styles.submitBtn, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Generate Report ID</Text>
              )}
            </Pressable>
          </Card>
        </FadeIn>
      </ScrollView>

      {/* Bottom-sheet picker */}
      <Modal visible={!!sheet} transparent animationType="fade" onRequestClose={() => setSheet(null)}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSheet(null)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{current?.title}</Text>
              <Pressable onPress={() => setSheet(null)} hitSlop={10} style={styles.sheetClose}>
                <X size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <View style={styles.sheetSearch}>
              <Search size={16} color={colors.mutedForeground} />
              <TextInput
                style={styles.sheetInput}
                placeholder={current?.placeholder}
                placeholderTextColor={colors.mutedForeground}
                value={query}
                onChangeText={setQuery}
                autoFocus
              />
            </View>
            <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {filteredRows.length === 0 ? (
                <EmptyState title="Nothing found" subtitle="Try a different search." />
              ) : (
                filteredRows.map((item, i) => (
                  <ListRow key={current!.key(item)} last={i === filteredRows.length - 1} onPress={() => pick(item)}>
                    <View style={styles.sheetRow}>
                      {sheet === 'patient' ? (
                        <Avatar name={item.name} color={item.color} size={34} />
                      ) : (
                        <View style={styles.sheetIcon}>
                          {sheet === 'test' ? (
                            <FlaskConical size={15} color={colors.primary} />
                          ) : (
                            <Stethoscope size={15} color={colors.primary} />
                          )}
                        </View>
                      )}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.sheetRowTitle} numberOfLines={1}>{current!.label(item)}</Text>
                        <Text style={styles.sheetRowSub} numberOfLines={1}>{current!.sub(item)}</Text>
                      </View>
                    </View>
                  </ListRow>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: spacing.hPad, paddingTop: 4, paddingBottom: 40 },
  formCard: { padding: 16 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 12, fontFamily: fonts.semibold, color: colors.mutedForeground, marginBottom: 6, letterSpacing: 0.2 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', minHeight: 40, backgroundColor: colors.inputBg, borderRadius: radius.md, paddingHorizontal: 8, borderWidth: 1.5, borderColor: colors.inputBorder },
  inputWrapFilled: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  leadIcon: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  inputText: { flex: 1, marginLeft: 10, fontFamily: fonts.medium, fontSize: 14, color: colors.foreground },
  input: { flex: 1, height: 38, marginLeft: 10, fontFamily: fonts.medium, fontSize: 13, color: colors.foreground, outlineStyle: 'none' as any },
  paymentToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingRight: 4 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: colors.border, padding: 2 },
  toggleActive: { backgroundColor: colors.green },
  toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' },
  toggleDotActive: { marginLeft: 20 },
  submitBtn: { height: 44, backgroundColor: colors.primary, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  btnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: fonts.bold },
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: Platform.OS === 'web' ? '70%' : '80%',
    minHeight: 320,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  sheetTitle: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 15 },
  sheetClose: { width: 30, height: 30, borderRadius: radius.xs, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  sheetSearch: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, height: 42, backgroundColor: colors.card, borderRadius: radius.sm, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border },
  sheetInput: { flex: 1, marginLeft: 8, fontFamily: fonts.medium, fontSize: 13, color: colors.foreground },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetIcon: { width: 34, height: 34, borderRadius: radius.xs, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  sheetRowTitle: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 13 },
  sheetRowSub: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10.5, marginTop: 1 },
});
