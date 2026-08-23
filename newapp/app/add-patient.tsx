// Add New Patient — UI PDF screen 3
import React from 'react';
import { T } from '../components/T';
import { View, StyleSheet, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlueHeader, HeaderIconBtn, ScrollPage, Card, Field, OutlineBtn, PrimaryBtn, Press } from '../components/kit';
import { C, PAGE_GUTTER } from '../src/theme';
import { api } from '../src/api';
import { useFeedback } from '../src/feedback';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function ageFromDate(birth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return Math.max(0, age);
}

/** DD/MM/YYYY → Date (or null if invalid). */
function parseDob(dob: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dob || '');
  if (!match) return null;
  const d = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Cells for a month view: leading nulls + day numbers. */
function monthGrid(view: Date): Array<number | null> {
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: Array<number | null> = [];
  for (let i = 0; i < first.getDay(); i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  return cells;
}

export default function AddPatient() {
  const router = useRouter();
  const { toast } = useFeedback();
  const [form, setForm] = React.useState({
    name: '', dob: '', age: '', gender: '', blood: '', mobile: '', altMobile: '',
    address: '', city: '', state: '', pincode: '', email: '', referredBy: '', remarks: '',
  });
  const [saving, setSaving] = React.useState(false);
  const [picker, setPicker] = React.useState<'gender' | 'blood' | null>(null);
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [calendarView, setCalendarView] = React.useState(() => new Date());

  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const updateDob = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const dob = digits.length <= 2 ? digits : digits.length <= 4 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    let age = form.age;
    const parsed = parseDob(dob);
    if (parsed) age = String(ageFromDate(parsed));
    setForm((current) => ({ ...current, dob, age }));
  };

  const openCalendar = () => {
    setCalendarView(parseDob(form.dob) || new Date());
    setCalendarOpen(true);
  };

  const pickDate = (day: number) => {
    const chosen = new Date(calendarView.getFullYear(), calendarView.getMonth(), day);
    updateDob(`${pad2(chosen.getDate())}/${pad2(chosen.getMonth() + 1)}/${chosen.getFullYear()}`);
    setCalendarOpen(false);
  };

  const pickerValues = picker === 'gender' ? ['Male', 'Female', 'Other'] : BLOOD_GROUPS;
  const pickerTitle = picker === 'gender' ? 'Select Gender' : 'Select Blood Group';
  const chooseOption = (value: string) => {
    if (picker === 'gender') set('gender')(value);
    else if (picker === 'blood') set('blood')(value);
    setPicker(null);
  };

  const save = async () => {
    if (saving) return;
    if (!form.name.trim() || !form.age || !form.gender || !/^[6-9]\d{9}$/.test(form.mobile)) {
      toast({ kind: 'warning', title: 'Check patient details', message: 'Enter the patient name, date of birth or age, gender, and a valid 10-digit mobile number.' });
      return;
    }
    if (!form.address.trim() || !form.city.trim() || !form.state.trim() || !/^\d{6}$/.test(form.pincode)) {
      toast({ kind: 'warning', title: 'Check address details', message: 'Enter the complete address, city, state, and a valid 6-digit PIN code.' });
      return;
    }
    setSaving(true);
    try {
      const patient = await api.patients.create({ ...form, age: Number(form.age) });
      toast({ kind: 'success', title: 'Patient saved', message: `${patient.name} was added with patient ID ${patient.pid}.` });
      router.back();
    } catch (error) {
      toast({ kind: 'error', title: 'Unable to save patient', message: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const calendarCells = monthGrid(calendarView);

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
            <Field
              label="Date of Birth"
              required
              placeholder="DD/MM/YYYY"
              right={
                <Press onPress={openCalendar} accessibilityLabel="Open calendar" style={{ padding: 4, marginRight: -6 }}>
                  <MaterialCommunityIcons name="calendar-month-outline" size={16} color={C.primary} />
                </Press>
              }
              value={form.dob}
              onChange={updateDob}
              keyboardType="number-pad"
            />
            <Field label="Age" placeholder="Auto Calculate" value={form.age} onChange={set('age')} keyboardType="number-pad" />
            <Field label="Gender" required placeholder="Select Gender" right={<SelectRight />} value={form.gender} onPress={() => setPicker('gender')} />
            <Field label="Blood Group" placeholder="Select Blood Group" right={<SelectRight />} value={form.blood} onPress={() => setPicker('blood')} />
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

      {/* Gender / Blood Group bottom sheet */}
      <Modal visible={!!picker} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <Pressable style={styles.overlay} onPress={() => setPicker(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <T style={styles.sheetTitle}>{pickerTitle}</T>
            <ScrollView style={{ maxHeight: 380 }} bounces={false}>
              {pickerValues.map((value) => (
                <TouchableOpacity key={value} style={styles.option} onPress={() => chooseOption(value)}>
                  <T style={[styles.optionText, (picker === 'gender' ? form.gender : form.blood) === value && { color: C.primary, fontWeight: '700' }]}>
                    {value}
                  </T>
                  {(picker === 'gender' ? form.gender : form.blood) === value && (
                    <MaterialCommunityIcons name="check" size={18} color={C.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Date-of-birth calendar */}
      <Modal visible={calendarOpen} transparent animationType="fade" onRequestClose={() => setCalendarOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setCalendarOpen(false)}>
          <Pressable style={styles.calSheet} onPress={() => {}}>
            <View style={styles.calHeader}>
              <Press
                onPress={() => setCalendarView(new Date(calendarView.getFullYear(), calendarView.getMonth() - 1, 1))}
                style={styles.calNav}
                accessibilityLabel="Previous month"
              >
                <MaterialCommunityIcons name="chevron-left" size={22} color={C.text} />
              </Press>
              <T style={styles.calTitle}>{MONTHS[calendarView.getMonth()]} {calendarView.getFullYear()}</T>
              <Press
                onPress={() => setCalendarView(new Date(calendarView.getFullYear(), calendarView.getMonth() + 1, 1))}
                style={styles.calNav}
                accessibilityLabel="Next month"
              >
                <MaterialCommunityIcons name="chevron-right" size={22} color={C.text} />
              </Press>
            </View>

            <View style={styles.calWeekRow}>
              {WEEKDAYS.map((d) => (
                <T key={d} style={styles.calWeekDay}>{d}</T>
              ))}
            </View>

            <View style={styles.calGrid}>
              {calendarCells.map((day, i) => {
                if (day == null) return <View key={`b${i}`} style={styles.calCell} />;
                const selected = parseDob(form.dob);
                const isSelected = !!selected && selected.getDate() === day
                  && selected.getMonth() === calendarView.getMonth()
                  && selected.getFullYear() === calendarView.getFullYear();
                const today = new Date();
                const isToday = day === today.getDate() && calendarView.getMonth() === today.getMonth() && calendarView.getFullYear() === today.getFullYear();
                return (
                  <Pressable
                    key={day}
                    style={[styles.calCell, isSelected && styles.calCellSelected, isToday && !isSelected && styles.calCellToday]}
                    onPress={() => pickDate(day)}
                  >
                    <T style={[styles.calDay, (isSelected || isToday) && { color: isSelected ? '#fff' : C.primary, fontWeight: '700' }]}>
                      {day}
                    </T>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.calFooter}>
              <OutlineBtn label="Cancel" onPress={() => setCalendarOpen(false)} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollPage>
  );
}

function SelectRight() {
  return <MaterialCommunityIcons name="chevron-down" size={15} color={C.faint} />;
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
  btnRow: { flexDirection: 'row', marginTop: 8 },

  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 16,
    paddingBottom: 24,
    maxHeight: '75%',
  },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.borderStrong, marginBottom: 12 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 4 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
  },
  optionText: { fontSize: 14.5, color: C.text, fontWeight: '500' },

  calSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 16,
    paddingBottom: 24,
  },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  calNav: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  calTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  calWeekRow: { flexDirection: 'row', marginBottom: 4 },
  calWeekDay: { flex: 1, textAlign: 'center', fontSize: 11.5, fontWeight: '600', color: C.faint, paddingVertical: 4 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: '14.285714%' as const,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calCellSelected: { backgroundColor: C.primary, borderRadius: 22 },
  calCellToday: { borderWidth: 1, borderColor: C.primary, borderRadius: 22 },
  calDay: { fontSize: 14, color: C.text },
  calFooter: { flexDirection: 'row', marginTop: 8 },
});
