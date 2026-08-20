import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Camera, Calendar, ChevronDown } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import Field from '@/components/Field';
import PrimaryButton from '@/components/PrimaryButton';
import { Card, FadeIn } from '@/components/UI';
import { colors, fonts, radius } from '@/lib/theme';
import { endpoints } from '@/lib/api';
import { BLOOD_GROUPS, INDIAN_STATES, isIndianMobile, isIndianPin, digitsOnly } from '@/lib/format';

const AVATAR_COLORS = ['#DBEAFE', '#DCFCE7', '#EDE9FE', '#FEF3C7', '#E0F2FE', '#FEE2E2'];

function ageFromDob(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 && age <= 120 ? String(age) : '';
}

export default function AddPatient() {
  const [form, setForm] = React.useState({
    name: '', pid: 'Auto Generate', dob: '', age: '', gender: '', blood: '',
    mobile: '', altMobile: '', address: '', city: '', state: '', pincode: '',
    email: '', doctor: '', remarks: '',
  });
  const [loading, setLoading] = React.useState(false);
  const [picker, setPicker] = React.useState<'gender' | 'blood' | 'state' | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const set = (k: string, v: string) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === 'dob') next.age = ageFromDob(v);
      return next;
    });
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Patient name is required';
    if (!form.mobile) e.mobile = 'Mobile number is required';
    else if (!isIndianMobile(form.mobile)) e.mobile = 'Enter a valid 10-digit Indian mobile (starts with 6–9)';
    if (form.altMobile && !isIndianMobile(form.altMobile)) e.altMobile = 'Alternate must be a valid 10-digit number';
    if (!form.age) e.age = 'Age is required';
    if (!form.gender) e.gender = 'Select gender';
    if (form.pincode && !isIndianPin(form.pincode)) e.pincode = 'Enter a valid 6-digit PIN code';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await endpoints.patients.create({
        name: form.name.trim(),
        age: parseInt(form.age, 10),
        gender: form.gender,
        blood: form.blood,
        mobile: form.mobile,
        altMobile: form.altMobile,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        email: form.email,
        dob: form.dob,
        remarks: form.remarks,
        referredBy: form.doctor,
        color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      });
      router.back();
    } catch (err: any) {
      setErrors({ mobile: err?.message || 'Failed to save patient. Check the server connection.' });
    } finally {
      setLoading(false);
    }
  };

  const options = picker === 'gender' ? ['Male', 'Female', 'Other'] : picker === 'blood' ? BLOOD_GROUPS : INDIAN_STATES;

  return (
    <AppScreen
      keyboard
      header={
        <ScreenHeader
          title="Add New Patient"
          subtitle="Enter patient details"
          left={<ChevronLeft size={24} color="#FFFFFF" />}
          onLeftPress={() => router.back()}
        />
      }
      footer={
        <View style={styles.footer}>
          <View style={{ flex: 1 }}>
            <PrimaryButton title="Cancel" ghost onPress={() => router.back()} />
          </View>
          <View style={{ flex: 1.4 }}>
            <PrimaryButton title="Save Patient" onPress={handleSubmit} loading={loading} />
          </View>
        </View>
      }
    >
      <FadeIn>
        <Card>
          <Text style={styles.section}>Basic Information</Text>
          <View style={styles.photoWrap}>
            <View style={styles.photo}>
              <Camera size={22} color={colors.primary} />
            </View>
            <Text style={styles.photoTxt}>Add Photo</Text>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1.2 }}>
              <Field label="Patient Name" required value={form.name} onChangeText={(t) => set('name', t)} placeholder="Enter full name" error={errors.name} />
            </View>
            <View style={{ flex: 0.8 }}>
              <Field label="Patient ID" value={form.pid} editable={false} hint="Auto Generate" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field
                label="Date of Birth"
                value={form.dob}
                placeholder="YYYY-MM-DD"
                onChangeText={(t) => set('dob', t)}
                right={<Calendar size={16} color={colors.mutedForeground} />}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Age" required value={form.age} digits={3} placeholder="Auto Calculate" hint="Years" error={errors.age} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field
                label="Gender" required value={form.gender} placeholder="Select Gender"
                onPress={() => setPicker('gender')} error={errors.gender}
                right={<ChevronDown size={16} color={colors.mutedForeground} />}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Blood Group" value={form.blood} placeholder="Select Blood Group"
                onPress={() => setPicker('blood')}
                right={<ChevronDown size={16} color={colors.mutedForeground} />}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field
                label="Mobile Number" required value={form.mobile} digits={10}
                placeholder="Enter 10-digit mobile" keyboardType="number-pad"
                error={errors.mobile} hint="+91 · Indian number only"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Alternate Mobile" value={form.altMobile} digits={10}
                placeholder="Enter alternate mobile" keyboardType="number-pad"
                error={errors.altMobile}
              />
            </View>
          </View>
        </Card>
      </FadeIn>

      <FadeIn delay={60}>
        <Card style={{ marginTop: 12 }}>
          <Text style={styles.section}>Address Information</Text>
          <Field label="Address" value={form.address} onChangeText={(t) => set('address', t)} placeholder="Enter complete address" multiline />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="City" value={form.city} onChangeText={(t) => set('city', t)} placeholder="Enter city" />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="State" value={form.state} placeholder="Select state"
                onPress={() => setPicker('state')}
                right={<ChevronDown size={16} color={colors.mutedForeground} />}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="PIN Code" value={form.pincode} digits={6} placeholder="Enter 6-digit PIN" error={errors.pincode} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Email" value={form.email} onChangeText={(t) => set('email', t)} placeholder="Enter email" keyboardType="email-address" />
            </View>
          </View>
        </Card>
      </FadeIn>

      <FadeIn delay={100}>
        <Card style={{ marginTop: 12 }}>
          <Text style={styles.section}>Additional Information</Text>
          <Field label="Referred By Doctor" value={form.doctor} onChangeText={(t) => set('doctor', t)} placeholder="Select doctor (optional)" />
          <Field label="Remarks" value={form.remarks} onChangeText={(t) => set('remarks', t)} placeholder="Enter remarks (optional)" multiline />
        </Card>
      </FadeIn>

      <Modal visible={!!picker} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <Pressable style={styles.overlay} onPress={() => setPicker(null)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>
              {picker === 'gender' ? 'Select Gender' : picker === 'blood' ? 'Select Blood Group' : 'Select State'}
            </Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {options.map((o) => (
                <Pressable
                  key={o}
                  style={styles.opt}
                  onPress={() => {
                    if (picker === 'gender') set('gender', o);
                    else if (picker === 'blood') set('blood', o);
                    else set('state', o);
                    setPicker(null);
                  }}
                >
                  <Text style={styles.optTxt}>{o}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  section: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.foreground, marginBottom: 12 },
  photoWrap: { alignItems: 'center', marginBottom: 16 },
  photo: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#BFDBFE',
  },
  photoTxt: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 12, marginTop: 6 },
  row: { flexDirection: 'row', gap: 10 },
  footer: {
    flexDirection: 'row', gap: 10, padding: 12, backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: 16, maxHeight: '70%' },
  sheetTitle: { fontFamily: fonts.bold, fontSize: 15, marginBottom: 8, color: colors.foreground },
  opt: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border },
  optTxt: { fontFamily: fonts.medium, fontSize: 14, color: colors.foreground },
});
