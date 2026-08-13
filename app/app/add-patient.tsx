import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, User, Phone, MapPin, Droplets, Calendar } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import Field from '@/components/Field';
import { Card, FadeIn } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { endpoints } from '@/lib/api';

const AVATAR_COLORS = ['#DBEAFE', '#DCFCE7', '#EDE9FE', '#FEF3C7', '#E0F2FE', '#FEE2E2'];

export default function AddPatient() {
  const [form, setForm] = React.useState({
    name: '', age: '', gender: 'Male' as 'Male' | 'Female',
    blood: '', mobile: '', address: '',
  });
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.mobile || !form.age) {
      alert('Please fill in all required fields (name, age, mobile)');
      return;
    }
    if (form.mobile.length !== 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      await endpoints.patients.create({
        name: form.name,
        age: parseInt(form.age, 10),
        gender: form.gender,
        blood: form.blood,
        mobile: form.mobile,
        address: form.address,
        color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      });
      alert('Patient record saved successfully!');
      router.back();
    } catch (e: any) {
      console.error('Add patient error:', e);
      alert(e?.message || 'Failed to save patient. Check the server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Add New Patient"
        left={<ChevronLeft size={24} color="#FFFFFF" />}
        onLeftPress={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <FadeIn>
          <Card style={styles.formCard}>
            <Field label="Full Name" value={form.name} onChangeText={(t) => setForm((f) => ({ ...f, name: t }))} placeholder="Patient's full name" icon={<User size={16} color={colors.primary} />} />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Age" value={form.age} onChangeText={(t) => setForm((f) => ({ ...f, age: t }))} placeholder="e.g. 25" icon={<Calendar size={16} color={colors.primary} />} keyboardType="number-pad" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderWrap}>
                  {(['Male', 'Female'] as const).map((g) => (
                    <Pressable
                      key={g}
                      style={[styles.genderBtn, form.gender === g && styles.genderBtnActive]}
                      onPress={() => setForm((f) => ({ ...f, gender: g }))}
                    >
                      <Text style={[styles.genderText, form.gender === g && styles.genderTextActive]}>{g}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <Field label="Mobile Number" value={form.mobile} onChangeText={(t) => setForm((f) => ({ ...f, mobile: t.replace(/\D/g, '').slice(0, 10) }))} placeholder="10-digit mobile" icon={<Phone size={16} color={colors.primary} />} keyboardType="number-pad" />
            <Field label="Blood Group" value={form.blood} onChangeText={(t) => setForm((f) => ({ ...f, blood: t }))} placeholder="e.g. O+, AB-" icon={<Droplets size={16} color={colors.primary} />} />
            <Field label="Address (optional)" value={form.address} onChangeText={(t) => setForm((f) => ({ ...f, address: t }))} placeholder="Residence address" icon={<MapPin size={16} color={colors.primary} />} multiline />

            <Pressable
              style={[styles.submitBtn, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Save Patient Record</Text>
              )}
            </Pressable>
          </Card>
        </FadeIn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: spacing.hPad, paddingBottom: 40, paddingTop: 4 },
  formCard: { padding: 15 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 13, fontFamily: fonts.semibold, color: colors.foreground, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', height: 52, backgroundColor: colors.inputBg, borderRadius: radius.md, paddingHorizontal: 12, borderWidth: 1.5, borderColor: colors.inputBorder },
  inputWrapMultiline: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.inputBg, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1.5, borderColor: colors.inputBorder },
  input: { flex: 1, height: '100%', marginLeft: 10, fontFamily: fonts.medium, fontSize: 14, color: colors.foreground, outlineStyle: 'none' as any },
  row: { flexDirection: 'row' },
  genderWrap: { flexDirection: 'row', height: 48, gap: 8 },
  genderBtn: { flex: 1, backgroundColor: '#FFF', borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  genderBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  genderText: { fontSize: 13, fontFamily: fonts.semibold, color: colors.mutedForeground },
  genderTextActive: { color: '#FFFFFF' },
  submitBtn: { height: 48, backgroundColor: colors.primary, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  btnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: fonts.bold },
});
