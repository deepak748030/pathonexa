// Create Report — 3-step wizard, UI PDF screens 4, 6, 7
import React, { useMemo, useState } from 'react';
import { T } from '../components/T';
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
import { C, F, PAGE_GUTTER } from '../src/theme';
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
      <T style={styles.draftsText}>Drafts (3)</T>
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

      <Card style={{ marginHorizontal: PAGE_GUTTER, marginTop: 8, paddingVertical: 4 }}>
        <StepIndicator current={step} />
      </Card>

      {step === 1 && (
        <View style={styles.body}>
          {/* 1. select patient */}
          <Card style={{ marginTop: 8 }}>
            <View style={styles.cardHead}>
              <T style={styles.cardHeadTitle}>1. Select Patient</T>
              <SmallOutlineBtn icon="plus" label="New Patient" onPress={() => router.push('/add-patient')} />
            </View>
            <View style={styles.selPatient}>
              <Avatar initials={patient.initials} tone={patient.tone} size={44} />
              <View style={{ flex: 1, marginLeft: 4 }}>
                <T style={styles.selName}>{patient.name}</T>
                <T style={styles.selMeta}>
                  {patient.age} &nbsp;|&nbsp; {patient.gender} &nbsp;|&nbsp; {patient.blood}
                </T>
                <T style={styles.selPid}>PID: PT250726001</T>
              </View>
              <View style={styles.row}>
                <MaterialCommunityIcons name="phone" size={12} color={C.sub} style={{ marginRight: 4 }} />
                <T style={styles.selPhone}>{patient.phone}</T>
              </View>
              <View style={{ marginLeft: 4 }}>
                <Chevron />
              </View>
            </View>
            <View style={styles.row}>
              <SearchBar placeholder="Search by Name, Mobile or Patient ID" />
              <SquareBtn icon="barcode-scan" />
            </View>
          </Card>

          {/* 2. ref doctor */}
          <Card style={{ marginTop: 8 }}>
            <View style={styles.cardHead}>
              <T style={styles.cardHeadTitle}>2. Select Ref. Doctor</T>
              <SmallOutlineBtn icon="plus" label="New Doctor" />
            </View>
            <View style={styles.selPatient}>
              <Avatar initials={refDoctor.initials} tone="green" size={44} />
              <View style={{ flex: 1, marginLeft: 4 }}>
                <T style={styles.selName}>{refDoctor.name}</T>
                <T style={styles.selMeta}>{refDoctor.quals}</T>
                <T style={styles.selComm}>{refDoctor.commission}</T>
              </View>
              <View style={styles.row}>
                <MaterialCommunityIcons name="phone" size={12} color={C.sub} style={{ marginRight: 4 }} />
                <T style={styles.selPhone}>{refDoctor.phone}</T>
              </View>
              <View style={{ marginLeft: 4 }}>
                <MaterialCommunityIcons name="chevron-down" size={16} color={C.faint} />
              </View>
            </View>
          </Card>

          {/* 3. tests */}
          <Card style={{ marginTop: 8 }}>
            <T style={styles.cardHeadTitle}>3. Select Test / Package</T>
            <View style={{ marginTop: 8 }}>
              <SegTabs tabs={['All Tests', 'Packages', 'Recent Tests']} active={0} />
            </View>
            <View style={{ marginTop: 8 }}>
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
                    <View style={{ flex: 1, marginLeft: 4 }}>
                      <T style={styles.testName}>{t.name}</T>
                      <T style={styles.testCat}>{t.cat}</T>
                    </View>
                    <T style={styles.testPrice}>₹{t.price}</T>
                    <MaterialCommunityIcons name="information-outline" size={16} color={C.primary} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.addMore}>
              <MaterialCommunityIcons name="plus" size={14} color={C.primary} />
              <T style={styles.addMoreText}>Add More Tests</T>
            </TouchableOpacity>
          </Card>

          {/* 4 & 5 */}
          <View style={styles.twoCol}>
            <Card style={styles.twoColCard}>
              <T style={styles.cardHeadTitle}>4. Sample & Report Date</T>
              <T style={styles.dateLabel}>Sample Collection Date</T>
              <View style={styles.dateBox}>
                <MaterialCommunityIcons name="calendar-month-outline" size={15} color={C.primary} />
                <T style={styles.dateText}>26 Jul 2024</T>
                <T style={styles.dateText}>08:45 AM</T>
              </View>
              <T style={[styles.dateLabel, { marginTop: 8 }]}>Expected Report Date</T>
              <View style={styles.dateBox}>
                <MaterialCommunityIcons name="calendar-month-outline" size={15} color={C.primary} />
                <T style={styles.dateText}>26 Jul 2024</T>
                <T style={styles.dateText}>09:21 AM</T>
              </View>
            </Card>

            <Card style={styles.twoColCard}>
              <T style={styles.cardHeadTitle}>5. Amount Details</T>
              <View style={styles.amtRow}>
                <T style={styles.amtLabel}>Total Amount</T>
                <T style={styles.amtValue}>₹{total}</T>
              </View>
              <View style={styles.amtRow}>
                <T style={styles.amtLabel}>Discount</T>
                <View style={styles.amtInputWrap}>
                  <T style={styles.amtRs}>₹</T>
                  <TextInput style={styles.amtInput} value={discount} onChangeText={setDiscount} keyboardType="numeric" />
                  <T style={styles.amtPct}>0%</T>
                </View>
              </View>
              <View style={styles.amtRow}>
                <T style={styles.amtLabel}>Tax (0%)</T>
                <T style={styles.amtValue}>₹0</T>
              </View>
              <View style={[styles.amtRow, { borderTopWidth: 1, borderTopColor: C.borderSoft, paddingTop: 8, marginTop: 4 }]}>
                <T style={[styles.amtLabel, { color: C.primary, fontWeight: '700' }]}>Payable Amount</T>
                <T style={[styles.amtValue, { color: C.primary }]}>₹{payable}</T>
              </View>
              <View style={styles.amtRow}>
                <T style={styles.amtLabel}>Paid Amount</T>
                <View style={styles.amtInputWrap}>
                  <T style={styles.amtRs}>₹</T>
                  <TextInput style={styles.amtInput} value={paid} onChangeText={setPaid} keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.amtRow}>
                <T style={styles.amtLabel}>Pending Amount</T>
                <T style={[styles.amtValue, { color: C.green }]}>₹{pending}</T>
              </View>
            </Card>
          </View>

          {/* payment mode */}
          <Card style={{ marginTop: 8 }}>
            <T style={styles.dateLabel}>Payment Mode</T>
            <View style={styles.payRow}>
              {payModes.map((m) => {
                const on = payMode === m.label;
                return (
                  <TouchableOpacity key={m.label} style={[styles.payChip, on && { borderColor: C.primary, backgroundColor: '#F3F8FF' }]} onPress={() => setPayMode(m.label)}>
                    <MaterialCommunityIcons name={m.icon as any} size={14} color={on ? C.primary : C.sub} />
                    <T style={[styles.payChipText, on && { color: C.primary }]}>{m.label}</T>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          <PrimaryBtn label="Create Report" icon="file-document-outline" style={{ marginTop: 8 }} onPress={() => setStep(2)} />
        </View>
      )}

      {step === 2 && (
        <View style={styles.body}>
          <Card style={{ marginTop: 8, padding: 10 }}>
            <View style={styles.sumRow}>
              <View style={[styles.sumCell, { flex: 1.3 }]}>
                <View style={styles.row}>
                  <Avatar initials={patient.initials} tone={patient.tone} size={40} />
                  <View style={{ marginLeft: 4, flex: 1 }}>
                    <T style={styles.selName}>{patient.name}</T>
                    <T style={styles.selMeta}>
                      {patient.age} &nbsp;|&nbsp; {patient.gender} &nbsp;|&nbsp; {patient.blood}
                    </T>
                    <T style={styles.selPid}>PID: PT250726001</T>
                  </View>
                </View>
              </View>
              <View style={styles.vDiv} />
              <View style={styles.sumCell}>
                <T style={styles.sumLbl}>Test / Package</T>
                <T style={styles.sumVal}>Complete Blood Count (CBC)</T>
                <T style={styles.sumSub}>Hematology</T>
              </View>
              <View style={styles.vDiv} />
              <View style={styles.sumCell}>
                <T style={styles.sumLbl}>Ref. Doctor</T>
                <T style={styles.sumVal}>{refDoctor.name}</T>
              </View>
              <View style={styles.vDiv} />
              <View style={styles.sumCell}>
                <T style={styles.sumLbl}>Report Date</T>
                <T style={styles.sumVal}>26 Jul 2024</T>
                <T style={styles.sumVal}>09:21 AM</T>
              </View>
            </View>
          </Card>

          <Card style={{ marginTop: 8 }}>
            <T style={styles.cardHeadTitle}>Enter Test Values</T>
            <View style={[styles.row, { marginTop: 8, gap: 4 }]}>
              <View style={{ flex: 1 }}>
                <SearchBar placeholder="Search parameter" />
              </View>
              <T style={styles.rangeToggleLabel}>Show Normal Range</T>
              <Switch value={showRange} onValueChange={setShowRange} trackColor={{ true: C.primary, false: '#D5DBE6' }} thumbColor="#fff" />
              <SmallOutlineBtn icon="calculator" label="Auto Calculate" />
            </View>

            {cbcGroups.map((g) => (
              <View key={g.title}>
                <View style={styles.groupHead}>
                  <T style={styles.groupHeadText}>{g.title}</T>
                </View>
                <View style={styles.tblHead}>
                  <T style={[styles.tblHeadText, { flex: 1.3 }]}>Test Name</T>
                  <T style={[styles.tblHeadText, { width: 86 }]}>Result</T>
                  <T style={[styles.tblHeadText, { flex: 0.7 }]}>Unit</T>
                  <T style={[styles.tblHeadText, { flex: 1 }]}>{showRange ? 'Reference Range' : 'Range'}</T>
                </View>
                {g.params.map((p, i) => (
                  <View key={p.name} style={[styles.tblRow, i % 2 === 1 && { backgroundColor: '#FAFBFE' }]}>
                    <T style={[styles.tblName, { flex: 1.3 }]} numberOfLines={1}>
                      {p.name}
                    </T>
                    <View style={{ width: 86 }}>
                      <TextInput
                        style={styles.valInput}
                        value={values[p.name]}
                        onChangeText={(v) => setValues((s) => ({ ...s, [p.name]: v }))}
                        placeholder="—"
                        placeholderTextColor={C.faint}
                      />
                    </View>
                    <T style={[styles.tblUnit, { flex: 0.7 }]}>{p.unit}</T>
                    <View style={[styles.row, { flex: 1, justifyContent: 'space-between' }]}>
                      <T style={styles.tblRange}>{showRange ? p.range : ''}</T>
                      {p.flag && (
                        <View style={styles.row}>
                          <T style={styles.flag}>{p.flag}</T>
                          <MaterialCommunityIcons name="information-outline" size={13} color={C.primary} style={{ marginLeft: 4 }} />
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ))}

            <View style={styles.remarksBox}>
              <T style={styles.remarksLabel}>Technologist / Remarks (Optional)</T>
              <TextInput
                style={styles.remarksInput}
                multiline
                placeholder="Add any notes or remarks here..."
                placeholderTextColor={C.faint}
                value={remarks}
                maxLength={200}
                onChangeText={setRemarks}
              />
              <T style={styles.remarksCount}>{remarks.length}/200</T>
            </View>

            {allEntered && (
              <View style={styles.okBanner}>
                <MaterialCommunityIcons name="check-circle" size={15} color={C.green} />
                <T style={styles.okBannerText}>All values entered. Please review and proceed to preview.</T>
              </View>
            )}
          </Card>

          <View style={styles.btnRow}>
            <OutlineBtn label="Back" icon="arrow-left" onPress={() => setStep(1)} style={{ flex: 1 }} />
            <PrimaryBtn label="Save & Preview" onPress={() => setStep(3)} style={{ flex: 1.6, marginLeft: 4 }} />
          </View>
        </View>
      )}

      {step === 3 && (
        <View style={styles.body}>
          <Card style={{ marginTop: 8 }}>
            <View style={styles.cardHead}>
              <T style={styles.cardHeadTitle}>Report Summary</T>
              <SmallOutlineBtn icon="pencil-outline" label="Edit" onPress={() => setStep(1)} />
            </View>
            <View style={[styles.prevRow, { borderBottomWidth: 1, borderBottomColor: C.borderSoft }]}>
              <View style={styles.prevIcon}>
                <Avatar initials={patient.initials} tone={patient.tone} size={34} />
              </View>
              <View style={{ flex: 1, marginLeft: 4 }}>
                <T style={styles.sumLbl}>Patient</T>
                <T style={styles.selName}>{patient.name}</T>
                <T style={styles.selMeta}>
                  {patient.age} &nbsp;|&nbsp; {patient.gender} &nbsp;|&nbsp; {patient.blood}
                </T>
                <T style={styles.selPid}>PID: PT250726001</T>
              </View>
              <View style={styles.row}>
                <MaterialCommunityIcons name="phone" size={12} color={C.sub} style={{ marginRight: 4 }} />
                <T style={styles.selPhone}>{patient.phone}</T>
              </View>
            </View>
            <View style={[styles.prevRow, { borderBottomWidth: 1, borderBottomColor: C.borderSoft }]}>
              <View style={styles.prevIcon}>
                <MaterialCommunityIcons name="doctor" size={17} color={C.green} />
              </View>
              <View style={{ flex: 1, marginLeft: 4 }}>
                <T style={styles.sumLbl}>Ref. Doctor</T>
                <T style={styles.selName}>{refDoctor.name}</T>
                <T style={styles.selMeta}>{refDoctor.quals}</T>
              </View>
              <View style={styles.row}>
                <MaterialCommunityIcons name="phone" size={12} color={C.sub} style={{ marginRight: 4 }} />
                <T style={styles.selPhone}>{refDoctor.phone}</T>
              </View>
            </View>
            <View style={[styles.prevRow, { borderBottomWidth: 1, borderBottomColor: C.borderSoft }]}>
              <View style={styles.prevIcon}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={17} color={C.purple} />
              </View>
              <View style={{ flex: 1, marginLeft: 4 }}>
                <T style={styles.sumLbl}>Test / Package</T>
                <T style={styles.selName}>Complete Blood Count (CBC)</T>
                <T style={styles.selMeta}>Hematology</T>
              </View>
            </View>
            <View style={styles.prevRow}>
              <View style={styles.prevIcon}>
                <MaterialCommunityIcons name="calendar-month-outline" size={17} color={C.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 4 }}>
                <T style={styles.sumLbl}>Report Date</T>
                <T style={styles.selMeta}>
                  <T style={{ color: C.text, fontWeight: '700' }}>26 Jul 2024</T> &nbsp;|&nbsp;{' '}
                  <T style={{ color: C.text, fontWeight: '700' }}>09:21 AM</T>
                </T>
              </View>
            </View>
          </Card>

          <Card style={{ marginTop: 8 }}>
            <T style={styles.cardHeadTitle}>Test Summary</T>
            <View style={styles.tsRow}>
              <T style={styles.tsLabel}>Total Parameters</T>
              <T style={styles.tsValue}>20</T>
            </View>
            <View style={styles.tsRow}>
              <T style={styles.tsLabel}>Normal</T>
              <T style={[styles.tsValue, { color: C.green }]}>16</T>
            </View>
            <View style={styles.tsRow}>
              <T style={styles.tsLabel}>High</T>
              <T style={[styles.tsValue, { color: C.red }]}>3</T>
            </View>
            <View style={styles.tsRow}>
              <T style={styles.tsLabel}>Low</T>
              <T style={[styles.tsValue, { color: C.red }]}>1</T>
            </View>
            <View style={styles.tsRow}>
              <T style={styles.tsLabel}>Remarks</T>
              <T style={styles.tsValue}>No</T>
            </View>
          </Card>

          <Card style={{ marginTop: 8 }}>
            <T style={styles.cardHeadTitle}>Values Preview</T>
            <View style={[styles.tblHead, { marginTop: 8 }]}>
              <T style={[styles.tblHeadText, { flex: 1.3 }]}>Parameter</T>
              <T style={[styles.tblHeadText, { flex: 0.7 }]}>Result</T>
              <T style={[styles.tblHeadText, { flex: 0.7 }]}>Unit</T>
              <T style={[styles.tblHeadText, { flex: 0.9 }]}>Range</T>
              <T style={[styles.tblHeadText, { width: 44, textAlign: 'center' }]}>Status</T>
            </View>
            {cbcGroups.map((g) => (
              <View key={g.title}>
                <T style={styles.pvGroup}>{g.title}</T>
                {g.params.map((p) => (
                  <View key={p.name} style={styles.tblRow}>
                    <T style={[styles.tblName, { flex: 1.3 }]} numberOfLines={1}>
                      {p.name}
                    </T>
                    <T style={[styles.tblUnit, { flex: 0.7 }]}>{values[p.name]}</T>
                    <T style={[styles.tblUnit, { flex: 0.7 }]}>{p.unit}</T>
                    <T style={[styles.tblUnit, { flex: 0.9 }]} numberOfLines={1}>
                      {p.range}
                    </T>
                    <View style={{ width: 44, alignItems: 'center' }}>
                      {p.flag ? (
                        <T style={styles.arrow}>{p.flag === 'H' ? '↑' : '↓'}</T>
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
            <PrimaryBtn label="Save Report" icon="file-document-outline" onPress={() => router.push('/report-preview')} style={{ flex: 1.6, marginLeft: 4 }} />
          </View>

          <View style={styles.safeNote}>
            <MaterialCommunityIcons name="lock-outline" size={16} color={C.primary} />
            <View style={{ marginLeft: 4 }}>
              <T style={styles.safeNoteTitle}>Your data is safe and secure</T>
              <T style={styles.safeNoteSub}>All report data is stored only on this device.</T>
            </View>
          </View>
        </View>
      )}
    </ScrollPage>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: PAGE_GUTTER },
  row: { flexDirection: 'row', alignItems: 'center' },
  draftsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    borderRadius: 4,
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
    borderRadius: 6,
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
  checkbox: { width: 18, height: 18, borderRadius: 2, borderWidth: 1.5, borderColor: '#C6CFDE', alignItems: 'center', justifyContent: 'center' },
  testName: { fontSize: 12.5, fontWeight: '600', color: C.text },
  testCat: { fontSize: 10, color: C.faint, marginTop: 1 },
  testPrice: { fontSize: 12.5, fontWeight: '700', color: C.text },
  addMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    paddingVertical: 10,
    marginTop: 8,
  },
  addMoreText: { color: C.primary, fontSize: 12, fontWeight: '700' },
  twoCol: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  twoColCard: { flexBasis: '48%', flexGrow: 1 },
  dateLabel: { fontSize: 10.5, color: C.sub, marginBottom: 6, fontWeight: '600' },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  dateText: { fontSize: 11, color: C.text, fontWeight: '600' },
  amtRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  amtLabel: { fontSize: 11, color: C.sub },
  amtValue: { fontSize: 12, fontWeight: '800', color: C.text },
  amtInputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingHorizontal: 8, flexBasis: '52%' },
  amtRs: { fontSize: 11, color: C.sub, marginRight: 4 },
  amtInput: { flex: 1, fontSize: 11.5, color: C.text, paddingVertical: 7, fontFamily: F.regular },
  amtPct: { fontSize: 10, color: C.faint },
  payRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  payChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  payChipText: { fontSize: 11, color: C.sub, fontWeight: '600' },
  btnRow: { flexDirection: 'row', marginTop: 8 },
  sumRow: { flexDirection: 'row', alignItems: 'center' },
  sumCell: { flex: 1, paddingHorizontal: 8 },
  vDiv: { width: 1, alignSelf: 'stretch', backgroundColor: C.borderSoft },
  sumLbl: { fontSize: 9.5, color: C.faint },
  sumVal: { fontSize: 11, fontWeight: '700', color: C.text, marginTop: 2 },
  sumSub: { fontSize: 9.5, color: C.faint, marginTop: 1 },
  rangeToggleLabel: { fontSize: 11, color: C.text, fontWeight: '600' },
  groupHead: { backgroundColor: '#EFF4FC', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 8 },
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
    borderRadius: 4,
    fontSize: 11,
    color: C.text,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#fff',
    fontFamily: F.regular,
  },
  flag: { color: C.red, fontSize: 11, fontWeight: '800' },
  remarksBox: { borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 10, marginTop: 8 },
  remarksLabel: { fontSize: 10.5, color: C.sub, fontWeight: '600' },
  remarksInput: { minHeight: 54, fontSize: 11.5, color: C.text, marginTop: 4, fontFamily: F.regular },
  remarksCount: { textAlign: 'right', fontSize: 9.5, color: C.faint },
  okBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E9F8EF',
    borderWidth: 1,
    borderColor: '#BFE8CF',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  okBannerText: { color: C.green, fontSize: 11, fontWeight: '600', flex: 1 },
  prevRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  prevIcon: { width: 38, height: 38, borderRadius: 4, backgroundColor: '#EFF4FC', alignItems: 'center', justifyContent: 'center' },
  tsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  tsLabel: { fontSize: 11.5, color: C.sub },
  tsValue: { fontSize: 12, fontWeight: '800', color: C.text },
  pvGroup: { color: C.primary, fontSize: 11, fontWeight: '700', marginTop: 0, marginBottom: 2 },
  arrow: { color: C.red, fontSize: 12, fontWeight: '800' },
  dotOk: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  safeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF2FE',
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
  },
  safeNoteTitle: { color: C.primary, fontSize: 11.5, fontWeight: '700' },
  safeNoteSub: { color: C.sub, fontSize: 10, marginTop: 2 },
});
