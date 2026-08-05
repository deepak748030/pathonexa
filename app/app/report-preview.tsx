import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Share2, Printer, Download } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import { Card } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { lab, cbcParams, patients, doctors } from '@/lib/labData';

const p = patients[0];
const d = doctors[0];

export default function ReportPreview() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Report Preview"
        subtitle="Complete Blood Count (CBC)"
        left={<ChevronLeft size={24} color="#FFFFFF" />}
        onLeftPress={() => router.back()}
        right={<Share2 size={18} color="#FFFFFF" />}
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Card style={{ padding: 0 }}>
          <View style={styles.letterhead}>
            <Image source={require('../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={styles.labName}>{lab.name}</Text>
              <Text style={styles.labMeta}>{lab.address}</Text>
              <Text style={styles.labMeta}>{lab.phone}  |  {lab.email}</Text>
            </View>
          </View>

          <View style={styles.info}>
            <InfoRow label="Patient Name" value={p.name} label2="Report ID" value2="RPT-2026-0148" />
            <InfoRow label="Age / Gender" value={`${p.age} Yrs / ${p.gender}`} label2="Patient ID" value2={p.pid} />
            <InfoRow label="Referred By" value={d.name} label2="Report Date" value2="26 Jul 2026" />
          </View>

          <Text style={styles.testTitle}>COMPLETE BLOOD COUNT (CBC)</Text>

          <View style={styles.tableHead}>
            <Text style={[styles.th, { flex: 2 }]}>Test</Text>
            <Text style={[styles.th, { flex: 1 }]}>Result</Text>
            <Text style={[styles.th, { flex: 1 }]}>Unit</Text>
            <Text style={[styles.th, { flex: 1.4 }]}>Reference</Text>
          </View>
          {cbcParams.map((c) => (
            <View key={c.name} style={styles.tr}>
              <Text style={[styles.td, { flex: 2 }]}>{c.name}</Text>
              <Text style={[styles.td, { flex: 1, fontFamily: fonts.semibold }]}>{c.value}</Text>
              <Text style={[styles.td, { flex: 1 }]}>{c.unit}</Text>
              <Text style={[styles.td, { flex: 1.4 }]}>{c.range}</Text>
            </View>
          ))}

          <View style={styles.signature}>
            <View>
              <Text style={styles.sigName}>{lab.pathologist}</Text>
              <Text style={styles.sigRole}>Consultant Pathologist</Text>
            </View>
          </View>
          <Text style={styles.note}>*** End of Report ***</Text>
        </Card>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={styles.ghost}>
          <Printer size={15} color={colors.primary} />
          <Text style={styles.ghostText}>Print</Text>
        </Pressable>
        <Pressable style={styles.solid}>
          <Download size={15} color="#FFFFFF" />
          <Text style={styles.solidText}>Download PDF</Text>
        </Pressable>
      </View>
    </View>
  );
}

function InfoRow({ label, value, label2, value2 }: { label: string; value: string; label2: string; value2: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label2}</Text>
        <Text style={styles.infoValue}>{value2}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.hPad, paddingTop: 4, paddingBottom: 24 },
  letterhead: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 2, borderBottomColor: colors.primary },
  logo: { width: 44, height: 44 },
  labName: { color: colors.primary, fontFamily: fonts.bold, fontSize: 13 },
  labMeta: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 9, marginTop: 1 },
  info: { padding: 12, backgroundColor: colors.primaryLight },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  infoLabel: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 9 },
  infoValue: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 11 },
  testTitle: { textAlign: 'center', color: colors.foreground, fontFamily: fonts.bold, fontSize: 12, paddingVertical: 10, letterSpacing: 0.4 },
  tableHead: { flexDirection: 'row', backgroundColor: colors.muted, paddingVertical: 7, paddingHorizontal: 10 },
  th: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 10 },
  tr: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  td: { color: colors.foreground, fontFamily: fonts.regular, fontSize: 10 },
  signature: { alignItems: 'flex-end', padding: 14 },
  sigName: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 11 },
  sigRole: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 9 },
  note: { textAlign: 'center', color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 10, paddingBottom: 14 },
  footer: { flexDirection: 'row', gap: 10, padding: spacing.hPad, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  ghost: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary },
  ghostText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 13 },
  solid: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: radius.sm, backgroundColor: colors.primary },
  solidText: { color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 13 },
});
