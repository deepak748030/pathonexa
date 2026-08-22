// Add New Patient — UI PDF screen 3
import React from 'react';
import { T } from '../components/T';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlueHeader, HeaderIconBtn, ScrollPage, Card, Field, OutlineBtn, PrimaryBtn } from '../components/kit';
import { C, PAGE_GUTTER } from '../src/theme';
import { api } from '../src/api';

function SelectRight() {
  return <MaterialCommunityIcons name="chevron-down" size={15} color={C.faint} />;
}
function CalRight() {
  return <MaterialCommunityIcons name="calendar-month-outline" size={15} color={C.primary} />;
}

export default function AddPatient() {
  const router = useRouter();
  const [form, setForm] = React.useState({
    name: '', dob: '', age: '', gender: '', blood: '', mobile: '', altMobile: '',
    address: '', city: '', state: '', pincode: '', email: '', referredBy: '', remarks: '',
  });
  const [saving, setSaving] = React.useState(false);
  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));
  const select = (title: string, values: string[], key: keyof typeof form) => {
    Alert.alert(title, undefined, [
      ...values.map((value) => ({ text: value, onPress: () => set(key)(value) })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };
  const updateDob = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const dob = digits.length <= 2 ? digits : digits.length <= 4 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    let age = form.age;
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dob);
    if (match) {
      const birth = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
      const now = new Date();
      age = String(Math.max(0, now.getFullYear() - birth.getFullYear() - (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0)));
    }
    setForm((current) => ({ ...current, dob, age }));
  };
  const save = async () => {
    if (saving) return;
    if (!form.name.trim() || !form.age || !form.gender || !/^[6-9]\d{9}$/.test(form.mobile)) {
      Alert.alert('Check patient details', 'Enter the patient name, date of birth or age, gender, and a valid 10-digit mobile number.');
      return;
    }
    if (!form.address.trim() || !form.city.trim() || !form.state.trim() || !/^\d{6}$/.test(form.pincode)) {
      Alert.alert('Check address details', 'Enter the complete address, city, state, and a valid 6-digit PIN code.');
      return;
    }
    setSaving(true);
    try {
      const patient = await api.patients.create({ ...form, age: Number(form.age) });
      Alert.alert('Patient Saved ✅', `${patient.name} was added with patient ID ${patient.pid}.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Unable to save patient', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollPage>
      <BlueHeader
        onBack={() => router.back()}
        title="Add New Patient"
        sub="Enter patient details"
        right={<HeaderIconBtn icon="barcode-scan" />}
      />

      <View style={styles.body}>
        <Card style={{ marginTop: 8 }}>
          <T style={styles.sec}>Basic Information</T>

          <View style={styles.photoWrap}>
            <View style={styles.photoCircle}>
              <MaterialCommunityIcons name="camera-outline" size={22} color={C.primary} />
            </View>
            <T style={styles.photoLabel}>Add Photo</T>
          </View>

          <View style={styles.grid}>
            <Field label="Patient Name" required placeholder="Enter full name" value={form.name} onChange={set('name')} />
            <Field label="Patient ID" placeholder="Auto Generate" disabled />
            <Field label="Date of Birth" required placeholder="DD/MM/YYYY" right={<CalRight />} value={form.dob} onChange={updateDob} keyboardType="number-pad" />
            <Field label="Age" placeholder="Auto Calculate" value={form.age} onChange={set('age')} keyboardType="number-pad" />
            <Field label="Gender" required placeholder="Select Gender" right={<SelectRight />} value={form.gender} onPress={() => select('Select gender', ['Male', 'Female', 'Other'], 'gender')} />
            <Field label="Blood Group" placeholder="Select Blood Group" right={<SelectRight />} value={form.blood} onPress={() => select('Select blood group', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], 'blood')} />
            <Field label="Mobile Number" required placeholder="Enter mobile number" icon="phone" keyboardType="phone-pad" value={form.mobile} onChange={(value) => set('mobile')(value.replace(/\D/g, '').slice(0, 10))} />
            <Field label="Alternate Mobile" placeholder="Enter alternate number" icon="phone" keyboardType="phone-pad" value={form.altMobile} onChange={(value) => set('altMobile')(value.replace(/\D/g, '').slice(0, 10))} />
          </View>
        </Card>

        <Card style={{ marginTop: 8 }}>
          <T style={styles.sec}>Address Information</T>
          <View style={styles.grid}>
            <View style={{ flexDirection: 'row', flexBasis: '100%' }}>
              <Field label="Address" required placeholder="Enter complete address" multiline value={form.address} onChange={set('address')} />
            </View>
            <Field label="City" required placeholder="Enter city" value={form.city} onChange={set('city')} />
            <Field label="State" required placeholder="Enter state" value={form.state} onChange={set('state')} />
            <Field label="PIN Code" required placeholder="Enter pincode" keyboardType="number-pad" value={form.pincode} onChange={(value) => set('pincode')(value.replace(/\D/g, '').slice(0, 6))} />
            <Field label="Email" placeholder="Enter email" keyboardType="email-address" value={form.email} onChange={set('email')} />
          </View>
        </Card>

        <Card style={{ marginTop: 8 }}>
          <T style={styles.sec}>Additional Information</T>
          <View style={styles.grid}>
            <View style={{ flexDirection: 'row', flexBasis: '100%' }}>
              <Field label="Referred By Doctor" placeholder="Enter doctor (optional)" value={form.referredBy} onChange={set('referredBy')} />
            </View>
            <View style={{ flexDirection: 'row', flexBasis: '100%' }}>
              <Field label="Remarks" placeholder="Enter remarks (optional)" multiline value={form.remarks} onChange={set('remarks')} />
            </View>
          </View>
        </Card>

        <View style={styles.btnRow}>
          <OutlineBtn label="Cancel" onPress={() => router.back()} style={{ flex: 1 }} />
          <PrimaryBtn label={saving ? 'Saving…' : 'Save Patient'} onPress={save} style={{ flex: 1.4, marginLeft: 4 }} />
        </View>
      </View>
    </ScrollPage>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: PAGE_GUTTER },
  sec: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
  photoWrap: { alignItems: 'center', marginBottom: 8 },
  photoCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#EAF2FE',
    borderWidth: 1,
    borderColor: '#CFE0FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: { fontSize: 11, color: C.primary, fontWeight: '600', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  gridItem: {},
  btnRow: { flexDirection: 'row', marginTop: 8 },
});
