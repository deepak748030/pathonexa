import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Search, Plus, Check, User, Stethoscope, FlaskConical } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import Avatar from '@/components/Avatar';
import { Card } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { patients, doctors, tests, cbcParams } from '@/lib/labData';

const steps = ['Select Details', 'Enter Report Values', 'Preview & Save'];

export default function CreateReport() {
  const [step, setStep] = useState(0);
  const [patient, setPatient] = useState(patients[0].id);
  const [doctor, setDoctor] = useState(doctors[0].id);
  const [selected, setSelected] = useState<string[]>([tests[0].id]);
  const [values, setValues] = useState<Record<string, string>>({});

  const total = tests.filter((t) => selected.includes(t.id)).reduce((s, t) => s + t.price, 0);
  const toggle = (id: string) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Create Report"
        subtitle={`Step ${step + 1} of 3: ${steps[step]}`}
        left={<ChevronLeft size={24} color="#FFFFFF" />}
        onLeftPress={() => (step === 0 ? router.back() : setStep(step - 1))}
      />

      <View style={styles.stepper}>
        {steps.map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepDot, i <= step && { backgroundColor: colors.primary }]}>
              {i < step ? <Check size={11} color="#FFFFFF" strokeWidth={3} /> : <Text style={[styles.stepNum, i <= step && { color: '#FFFFFF' }]}>{i + 1}</Text>}
            </View>
            <Text style={[styles.stepLabel, i === step && { color: colors.primary, fontFamily: fonts.semibold }]} numberOfLines={1}>{s}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {step === 0 ? (
          <>
            <Card>
              <View style={styles.secRow}>
                <User size={14} color={colors.primary} />
                <Text style={styles.section}>Select Patient</Text>
                <Pressable style={styles.newBtn} onPress={() => router.push('/add-patient' as any)}>
                  <Plus size={12} color={colors.primary} strokeWidth={3} />
                  <Text style={styles.newText}>New</Text>
                </Pressable>
              </View>
              <View style={styles.searchBox}>
                <Search size={15} color={colors.mutedForeground} />
                <TextInput placeholder="Search patient by name, ID or mobile" placeholderTextColor={colors.mutedForeground} style={styles.searchInput} />
              </View>
              {patients.slice(0, 3).map((p) => (
                <Pressable key={p.id} style={[styles.pick, patient === p.id && styles.pickActive]} onPress={() => setPatient(p.id)}>
                  <Avatar name={p.name} color={p.color} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickTitle}>{p.name}</Text>
                    <Text style={styles.pickMeta}>PID: {p.pid}  |  {p.age} Yrs  |  {p.gender}  |  {p.mobile}</Text>
                  </View>
                  {patient === p.id ? <Check size={16} color={colors.primary} strokeWidth={3} /> : null}
                </Pressable>
              ))}
            </Card>

            <Card style={{ marginTop: 10 }}>
              <View style={styles.secRow}>
                <Stethoscope size={14} color={colors.primary} />
                <Text style={styles.section}>Referring Doctor</Text>
              </View>
              {doctors.map((d) => (
                <Pressable key={d.id} style={[styles.pick, doctor === d.id && styles.pickActive]} onPress={() => setDoctor(d.id)}>
                  <Avatar name={d.name} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickTitle}>{d.name}</Text>
                    <Text style={styles.pickMeta}>{d.speciality}</Text>
                  </View>
                  {doctor === d.id ? <Check size={16} color={colors.primary} strokeWidth={3} /> : null}
                </Pressable>
              ))}
            </Card>

            <Card style={{ marginTop: 10 }}>
              <View style={styles.secRow}>
                <FlaskConical size={14} color={colors.primary} />
                <Text style={styles.section}>Select Tests / Packages</Text>
              </View>
              {tests.map((t) => (
                <Pressable key={t.id} style={[styles.pick, selected.includes(t.id) && styles.pickActive]} onPress={() => toggle(t.id)}>
                  <View style={[styles.check, selected.includes(t.id) && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    {selected.includes(t.id) ? <Check size={11} color="#FFFFFF" strokeWidth={3} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickTitle}>{t.name}</Text>
                    <Text style={styles.pickMeta}>{t.code}  |  {t.sample}</Text>
                  </View>
                  <Text style={styles.price}>₹{t.price}</Text>
                </Pressable>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount ({selected.length} tests)</Text>
                <Text style={styles.totalValue}>₹{total}</Text>
              </View>
            </Card>
          </>
        ) : step === 1 ? (
          <Card style={{ padding: 0 }}>
            <View style={styles.tableHead}>
              <Text style={[styles.th, { flex: 2 }]}>Parameter</Text>
              <Text style={[styles.th, { flex: 1 }]}>Result</Text>
              <Text style={[styles.th, { flex: 1 }]}>Unit</Text>
              <Text style={[styles.th, { flex: 1.4 }]}>Reference</Text>
            </View>
            {cbcParams.map((p) => (
              <View key={p.name} style={styles.tr}>
                <Text style={[styles.td, { flex: 2 }]}>{p.name}</Text>
                <TextInput
                  value={values[p.name] ?? ''}
                  onChangeText={(v) => setValues((s) => ({ ...s, [p.name]: v }))}
                  placeholder="—"
                  keyboardType="numeric"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.cellInput, { flex: 1 }]}
                />
                <Text style={[styles.td, { flex: 1 }]}>{p.unit}</Text>
                <Text style={[styles.td, { flex: 1.4 }]}>{p.range}</Text>
              </View>
            ))}
          </Card>
        ) : (
          <Card>
            <Text style={styles.section}>Report Summary</Text>
            <SummaryRow label="Patient" value={patients.find((p) => p.id === patient)?.name ?? ''} />
            <SummaryRow label="Referring Doctor" value={doctors.find((d) => d.id === doctor)?.name ?? ''} />
            <SummaryRow label="Tests" value={tests.filter((t) => selected.includes(t.id)).map((t) => t.name).join(', ')} />
            <SummaryRow label="Total Amount" value={`₹${total}`} />
            <Pressable style={styles.previewBtn} onPress={() => router.push('/report-preview' as any)}>
              <Text style={styles.previewText}>Preview Report</Text>
            </Pressable>
          </Card>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.cancel} onPress={() => (step === 0 ? router.back() : setStep(step - 1))}>
          <Text style={styles.cancelText}>{step === 0 ? 'Cancel' : 'Back'}</Text>
        </Pressable>
        <Pressable style={styles.next} onPress={() => (step === 2 ? router.replace('/(tabs)/reports' as any) : setStep(step + 1))}>
          <Text style={styles.nextText}>{step === 2 ? 'Save Report' : 'Next'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.sumRow}>
      <Text style={styles.sumLabel}>{label}</Text>
      <Text style={styles.sumValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', backgroundColor: colors.card, paddingVertical: 10, paddingHorizontal: spacing.hPad, marginHorizontal: spacing.hPad, borderRadius: radius.md, marginTop: -14 },
  stepItem: { flex: 1, alignItems: 'center', gap: 4 },
  stepDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepNum: { color: colors.mutedForeground, fontFamily: fonts.bold, fontSize: 10 },
  stepLabel: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 9 },
  body: { paddingHorizontal: spacing.hPad, paddingTop: 10, paddingBottom: 20 },
  secRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  section: { flex: 1, color: colors.foreground, fontFamily: fonts.bold, fontSize: 12 },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm },
  newText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, paddingHorizontal: 8, marginBottom: 8 },
  searchInput: { flex: 1, height: 36, color: colors.foreground, fontFamily: fonts.regular, fontSize: 12 },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, marginBottom: 6 },
  pickActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  pickTitle: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 12 },
  pickMeta: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 9, marginTop: 1 },
  check: { width: 18, height: 18, borderRadius: 3, borderWidth: 1.5, borderColor: colors.inputBorder, alignItems: 'center', justifyContent: 'center' },
  price: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.primaryLight, padding: 10, borderRadius: radius.sm, marginTop: 4 },
  totalLabel: { color: colors.primary, fontFamily: fonts.medium, fontSize: 11 },
  totalValue: { color: colors.primary, fontFamily: fonts.bold, fontSize: 14 },
  tableHead: { flexDirection: 'row', backgroundColor: colors.primaryLight, paddingVertical: 8, paddingHorizontal: 8 },
  th: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 10 },
  tr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  td: { color: colors.foreground, fontFamily: fonts.regular, fontSize: 10 },
  cellInput: { height: 32, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, paddingHorizontal: 6, marginRight: 6, color: colors.foreground, fontFamily: fonts.medium, fontSize: 11 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  sumLabel: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 11 },
  sumValue: { flex: 1, textAlign: 'right', color: colors.foreground, fontFamily: fonts.semibold, fontSize: 11 },
  previewBtn: { alignItems: 'center', paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary, marginTop: 12 },
  previewText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 12 },
  footer: { flexDirection: 'row', gap: 10, padding: spacing.hPad, backgroundColor: colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  cancel: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary },
  cancelText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 13 },
  next: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: radius.sm, backgroundColor: colors.primary },
  nextText: { color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 13 },
});
