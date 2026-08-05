import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Camera, Maximize2 } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import { Card } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';

function Field({ label, placeholder, required, flex }: { label: string; placeholder: string; required?: boolean; flex?: number }) {
  return (
    <View style={{ flex: flex ?? 1 }}>
      <Text style={styles.label}>{label} {required ? <Text style={{ color: colors.danger }}>*</Text> : null}</Text>
      <TextInput placeholder={placeholder} placeholderTextColor={colors.mutedForeground} style={styles.input} />
    </View>
  );
}

export default function AddPatient() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Add New Patient"
        subtitle="Enter patient details"
        left={<ChevronLeft size={24} color="#FFFFFF" />}
        onLeftPress={() => router.back()}
        right={<Maximize2 size={18} color="#FFFFFF" />}
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Card>
          <Text style={styles.section}>Basic Information</Text>
          <Pressable style={styles.photo}>
            <View style={styles.photoCircle}><Camera size={20} color={colors.primary} /></View>
            <Text style={styles.photoText}>Add Photo</Text>
          </Pressable>

          <View style={styles.row}><Field label="Patient Name" placeholder="Enter full name" required /><Field label="Patient ID" placeholder="Auto Generate" /></View>
          <View style={styles.row}><Field label="Date of Birth" placeholder="Select DOB" required /><Field label="Age" placeholder="Auto Calculate" /></View>
          <View style={styles.row}><Field label="Gender" placeholder="Select Gender" required /><Field label="Blood Group" placeholder="Select Blood Group" /></View>
          <View style={styles.row}><Field label="Mobile Number" placeholder="Enter mobile number" required /><Field label="Alternate Mobile" placeholder="Enter alternate number" /></View>
        </Card>

        <Card style={{ marginTop: 10 }}>
          <Text style={styles.section}>Address Information</Text>
          <Field label="Address" placeholder="Enter complete address" required />
          <View style={styles.row}><Field label="City" placeholder="Enter city" required /><Field label="State" placeholder="Select state" required /></View>
          <View style={styles.row}><Field label="PIN Code" placeholder="Enter pincode" /><Field label="Email" placeholder="Enter email" /></View>
        </Card>

        <Card style={{ marginTop: 10 }}>
          <Text style={styles.section}>Additional Information</Text>
          <Field label="Referred By Doctor" placeholder="Select doctor (optional)" />
          <Field label="Remarks" placeholder="Enter remarks (optional)" />
        </Card>

        <View style={styles.actions}>
          <Pressable style={styles.cancel} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.save} onPress={() => router.back()}>
            <Text style={styles.saveText}>Save Patient</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.hPad, paddingTop: 14, paddingBottom: 30 },
  section: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 12, marginBottom: 8 },
  photo: { alignItems: 'center', gap: 4, marginBottom: 10 },
  photoCircle: { width: 52, height: 52, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  photoText: { color: colors.primary, fontFamily: fonts.medium, fontSize: 10 },
  row: { flexDirection: 'row', gap: 8 },
  label: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 10, marginTop: 8 },
  input: { height: 38, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, paddingHorizontal: 8, marginTop: 4, color: colors.foreground, fontFamily: fonts.regular, fontSize: 12, backgroundColor: colors.inputBg },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancel: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.card },
  cancelText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 13 },
  save: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: radius.sm, backgroundColor: colors.primary },
  saveText: { color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 13 },
});
