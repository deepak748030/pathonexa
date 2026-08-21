// Add New Patient — UI PDF screen 3
import React from 'react';
import { T } from '../components/T';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlueHeader, HeaderIconBtn, ScrollPage, Card, Field, OutlineBtn, PrimaryBtn } from '../components/kit';
import { C } from '../src/theme';

function SelectRight() {
  return <MaterialCommunityIcons name="chevron-down" size={15} color={C.faint} />;
}
function CalRight() {
  return <MaterialCommunityIcons name="calendar-month-outline" size={15} color={C.primary} />;
}

export default function AddPatient() {
  const router = useRouter();
  const save = () => {
    Alert.alert('Patient Saved ✅', 'Ramesh-style demo patient stored locally in this UI build.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
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
        <Card style={{ marginTop: 14 }}>
          <T style={styles.sec}>Basic Information</T>

          <View style={styles.photoWrap}>
            <View style={styles.photoCircle}>
              <MaterialCommunityIcons name="camera-outline" size={22} color={C.primary} />
            </View>
            <T style={styles.photoLabel}>Add Photo</T>
          </View>

          <View style={styles.grid}>
            <Field label="Patient Name" required placeholder="Enter full name" />
            <Field label="Patient ID" placeholder="Auto Generate" disabled />
            <Field label="Date of Birth" required placeholder="Select DOB" right={<CalRight />} />
            <Field label="Age" placeholder="Auto Calculate" disabled />
            <Field label="Gender" required placeholder="Select Gender" right={<SelectRight />} />
            <Field label="Blood Group" placeholder="Select Blood Group" right={<SelectRight />} />
            <Field label="Mobile Number" required placeholder="Enter mobile number" icon="phone" />
            <Field label="Alternate Mobile" placeholder="Enter alternate number" icon="phone" />
          </View>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <T style={styles.sec}>Address Information</T>
          <View style={styles.grid}>
            <View style={{ flexDirection: 'row', flexBasis: '100%' }}>
              <Field label="Address" required placeholder="Enter complete address" multiline />
            </View>
            <Field label="City" required placeholder="Enter city" />
            <Field label="State" required placeholder="Select state" right={<SelectRight />} />
            <Field label="PIN Code" required placeholder="Enter pincode" />
            <Field label="Email" placeholder="Enter email" />
          </View>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <T style={styles.sec}>Additional Information</T>
          <View style={styles.grid}>
            <View style={{ flexDirection: 'row', flexBasis: '100%' }}>
              <Field label="Referred By Doctor" placeholder="Select doctor (optional)" right={<SelectRight />} />
            </View>
            <View style={{ flexDirection: 'row', flexBasis: '100%' }}>
              <Field label="Remarks" placeholder="Enter remarks (optional)" multiline />
            </View>
          </View>
        </Card>

        <View style={styles.btnRow}>
          <OutlineBtn label="Cancel" onPress={() => router.back()} style={{ flex: 1 }} />
          <PrimaryBtn label="Save Patient" onPress={save} style={{ flex: 1.4, marginLeft: 10 }} />
        </View>
      </View>
    </ScrollPage>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 14 },
  sec: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 12 },
  photoWrap: { alignItems: 'center', marginBottom: 16 },
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
  photoLabel: { fontSize: 11, color: C.primary, fontWeight: '600', marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 12 },
  gridItem: {},
  btnRow: { flexDirection: 'row', marginTop: 16 },
});
