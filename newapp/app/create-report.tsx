// Create Report — 3-step wizard, UI PDF screens 4, 6, 7
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  BlueHeader,
  ScrollPage,
  Card,
  Avatar,
  SearchBar,
  SquareBtn,
  SmallOutlineBtn,
  SegTabs,
  StepIndicator,
  PrimaryBtn,
  OutlineBtn,
  Chevron,
} from '../components/kit';
import { useDrawer } from '../components/Drawer';
import { C } from '../src/theme';
import { patients, refDoctor, testsCatalog, cbcGroups } from '../src/data';

const payModes = [
  { icon: 'cash', label: 'Cash' },
  { icon: 'swap-horizontal', label: 'UPI' },
  { icon: 'credit-card-outline', label: 'Card' },
  { icon: 'bank-transfer', label: 'Bank Transfer' },
  { icon: 'circle-outline', label: 'Other' },
];

export default function CreateReport() {
  const router = useRouter();
  const { setOpen } = useDrawer();
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string[]>(['t1']);
  const [discount, setDiscount] = useState('0');
  const [paid, setPaid] = useState('250');
  const [payMode, setPayMode] = useState('Cash');
  const [showRange, setShowRange] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    cbcGroups.forEach((g) => g.params.forEach((p) => (v[p.name] = p.value)));
    return v;
  });

  const total = testsCatalog.filter((t) => selected.includes(t.id)).reduce((a, t) => a + t.price, 0);
  const disc = parseInt(discount || '0', 10) || 0;
  const payable = Math.max(total - disc, 0);
  const paidN = parseInt(paid || '0', 10) || 0;
  const pending = Math.max(payable - paidN, 0);
  const allEntered = useMemo(
    () => cbcGroups.every((g) => g.params.every((p) => (values[p.name] ?? '').trim() !== '')),
    [values],
  );

  const patient = patients[0];

  const toggleTest = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const draftsBtn = (
    <TouchableOpacity style={styles.draftsBtn}>
      <MaterialCommunityIcons name="file-document-outline" size={15} color="#fff" />
      <Text style={styles.draftsText}>Drafts (3)</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollPage>
      <BlueHeader
        menu={step === 1}
        onBack={step === 1 ? () => setOpen(true) : () => setStep(step - 1)}
        title="Create Report"
        sub={`Step ${step} of 3 - ${step === 1 ? 'Select Details' : step === 2 ? 'Enter Report Values' : 'Preview & Save'}`}
        right={draftsBtn}
      />

      <Card style={{ marginHorizontal: 14, marginTop: 12, paddingVertical: 4 }}>
        <StepIndicator current={step} />
      </Card>

      {step === 1 && (
        <View style={styles.body}>
          {/* 1. select patient */}
          <Card style={{ marginTop: 12 }}>
            <View style={styles.cardHead}>
              <Text style={styles.cardHeadTitle}>1. Select Patient</Text>
              <SmallOutlineBtn icon="plus" label="New Patient" onPress={() => router.push('/add-patient')} />
            </View>
            <View style={styles.selPatient}>
              <Avatar initials={patient.initials} tone={patient.tone} size={44} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.selName}>{patient.name}</Text>
                <Text style={styles.selMeta}>
                  {patient.age} &nbsp;|&nbsp; {patient.gender} &nbsp;|&nbsp; {patient.blood}
                </Text>
                <Text style={styles.selPid}>PID: PT250726001</Text>
              </View>
              <View style={styles.row}>
                <MaterialCommunityIcons name="phone" size={12} color={C.sub} style={{ marginRight: 6 }} />
                <Text style={styles.selPhone}>{patient.phone}</Text>
              </View>
              <View style={{ marginLeft: 8 }}>
                <Chevron />
              </View>
            </View>
            <View style={styles.row}>
              <SearchBar placeholder="Search by Name, Mobile or Patient ID" />
              <SquareBtn icon="barcode-scan" />
            </View>
          </Card>

          {/* 2. ref doctor */}
          <Card style={{ marginTop: 12 }}>
            <View style={styles.cardHead}>
              <Text style={styles.cardHeadTitle}>2. Select Ref. Doctor</Text>
              <SmallOutlineBtn icon="plus" label="New Doctor" />
            </View>
            <View style={styles.selPatient}>
              <Avatar initials={refDoctor.initials} tone="green" size={44} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.selName}>{refDoctor.name}</Text>
                <Text style={styles.selMeta}>{refDoctor.quals}</Text>
                <Text style={styles.selComm}>{refDoctor.commission}</Text>
              </View>
              <View style={styles.row}>
                <MaterialCommunityIcons name="phone" size={12} color={C.sub} style={{ marginRight: 6 }} />
                <Text style={styles.selPhone}>{refDoctor.phone}</Text>
              </View>
              <View style={{ marginLeft: 8 }}>
                <MaterialCommunityIcons name="chevron-down" size={16} color={C.faint} />
              </View>
            </View>
          </Card>

          {/* 3. tests */}
          <Card style={{ marginTop: 12 }}>
            <Text style={styles.cardHeadTitle}>3. Select Test / Package</Text>
            <View style={{ marginTop: 10 }}>
              <SegTabs tabs={['All Tests', 'Packages', 'Recent Tests']} active={0} />
            </View>
            <View style={{ marginTop: 10 }}>
              <SearchBar placeholder="Search test or package name" />
            </View>
            <View style={{ marginTop: 6 }}>
              {testsCatalog.map((t) => {
                const on = selected.includes(t.id);
                return (
                  <TouchableOpacity key={t.id} style={[styles.testRow, on && { backgroundColor: '#F2F7FF' }]} onPress={() => toggleTest(t.id)}>
                    <View style={[styles.checkbox, on && { backgroundColor: C.primary, borderColor: C.primary }]}>
                      {on && <MaterialCommunityIcons name="check" size={12} color="#fff" />}
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.testName}>{t.name}</Text>
                      <Text style={styles.testCat}>{t.cat}</Text>
                    </View>
                    <Text style={styles.testPrice}>₹{t.price}</Text>
                    <MaterialCommunityIcons name="information-outline" size={16} color={C.primary} style={{ marginLeft: 10 }} />
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.addMore}>
              <MaterialCommunityIcons name="plus" size={14} color={C.primary} />
              <Text style={styles.addMoreText}>Add More Tests</Text>
            </TouchableOpacity>
          </Card>

          {/* 4 & 5 */}
          <View style={styles.twoCol}>
            <Card style={styles.twoColCard}>
              <Text style={styles.cardHeadTitle}>4. Sample & Report Date</Text>
              <Text style={styles.dateLabel}>Sample Collection Date</Text>
              <View style={styles.dateBox}>
                <MaterialCommunityIcons name="calendar-month-outline" size={15} color={C.primary} />
                <Text style={styles.dateText}>26 Jul 2024</Text>
                <Text style={styles.dateText}>08:45 AM</Text>
              </View>
              <Text style={[styles.dateLabel, { marginTop: 12 }]}>Expected Report Date</Text>
              <View style={styles.dateBox}>
                <MaterialCommunityIcons name="calendar-month-outline" size={15} color={C.primary} />
                <Text style={styles.dateText}>26 Jul 2024</Text>
                <Text style={styles.dateText}>09:21 AM</Text>
              </View>
            </Card>

            <Card style={styles.twoColCard}>
              <Text style={styles.cardHeadTitle}>5. Amount Details</Text>
              <View style={styles.amtRow}>
                <Text style={styles.amtLabel}>Total Amount</Text>
                <Text style={styles.amtValue}>₹{total}</Text>
              </View>
              <View style={styles.amtRow}>
                <Text style={styles.amtLabel}>Discount</Text>
                <View style={styles.amtInputWrap}>
                  <Text style={styles.amtRs}>₹</Text>
                  <TextInput style={styles.amtInput} value={discount} onChangeText={setDiscount} keyboardType="numeric" />
                  <Text style={styles.amtPct}>0%</Text>
                </View>
              </View>
              <View style={styles.amtRow}>
                <Text style={styles.amtLabel}>Tax (0%)</Text>
                <Text style={styles.amtValue}>₹0</Text>
              </View>
              <View style={[styles.amtRow, { borderTopWidth: 1, borderTopColor: C.borderSoft, paddingTop: 8, marginTop: 4 }]}>
                <Text style={[styles.amtLabel, { color: C.primary, fontWeight: '700' }]}>Payable Amount</Text>
                <Text style={[styles.amtValue, { color: C.primary }]}>₹{payable}</Text>
              </View>
              <View style={styles.amtRow}>
                <Text style={styles.amtLabel}>Paid Amount</Text>
                <View style={styles.amtInputWrap}>
                  <Text style={styles.amtRs}>₹</Text>
                  <TextInput style={styles.amtInput} value={paid} onChangeText={setPaid} keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.amtRow}>
                <Text style={styles.amtLabel}>Pending Amount</Text>
                <Text style={[styles.amtValue, { color: C.green }]}>₹{pending}</Text>
              </View>
            </Card>
          </View>

          {/* payment mode */}
          <Card style={{ marginTop: 12 }}>
            <Text style={styles.dateLabel}>Payment Mode</Text>
            <View style={styles.payRow}>
              {payModes.map((m) => {
                const on = payMode === m.label;
                return (
                  <TouchableOpacity key={m.label} style={[styles.payChip, on && { borderColor: C.primary, backgroundColor: '#F3F8FF' }]} onPress={() => setPayMode(m.label)}>
                    <MaterialCommunityIcons name={m.icon as any} size={14} color={on ? C.primary : C.sub} />
                    <Text style={[styles.payChipText, on && { color: C.primary }]}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          <PrimaryBtn label="Create Report" icon="file-document-outline" style={{ marginTop: 16 }} onPress={() => setStep(2)} />
        </View>
      )}

      {step === 2 && (
        <View style={styles.body}>
          <Card style={{ marginTop: 12, padding: 10 }}>
            <View style={styles.sumRow}>
              <View style={[styles.sumCell, { flex: 1.3 }]}>
                <View style={styles.row}>
                  <Avatar initials={patient.initials} tone={patient.tone} size={40} />
                  <View style={{ marginLeft: 8, flex: 1 }}>
                    <Text style={styles.selName}>{patient.name}</Text>
                    <Text style={styles.selMeta}>
                      {patient.age} &nbsp;|&nbsp; {patient.gender} &nbsp;|&nbsp; {patient.blood}
                    </Text>
                    <Text style={styles.selPid}>PID: PT250726001</Text>
                  </View>
                </View>
              </View>
              <View style={styles.vDiv} />
              <View style={styles.sumCell}>
                <Text style={styles.sumLbl}>Test / Package</Text>
                <Text style={styles.sumVal}>Complete Blood Count (CBC)</Text>
                <Text style={styles.sumSub}>Hematology</Text>
              </View>
              <View style={styles.vDiv} />
              <View style={styles.sumCell}>
                <Text style={styles.sumLbl}>Ref. Doctor</Text>
                <Text style={styles.sumVal}>{refDoctor.name}</Text>
              </View>
              <View style={styles.vDiv} />
              <View style={styles.sumCell}>
                <Text style={styles.sumLbl}>Report Date</Text>
                <Text style={styles.sumVal}>26 Jul 2024</Text>
                <Text style={styles.sumVal}>09:21 AM</Text>
              </View>
            </View>
          </Card>

          <Card style={{ marginTop: 12 }}>
            <Text style={styles.cardHeadTitle}>Enter Test Values</Text>
            <View style={[styles.row, { marginTop: 10, gap: 8 }]}>
              <View style={{ flex: 1 }}>
                <SearchBar placeholder="Search parameter" />
              </View>
              <Text style={styles.rangeToggleLabel}>Show Normal Range</Text>
              <Switch value={showRange} onValueChange={setShowRange} trackColor={{ true: C.primary, false: '#D5DBE6' }} thumbColor="#fff" />
              <SmallOutlineBtn icon="calculator" label="Auto Calculate" />
            </View>

            {cbcGroups.map((g) => (
              <View key={g.title} style={{ marginTop: 12 }}>
                <View style={styles.groupHead}>
                  <Text style={styles.groupHeadText}>{g.title}</Text>
                </View>
                <View style={styles.tblHead}>
                  <Text style={[styles.tblHeadText, { flex: 1.3 }]}>Test Name</Text>
                  <Text style={[styles.tblHeadText, { width: 86 }]}>Result</Text>
                  <Text style={[styles.tblHeadText, { flex: 0.7 }]}>Unit</Text>
                  <Text style={[styles.tblHeadText, { flex: 1 }]}>{showRange ? 'Reference Range' : 'Range'}</Text>
                </View>
                {g.params.map((p, i) => (
                  <View key={p.name} style={[styles.tblRow, i % 2 === 1 && { backgroundColor: '#FAFBFE' }]}>
                    <Text style={[styles.tblName, { flex: 1.3 }]} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <View style={{ width: 86 }}>
                      <TextInput
                        style={styles.valInput}
                        value={values[p.name]}
                        onChangeText={(v) => setValues((s) => ({ ...s, [p.name]: v }))}
                        placeholder="—"
                        placeholderTextColor={C.faint}
                      />
                    </View>
                    <Text style={[styles.tblUnit, { flex: 0.7 }]}>{p.unit}</Text>
                    <View style={[styles.row, { flex: 1, justifyContent: 'space-between' }]}>
                      <Text style={styles.tblRange}>{showRange ? p.range : ''}</Text>
                      {p.flag && (
                        <View style={styles.row}>
                          <Text style={styles.flag}>{p.flag}</Text>
                          <MaterialCommunityIcons name="information-outline" size={13} color={C.primary} style={{ marginLeft: 4 }} />
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ))}

            <View style={styles.remarksBox}>
              <Text style={styles.remarksLabel}>Technologist / Remarks (Optional)</Text>
              <TextInput
                style={styles.remarksInput}
                multiline
                placeholder="Add any notes or remarks here..."
                placeholderTextColor={C.faint}
                value={remarks}
                maxLength={200}
                onChangeText={setRemarks}
              />
              <Text style={styles.remarksCount}>{remarks.length}/200</Text>
            </View>

            {allEntered && (
              <View style={styles.okBanner}>
                <MaterialCommunityIcons name="check-circle" size={15} color={C.green} />
                <Text style={styles.okBannerText}>All values entered. Please review and proceed to preview.</Text>
              </View>
            )}
          </Card>

          <View style={styles.btnRow}>
            <OutlineBtn label="Back" icon="arrow-left" onPress={() => setStep(1)} style={{ flex: 1 }} />
            <PrimaryBtn label="Save & Preview" onPress={() => setStep(3)} style={{ flex: 1.6, marginLeft: 10 }} />
          </View>
        </View>
      )}

      {step === 3 && (
        <View style={styles.body}>
          <Card style={{ marginTop: 12 }}>
            <View style={styles.cardHead}>
              <Text style={styles.cardHeadTitle}>Report Summary</Text>
              <SmallOutlineBtn icon="pencil-outline" label="Edit" onPress={() => setStep(1)} />
            </View>
            <View style={[styles.prevRow, { borderBottomWidth: 1, borderBottomColor: C.borderSoft }]}>
              <View style={styles.prevIcon}>
                <Avatar initials={patient.initials} tone={patient.tone} size={34} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.sumLbl}>Patient</Text>
                <Text style={styles.selName}>{patient.name}</Text>
                <Text style={styles.selMeta}>
                  {patient.age} &nbsp;|&nbsp; {patient.gender} &nbsp;|&nbsp; {patient.blood}
                </Text>
                <Text style={styles.selPid}>PID: PT250726001</Text>
              </View>
              <View style={styles.row}>
                <MaterialCommunityIcons name="phone" size={12} color={C.sub} style={{ marginRight: 6 }} />
                <Text style={styles.selPhone}>{patient.phone}</Text>
              </View>
            </View>
            <View style={[styles.prevRow, { borderBottomWidth: 1, borderBottomColor: C.borderSoft }]}>
              <View style={styles.prevIcon}>
                <MaterialCommunityIcons name="doctor" size={17} color={C.green} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.sumLbl}>Ref. Doctor</Text>
                <Text style={styles.selName}>{refDoctor.name}</Text>
                <Text style={styles.selMeta}>{refDoctor.quals}</Text>
              </View>
              <View style={styles.row}>
                <MaterialCommunityIcons name="phone" size={12} color={C.sub} style={{ marginRight: 6 }} />
                <Text style={styles.selPhone}>{refDoctor.phone}</Text>
              </View>
            </View>
            <View style={[styles.prevRow, { borderBottomWidth: 1, borderBottomColor: C.borderSoft }]}>
              <View style={styles.prevIcon}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={17} color={C.purple} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.sumLbl}>Test / Package</Text>
                <Text style={styles.selName}>Complete Blood Count (CBC)</Text>
                <Text style={styles.selMeta}>Hematology</Text>
              </View>
            </View>
            <View style={styles.prevRow}>
              <View style={styles.prevIcon}>
                <MaterialCommunityIcons name="calendar-month-outline" size={17} color={C.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.sumLbl}>Report Date</Text>
                <Text style={styles.selMeta}>
                  <Text style={{ color: C.text, fontWeight: '700' }}>26 Jul 2024</Text> &nbsp;|&nbsp;{' '}
                  <Text style={{ color: C.text, fontWeight: '700' }}>09:21 AM</Text>
                </Text>
              </View>
            </View>
          </Card>

          <Card style={{ marginTop: 12 }}>
            <Text style={styles.cardHeadTitle}>Test Summary</Text>
            <View style={styles.tsRow}>
              <Text style={styles.tsLabel}>Total Parameters</Text>
              <Text style={styles.tsValue}>20</Text>
            </View>
            <View style={styles.tsRow}>
              <Text style={styles.tsLabel}>Normal</Text>
              <Text style={[styles.tsValue, { color: C.green }]}>16</Text>
            </View>
            <View style={styles.tsRow}>
              <Text style={styles.tsLabel}>High</Text>
              <Text style={[styles.tsValue, { color: C.red }]}>3</Text>
            </View>
            <View style={styles.tsRow}>
              <Text style={styles.tsLabel}>Low</Text>
              <Text style={[styles.tsValue, { color: C.red }]}>1</Text>
            </View>
            <View style={styles.tsRow}>
              <Text style={styles.tsLabel}>Remarks</Text>
              <Text style={styles.tsValue}>No</Text>
            </View>
          </Card>

          <Card style={{ marginTop: 12 }}>
            <Text style={styles.cardHeadTitle}>Values Preview</Text>
            <View style={[styles.tblHead, { marginTop: 8 }]}>
              <Text style={[styles.tblHeadText, { flex: 1.3 }]}>Parameter</Text>
              <Text style={[styles.tblHeadText, { flex: 0.7 }]}>Result</Text>
              <Text style={[styles.tblHeadText, { flex: 0.7 }]}>Unit</Text>
              <Text style={[styles.tblHeadText, { flex: 0.9 }]}>Range</Text>
              <Text style={[styles.tblHeadText, { width: 44, textAlign: 'center' }]}>Status</Text>
            </View>
            {cbcGroups.map((g) => (
              <View key={g.title}>
                <Text style={styles.pvGroup}>{g.title}</Text>
                {g.params.map((p) => (
                  <View key={p.name} style={styles.tblRow}>
                    <Text style={[styles.tblName, { flex: 1.3 }]} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={[styles.tblUnit, { flex: 0.7 }]}>{values[p.name]}</Text>
                    <Text style={[styles.tblUnit, { flex: 0.7 }]}>{p.unit}</Text>
                    <Text style={[styles.tblUnit, { flex: 0.9 }]} numberOfLines={1}>
                      {p.range}
                    </Text>
                    <View style={{ width: 44, alignItems: 'center' }}>
                      {p.flag ? (
                        <Text style={styles.arrow}>{p.flag === 'H' ? '↑' : '↓'}</Text>
                      ) : (
                        <View style={styles.dotOk} />
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </Card>

          <View style={styles.btnRow}>
            <OutlineBtn label="Back" icon="arrow-left" onPress={() => setStep(2)} style={{ flex: 1 }} />
            <PrimaryBtn label="Save Report" icon="file-document-outline" onPress={() => router.push('/report-preview')} style={{ flex: 1.6, marginLeft: 10 }} />
          </View>

          <View style={styles.safeNote}>
            <MaterialCommunityIcons name="lock-outline" size={16} color={C.primary} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.safeNoteTitle}>Your data is safe and secure</Text>
              <Text style={styles.safeNoteSub}>All report data is stored only on this device.</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollPage>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  draftsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  draftsText: { color: '#fff', fontSize: 11.5, fontWeight: '700' },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardHeadTitle: { fontSize: 13, fontWeight: '700', color: C.text },
  selPatient: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F8FE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2EAF7',
    padding: 10,
    marginBottom: 10,
  },
  selName: { fontSize: 13, fontWeight: '700', color: C.text },
  selMeta: { fontSize: 10.5, color: C.sub, marginTop: 2 },
  selPid: { fontSize: 10.5, color: C.primary, fontWeight: '700', marginTop: 3 },
  selComm: { fontSize: 10.5, color: C.green, fontWeight: '700', marginTop: 3 },
  selPhone: { fontSize: 11.5, fontWeight: '600', color: C.text },
  testRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: '#C6CFDE', alignItems: 'center', justifyContent: 'center' },
  testName: { fontSize: 12.5, fontWeight: '600', color: C.text },
  testCat: { fontSize: 10, color: C.faint, marginTop: 1 },
  testPrice: { fontSize: 12.5, fontWeight: '700', color: C.text },
  addMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 10,
  },
  addMoreText: { color: C.primary, fontSize: 12, fontWeight: '700' },
  twoCol: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  twoColCard: { flexBasis: '48%', flexGrow: 1 },
  dateLabel: { fontSize: 10.5, color: C.sub, marginBottom: 6, fontWeight: '600' },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  dateText: { fontSize: 11, color: C.text, fontWeight: '600' },
  amtRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  amtLabel: { fontSize: 11, color: C.sub },
  amtValue: { fontSize: 12, fontWeight: '800', color: C.text },
  amtInputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 8, flexBasis: '52%' },
  amtRs: { fontSize: 11, color: C.sub, marginRight: 4 },
  amtInput: { flex: 1, fontSize: 11.5, color: C.text, paddingVertical: 7 },
  amtPct: { fontSize: 10, color: C.faint },
  payRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  payChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  payChipText: { fontSize: 11, color: C.sub, fontWeight: '600' },
  btnRow: { flexDirection: 'row', marginTop: 16 },
  sumRow: { flexDirection: 'row', alignItems: 'center' },
  sumCell: { flex: 1, paddingHorizontal: 8 },
  vDiv: { width: 1, alignSelf: 'stretch', backgroundColor: C.borderSoft },
  sumLbl: { fontSize: 9.5, color: C.faint },
  sumVal: { fontSize: 11, fontWeight: '700', color: C.text, marginTop: 2 },
  sumSub: { fontSize: 9.5, color: C.faint, marginTop: 1 },
  rangeToggleLabel: { fontSize: 11, color: C.text, fontWeight: '600' },
  groupHead: { backgroundColor: '#EFF4FC', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  groupHeadText: { color: C.primary, fontSize: 11.5, fontWeight: '700' },
  tblHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingTop: 8, paddingBottom: 6 },
  tblHeadText: { fontSize: 9.5, color: C.faint, fontWeight: '700' },
  tblRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 7 },
  tblName: { fontSize: 11, color: C.text, fontWeight: '600' },
  tblUnit: { fontSize: 10, color: C.sub },
  tblRange: { fontSize: 10, color: C.sub },
  valInput: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 7,
    fontSize: 11,
    color: C.text,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  flag: { color: C.red, fontSize: 11, fontWeight: '800' },
  remarksBox: { borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 10, marginTop: 14 },
  remarksLabel: { fontSize: 10.5, color: C.sub, fontWeight: '600' },
  remarksInput: { minHeight: 54, fontSize: 11.5, color: C.text, marginTop: 4 },
  remarksCount: { textAlign: 'right', fontSize: 9.5, color: C.faint },
  okBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E9F8EF',
    borderWidth: 1,
    borderColor: '#BFE8CF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  okBannerText: { color: C.green, fontSize: 11, fontWeight: '600', flex: 1 },
  prevRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  prevIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#EFF4FC', alignItems: 'center', justifyContent: 'center' },
  tsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  tsLabel: { fontSize: 11.5, color: C.sub },
  tsValue: { fontSize: 12, fontWeight: '800', color: C.text },
  pvGroup: { color: C.primary, fontSize: 11, fontWeight: '700', marginTop: 10, marginBottom: 2 },
  arrow: { color: C.red, fontSize: 12, fontWeight: '800' },
  dotOk: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  safeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF2FE',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  safeNoteTitle: { color: C.primary, fontSize: 11.5, fontWeight: '700' },
  safeNoteSub: { color: C.sub, fontSize: 10, marginTop: 2 },
});
