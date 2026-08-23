// Create Report — 3-step wizard, UI PDF screens 4, 6, 7
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { T } from '../components/T';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, Modal, Platform, ActivityIndicator } from 'react-native';
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
  Skeleton,
} from '../components/kit';
import { useDrawer } from '../components/Drawer';
import { C, F, PAGE_GUTTER } from '../src/theme';
import { api, Patient, type RazorpayOrder } from '../src/api';
import { useFeedback } from '../src/feedback';
import { openRazorpayOnWeb, RazorpayCheckout, type RazorpayPaymentResult } from '../src/razorpay';

type TestParameter = {
  order?: number;
  name: string;
  short?: string;
  unit?: string;
  range?: string;
  group?: string;
};
type CatalogTest = {
  _id: string;
  id?: string;
  name: string;
  short?: string;
  category?: string;
  group?: string;
  price: number;
  parameters?: TestParameter[];
  status?: string;
};
type Doctor = {
  _id: string;
  name: string;
  degree?: string;
  mobile?: string;
  commission?: number;
};
type ParameterGroup = { title: string; test: CatalogTest; params: TestParameter[] };

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'P';
const parameterKey = (test: CatalogTest, parameter: TestParameter) => `${test._id}:${parameter.short || parameter.name}`;
const displayDate = (date = new Date()) => date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const displayTime = (date = new Date()) => date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
const valueFlag = (value: string, range = ''): '' | 'H' | 'L' => {
  const result = Number(value);
  const limits = range.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
  if (!Number.isFinite(result) || limits.length < 2) return '';
  if (result < limits[0]) return 'L';
  if (result > limits[1]) return 'H';
  return '';
};

// Only UPI apps are offered — online payment goes through Razorpay.
const payModes = [
  { icon: 'cellphone', label: 'PhonePe' },
  { icon: 'google', label: 'Google Pay' },
  { icon: 'wallet', label: 'Paytm' },
];

export default function CreateReport() {
  const router = useRouter();
  const { setOpen } = useDrawer();
  const { toast } = useFeedback();
  const [step, setStep] = useState(1);
  const [patientList, setPatientList] = useState<Patient[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [parameterSearch, setParameterSearch] = useState('');
  const [testsCatalog, setTestsCatalog] = useState<CatalogTest[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [discount, setDiscount] = useState('0');
  const [paid, setPaid] = useState('0');
  const [payMode, setPayMode] = useState('PhonePe');
  const [paymentRef, setPaymentRef] = useState('');
  const [razorpayOrder, setRazorpayOrder] = useState<RazorpayOrder | null>(null);
  const [payingOnline, setPayingOnline] = useState(false);
  const [showRange, setShowRange] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const patientSearchRef = useRef(patientSearch);
  patientSearchRef.current = patientSearch;

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      api.patients.list({ page: 1, limit: 50 }),
      api.meta.list<CatalogTest>('tests'),
      api.meta.list<Doctor>('doctors'),
    ]).then(([patientPage, tests, doctorRows]) => {
      if (!active) return;
      if (!patientSearchRef.current.trim()) {
        setPatientList(patientPage.items);
        setPatient(patientPage.items[0] || null);
      }
      setTestsCatalog(tests.filter((test) => test.status !== 'Inactive'));
      setSelected(tests[0]?._id ? [tests[0]._id] : []);
      setDoctors(doctorRows);
      setDoctor(doctorRows[0] || null);
      setLoadError('');
    }).catch((error) => {
      if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load report details.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      api.patients.list({ page: 1, limit: 50, search: patientSearch.trim() || undefined })
        .then((page) => {
          if (!active) return;
          setPatientList(page.items);
          setPatient((current) => (
            page.items.length && (!current || !page.items.some((item) => item._id === current._id)) ? page.items[0] : current
          ));
        })
        .catch(() => undefined);
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [patientSearch]);

  const selectedTests = useMemo(() => testsCatalog.filter((test) => selected.includes(test._id)), [selected, testsCatalog]);
  const visibleTests = useMemo(() => {
    const query = testSearch.trim().toLowerCase();
    return query ? testsCatalog.filter((test) => [test.name, test.short, test.category, test.group].some((value) => String(value || '').toLowerCase().includes(query))) : testsCatalog;
  }, [testSearch, testsCatalog]);
  const parameterGroups = useMemo<ParameterGroup[]>(() => selectedTests.flatMap((test) => {
    const grouped = new Map<string, TestParameter[]>();
    [...(test.parameters || [])].sort((a, b) => (a.order || 0) - (b.order || 0)).forEach((parameter) => {
      const title = parameter.group || test.name;
      grouped.set(title, [...(grouped.get(title) || []), parameter]);
    });
    return Array.from(grouped, ([title, params]) => ({ title, test, params }));
  }), [selectedTests]);

  const visibleParameterGroups = useMemo(() => {
    const query = parameterSearch.trim().toLowerCase();
    if (!query) return parameterGroups;
    return parameterGroups.map((group) => ({
      ...group,
      params: group.params.filter((parameter) => [parameter.name, parameter.short, group.title, group.test.name].some((value) => String(value || '').toLowerCase().includes(query))),
    })).filter((group) => group.params.length);
  }, [parameterGroups, parameterSearch]);

  const total = selectedTests.reduce((sum, test) => sum + Number(test.price || 0), 0);
  const disc = parseInt(discount || '0', 10) || 0;
  const payable = Math.max(total - disc, 0);
  const paidN = Math.min(parseInt(paid || '0', 10) || 0, payable);
  const pending = Math.max(payable - paidN, 0);
  const allEntered = useMemo(
    () => parameterGroups.length > 0 && parameterGroups.every((group) => group.params.every((parameter) => (values[parameterKey(group.test, parameter)] ?? '').trim() !== '')),
    [parameterGroups, values],
  );
  const resultSummary = useMemo(() => {
    let total = 0; let entered = 0; let high = 0; let low = 0;
    parameterGroups.forEach((group) => group.params.forEach((parameter) => {
      total += 1;
      const value = values[parameterKey(group.test, parameter)] || '';
      if (value.trim()) entered += 1;
      const flag = valueFlag(value, parameter.range);
      if (flag === 'H') high += 1;
      if (flag === 'L') low += 1;
    }));
    return { total, high, low, normal: Math.max(0, entered - high - low) };
  }, [parameterGroups, values]);

  const toggleTest = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  const cyclePatient = () => {
    if (!patientList.length) return;
    const current = patient ? patientList.findIndex((item) => item._id === patient._id) : -1;
    setPatient(patientList[(current + 1) % patientList.length]);
  };
  const cycleDoctor = () => {
    if (!doctors.length) return setDoctor(null);
    const current = doctor ? doctors.findIndex((item) => item._id === doctor._id) : -1;
    setDoctor(current >= doctors.length - 1 ? null : doctors[current + 1]);
  };
  const now = new Date();

  // Verify a completed Razorpay checkout and mark the bill paid locally.
  const verifyOnlinePayment = async (result: RazorpayPaymentResult) => {
    const verified = await api.payments.verify({
      orderId: result.razorpay_order_id,
      paymentId: result.razorpay_payment_id,
      signature: result.razorpay_signature,
      mode: payMode,
    });
    setPaid(String(verified.amount || payable));
    setPaymentRef(result.razorpay_payment_id);
    toast({ kind: 'success', title: 'Payment received', message: `₹${verified.amount || payable} paid via ${payMode}.` });
  };

  // Create a Razorpay order and open the checkout for the payable amount.
  const startOnlinePayment = async () => {
    if (payingOnline) return;
    if (payable <= 0) {
      toast({ kind: 'warning', title: 'Nothing to pay', message: 'The payable amount must be greater than zero.' });
      return;
    }
    setPayingOnline(true);
    try {
      const order = await api.payments.order({
        amount: payable,
        notes: { patient: patient?.name || '', mobile: patient?.mobile || '' },
      });
      if (Platform.OS === 'web') {
        const result = await openRazorpayOnWeb({
          keyId: order.keyId,
          orderId: order.orderId,
          amount: order.amount,
          currency: order.currency,
          name: 'PathoNexa Lab',
          description: 'Report payment',
          prefill: { name: patient?.name, contact: patient?.mobile },
        });
        await verifyOnlinePayment(result);
      } else {
        setRazorpayOrder(order);
      }
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        toast({ kind: 'error', title: 'Payment failed', message: error instanceof Error ? error.message : 'Unable to complete the payment.' });
      }
    } finally {
      if (Platform.OS === 'web') setPayingOnline(false);
    }
  };

  const saveReport = async () => {
    if (saving) return;
    if (!patient) return toast({ kind: 'warning', title: 'Select patient', message: 'Select a patient before saving the report.' });
    if (!selectedTests.length) return toast({ kind: 'warning', title: 'Select test', message: 'Select at least one test or package.' });
    setSaving(true);
    try {
      const reportValues = parameterGroups.flatMap((group) => group.params.map((parameter) => ({
        testId: group.test._id,
        test: group.test.name,
        group: group.title,
        name: parameter.name,
        short: parameter.short || '',
        unit: parameter.unit || '',
        range: parameter.range || '',
        value: values[parameterKey(group.test, parameter)] || '',
      })));
      const report = await api.reports.create({
        patient: patient._id,
        test: selectedTests.map((test) => test.name).join(', '),
        tests: selectedTests.map((test) => ({ id: test._id, name: test.name, short: test.short || '', category: test.category || test.group || '', price: Number(test.price || 0) })),
        doctor: doctor?.name || 'Direct',
        amount: payable,
        discount: disc,
        paidAmount: paidN,
        pendingAmount: pending,
        paid: pending === 0,
        paymentMode: payMode,
        paymentRef: paymentRef || undefined,
        status: allEntered ? 'Completed' : 'Pending',
        sampleDate: now.toISOString(),
        reportDate: now.toISOString(),
        remarks,
        values: reportValues,
        parameters: reportValues,
      });
      router.replace({ pathname: '/report-preview', params: { id: report._id } });
    } catch (error) {
      toast({ kind: 'error', title: 'Unable to save report', message: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const draftsBtn = (
    <TouchableOpacity style={styles.draftsBtn}>
      <MaterialCommunityIcons name="file-document-outline" size={15} color="#fff" />
      <T style={styles.draftsText}>Drafts</T>
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
            <TouchableOpacity style={styles.selPatient} onPress={cyclePatient} disabled={loading || !patientList.length}>
              {loading ? <Skeleton width={44} height={44} radius={22} /> : <Avatar initials={initials(patient?.name)} tone="blue" size={44} />}
              <View style={{ flex: 1, marginLeft: 4 }}>
                {loading ? <><Skeleton width="58%" height={14} /><Skeleton width="45%" height={10} style={{ marginTop: 5 }} /><Skeleton width="35%" height={10} style={{ marginTop: 5 }} /></> : <>
                  <T style={styles.selName}>{patient?.name || 'No patient selected'}</T>
                  {patient ? <><T style={styles.selMeta}>{patient.age} Yrs &nbsp;|&nbsp; {patient.gender} &nbsp;|&nbsp; {patient.blood || '—'}</T><T style={styles.selPid}>PID: {patient.pid}</T></> : <T style={styles.selMeta}>Add a patient to create a report</T>}
                </>}
              </View>
              {!loading && patient ? <View style={styles.row}>
                <MaterialCommunityIcons name="phone" size={12} color={C.sub} style={{ marginRight: 4 }} />
                <T style={styles.selPhone}>{patient.mobile || '—'}</T>
              </View> : null}
              <View style={{ marginLeft: 4 }}><Chevron /></View>
            </TouchableOpacity>
            <View style={styles.row}>
              <SearchBar placeholder="Search by Name, Mobile or Patient ID" value={patientSearch} onChangeText={setPatientSearch} />
              <SquareBtn icon="barcode-scan" />
            </View>
          </Card>

          {/* 2. ref doctor */}
          <Card style={{ marginTop: 8 }}>
            <View style={styles.cardHead}>
              <T style={styles.cardHeadTitle}>2. Select Ref. Doctor</T>
              <SmallOutlineBtn icon="plus" label="New Doctor" />
            </View>
            <TouchableOpacity style={styles.selPatient} onPress={cycleDoctor} disabled={loading}>
              {loading ? <Skeleton width={44} height={44} radius={22} /> : <Avatar initials={initials(doctor?.name || 'Direct')} tone="green" size={44} />}
              <View style={{ flex: 1, marginLeft: 4 }}>
                {loading ? <><Skeleton width="52%" height={14} /><Skeleton width="42%" height={10} style={{ marginTop: 5 }} /></> : <>
                  <T style={styles.selName}>{doctor?.name || 'Direct'}</T>
                  <T style={styles.selMeta}>{doctor?.degree || 'No referring doctor'}</T>
                  {doctor ? <T style={styles.selComm}>Commission: {doctor.commission || 0}%</T> : null}
                </>}
              </View>
              {!loading && doctor?.mobile ? <View style={styles.row}><MaterialCommunityIcons name="phone" size={12} color={C.sub} style={{ marginRight: 4 }} /><T style={styles.selPhone}>{doctor.mobile}</T></View> : null}
              <View style={{ marginLeft: 4 }}><MaterialCommunityIcons name="chevron-down" size={16} color={C.faint} /></View>
            </TouchableOpacity>
          </Card>

          {/* 3. tests */}
          <Card style={{ marginTop: 8 }}>
            <T style={styles.cardHeadTitle}>3. Select Test / Package</T>
            <View style={{ marginTop: 8 }}>
              <SegTabs tabs={['All Tests', 'Packages', 'Recent Tests']} active={0} />
            </View>
            <View style={{ marginTop: 8 }}>
              <SearchBar placeholder="Search test or package name" value={testSearch} onChangeText={setTestSearch} />
            </View>
            <View style={{ marginTop: 6 }}>
              {loading ? [0, 1, 2, 3].map((item) => <View key={item} style={styles.testRow}><Skeleton width={16} height={16} radius={3} /><View style={{ flex: 1, marginLeft: 4 }}><Skeleton width="64%" height={12} /><Skeleton width="35%" height={9} style={{ marginTop: 5 }} /></View><Skeleton width={42} height={12} /></View>) : visibleTests.map((test) => {
                const on = selected.includes(test._id);
                return (
                  <TouchableOpacity key={test._id} style={[styles.testRow, on && { backgroundColor: '#F2F7FF' }]} onPress={() => toggleTest(test._id)}>
                    <View style={[styles.checkbox, on && { backgroundColor: C.primary, borderColor: C.primary }]}>
                      {on && <MaterialCommunityIcons name="check" size={12} color="#fff" />}
                    </View>
                    <View style={{ flex: 1, marginLeft: 4 }}>
                      <T style={styles.testName}>{test.name}</T>
                      <T style={styles.testCat}>{test.category || test.group || 'Pathology'}</T>
                    </View>
                    <T style={styles.testPrice}>₹{test.price}</T>
                    <MaterialCommunityIcons name="information-outline" size={16} color={C.primary} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                );
              })}
              {!loading && !visibleTests.length ? <T style={styles.selMeta}>{testSearch ? 'No matching tests found' : 'No tests are configured'}</T> : null}
              {loadError ? <T style={[styles.selMeta, { color: C.red }]}>{loadError}</T> : null}
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
                <T style={styles.dateText}>{displayDate(now)}</T>
                <T style={styles.dateText}>{displayTime(now)}</T>
              </View>
              <T style={[styles.dateLabel, { marginTop: 8 }]}>Expected Report Date</T>
              <View style={styles.dateBox}>
                <MaterialCommunityIcons name="calendar-month-outline" size={15} color={C.primary} />
                <T style={styles.dateText}>{displayDate(now)}</T>
                <T style={styles.dateText}>{displayTime(now)}</T>
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

            <TouchableOpacity
              style={[styles.payOnlineBtn, payingOnline && { opacity: 0.6 }]}
              onPress={startOnlinePayment}
              disabled={payingOnline || payable <= 0}
              accessibilityRole="button"
            >
              {payingOnline ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="qrcode-scan" size={16} color="#fff" />
                  <T style={styles.payOnlineText}>Pay ₹{payable} via {payMode}</T>
                </>
              )}
            </TouchableOpacity>
            {paymentRef ? (
              <T style={styles.paidRef}>Paid · Ref: {paymentRef}</T>
            ) : null}
          </Card>

          <PrimaryBtn label="Create Report" icon="file-document-outline" style={{ marginTop: 8 }} onPress={() => {
            if (!patient) toast({ kind: 'warning', title: 'Select patient', message: 'Select a patient before continuing.' });
            else if (!selectedTests.length) toast({ kind: 'warning', title: 'Select test', message: 'Select at least one test or package.' });
            else setStep(2);
          }} />
        </View>
      )}

      {step === 2 && (
        <View style={styles.body}>
          <Card style={{ marginTop: 8, padding: 10 }}>
            <View style={styles.summaryPatient}>
              <Avatar initials={initials(patient?.name)} tone="blue" size={40} />
              <View style={styles.summaryPatientDetails}>
                <T style={styles.selName}>{patient?.name || 'No patient selected'}</T>
                <T style={styles.selMeta}>
                  {patient?.age || '—'} Yrs &nbsp;|&nbsp; {patient?.gender || '—'} &nbsp;|&nbsp; {patient?.blood || '—'}
                </T>
                <T style={styles.selPid}>PID: {patient?.pid || '—'}</T>
              </View>
            </View>

            <View style={styles.summaryTest}>
              <T style={styles.sumLbl}>Test / Package</T>
              <T style={styles.sumVal}>{selectedTests.map((test) => test.name).join(', ') || '—'}</T>
              <T style={styles.sumSub}>{selectedTests.map((test) => test.category || test.group).filter(Boolean).join(', ') || 'Pathology'}</T>
            </View>

            <View style={styles.summaryDetailsRow}>
              <View style={styles.summaryDetailCell}>
                <T style={styles.sumLbl}>Ref. Doctor</T>
                <T style={styles.sumVal}>{doctor?.name || 'Direct'}</T>
              </View>
              <View style={[styles.summaryDetailCell, styles.summaryDetailDivider]}>
                <T style={styles.sumLbl}>Report Date</T>
                <T style={styles.sumVal}>{displayDate(now)}</T>
                <T style={styles.sumSub}>{displayTime(now)}</T>
              </View>
            </View>
          </Card>

          <Card style={{ marginTop: 8 }}>
            <T style={styles.cardHeadTitle}>Enter Test Values</T>
            <View style={styles.valuesToolbar}>
              <View style={styles.parameterSearch}>
                <SearchBar placeholder="Search parameter" value={parameterSearch} onChangeText={setParameterSearch} />
              </View>
              <View style={styles.valuesActions}>
                <View style={styles.rangeControl}>
                  <T style={styles.rangeToggleLabel}>Show Normal Range</T>
                  <Switch value={showRange} onValueChange={setShowRange} trackColor={{ true: C.primary, false: '#D5DBE6' }} thumbColor="#fff" />
                </View>
                <SmallOutlineBtn icon="calculator" label="Auto Calculate" />
              </View>
            </View>

            {visibleParameterGroups.map((group) => (
              <View key={`${group.test._id}:${group.title}`}>
                <View style={styles.groupHead}>
                  <T style={styles.groupHeadText}>{group.title}</T>
                </View>
                <View style={styles.tblHead}>
                  <T style={[styles.tblHeadText, { flex: 1.3 }]}>Test Name</T>
                  <T style={[styles.tblHeadText, styles.resultColumn]}>Result</T>
                  <T style={[styles.tblHeadText, { flex: 0.7 }]}>Unit</T>
                  <T style={[styles.tblHeadText, { flex: 1 }]}>{showRange ? 'Reference Range' : 'Range'}</T>
                </View>
                {group.params.map((parameter, index) => {
                  const key = parameterKey(group.test, parameter);
                  const flag = valueFlag(values[key] || '', parameter.range);
                  return <View key={key} style={[styles.tblRow, index % 2 === 1 && { backgroundColor: '#FAFBFE' }]}>
                    <T style={[styles.tblName, { flex: 1.3 }]} numberOfLines={1}>{parameter.name}</T>
                    <View style={styles.resultColumn}>
                      <TextInput
                        style={styles.valInput}
                        value={values[key] || ''}
                        onChangeText={(value) => setValues((current) => ({ ...current, [key]: value }))}
                        placeholder="—"
                        placeholderTextColor={C.faint}
                      />
                    </View>
                    <T style={[styles.tblUnit, { flex: 0.7 }]}>{parameter.unit || '—'}</T>
                    <View style={[styles.row, { flex: 1, justifyContent: 'space-between' }]}>
                      <T style={styles.tblRange}>{showRange ? parameter.range || '—' : ''}</T>
                      {flag ? <View style={styles.row}><T style={styles.flag}>{flag}</T><MaterialCommunityIcons name="information-outline" size={13} color={C.primary} style={{ marginLeft: 4 }} /></View> : null}
                    </View>
                  </View>;
                })}
              </View>
            ))}
            {!visibleParameterGroups.length ? <T style={styles.selMeta}>{parameterSearch ? 'No matching parameters found' : 'The selected test has no configured parameters'}</T> : null}

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
                <Avatar initials={initials(patient?.name)} tone="blue" size={34} />
              </View>
              <View style={{ flex: 1, marginLeft: 4 }}>
                <T style={styles.sumLbl}>Patient</T>
                <T style={styles.selName}>{patient?.name || '—'}</T>
                <T style={styles.selMeta}>{patient?.age || '—'} Yrs &nbsp;|&nbsp; {patient?.gender || '—'} &nbsp;|&nbsp; {patient?.blood || '—'}</T>
                <T style={styles.selPid}>PID: {patient?.pid || '—'}</T>
              </View>
              <View style={styles.row}>
                <MaterialCommunityIcons name="phone" size={12} color={C.sub} style={{ marginRight: 4 }} />
                <T style={styles.selPhone}>{patient?.mobile || '—'}</T>
              </View>
            </View>
            <View style={[styles.prevRow, { borderBottomWidth: 1, borderBottomColor: C.borderSoft }]}>
              <View style={styles.prevIcon}>
                <MaterialCommunityIcons name="doctor" size={17} color={C.green} />
              </View>
              <View style={{ flex: 1, marginLeft: 4 }}>
                <T style={styles.sumLbl}>Ref. Doctor</T>
                <T style={styles.selName}>{doctor?.name || 'Direct'}</T>
                <T style={styles.selMeta}>{doctor?.degree || 'No referring doctor'}</T>
              </View>
              {doctor?.mobile ? <View style={styles.row}>
                <MaterialCommunityIcons name="phone" size={12} color={C.sub} style={{ marginRight: 4 }} />
                <T style={styles.selPhone}>{doctor.mobile}</T>
              </View> : null}
            </View>
            <View style={[styles.prevRow, { borderBottomWidth: 1, borderBottomColor: C.borderSoft }]}>
              <View style={styles.prevIcon}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={17} color={C.purple} />
              </View>
              <View style={{ flex: 1, marginLeft: 4 }}>
                <T style={styles.sumLbl}>Test / Package</T>
                <T style={styles.selName}>{selectedTests.map((test) => test.name).join(', ') || '—'}</T>
                <T style={styles.selMeta}>{selectedTests.map((test) => test.category || test.group).filter(Boolean).join(', ') || 'Pathology'}</T>
              </View>
            </View>
            <View style={styles.prevRow}>
              <View style={styles.prevIcon}>
                <MaterialCommunityIcons name="calendar-month-outline" size={17} color={C.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 4 }}>
                <T style={styles.sumLbl}>Report Date</T>
                <T style={styles.selMeta}>
                  <T style={{ color: C.text, fontWeight: '700' }}>{displayDate(now)}</T> &nbsp;|&nbsp;{' '}
                  <T style={{ color: C.text, fontWeight: '700' }}>{displayTime(now)}</T>
                </T>
              </View>
            </View>
          </Card>

          <Card style={{ marginTop: 8 }}>
            <T style={styles.cardHeadTitle}>Test Summary</T>
            <View style={styles.tsRow}>
              <T style={styles.tsLabel}>Total Parameters</T>
              <T style={styles.tsValue}>{resultSummary.total}</T>
            </View>
            <View style={styles.tsRow}>
              <T style={styles.tsLabel}>Normal</T>
              <T style={[styles.tsValue, { color: C.green }]}>{resultSummary.normal}</T>
            </View>
            <View style={styles.tsRow}>
              <T style={styles.tsLabel}>High</T>
              <T style={[styles.tsValue, { color: C.red }]}>{resultSummary.high}</T>
            </View>
            <View style={styles.tsRow}>
              <T style={styles.tsLabel}>Low</T>
              <T style={[styles.tsValue, { color: C.red }]}>{resultSummary.low}</T>
            </View>
            <View style={styles.tsRow}>
              <T style={styles.tsLabel}>Remarks</T>
              <T style={styles.tsValue}>{remarks.trim() ? 'Yes' : 'No'}</T>
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
            {parameterGroups.map((group) => (
              <View key={`${group.test._id}:${group.title}`}>
                <T style={styles.pvGroup}>{group.title}</T>
                {group.params.map((parameter) => {
                  const key = parameterKey(group.test, parameter);
                  const flag = valueFlag(values[key] || '', parameter.range);
                  return <View key={key} style={styles.tblRow}>
                    <T style={[styles.tblName, { flex: 1.3 }]} numberOfLines={1}>{parameter.name}</T>
                    <T style={[styles.tblUnit, { flex: 0.7 }]}>{values[key] || '—'}</T>
                    <T style={[styles.tblUnit, { flex: 0.7 }]}>{parameter.unit || '—'}</T>
                    <T style={[styles.tblUnit, { flex: 0.9 }]} numberOfLines={1}>{parameter.range || '—'}</T>
                    <View style={{ width: 44, alignItems: 'center' }}>
                      {flag ? <T style={styles.arrow}>{flag === 'H' ? '↑' : '↓'}</T> : <View style={styles.dotOk} />}
                    </View>
                  </View>;
                })}
              </View>
            ))}
          </Card>

          <View style={styles.btnRow}>
            <OutlineBtn label="Back" icon="arrow-left" onPress={() => setStep(2)} style={{ flex: 1 }} />
            <PrimaryBtn label="Save Report" icon="file-document-outline" busy={saving} onPress={saveReport} style={{ flex: 1.6, marginLeft: 4 }} />
          </View>

          <View style={styles.safeNote}>
            <MaterialCommunityIcons name="lock-outline" size={16} color={C.primary} />
            <View style={{ marginLeft: 4 }}>
              <T style={styles.safeNoteTitle}>Your data is safe and secure</T>
              <T style={styles.safeNoteSub}>All report data is stored securely in your account.</T>
            </View>
          </View>
        </View>
      )}

      {/* Native (Expo Go) Razorpay checkout — a WebView hosts checkout.js. */}
      {razorpayOrder ? (
        <Modal visible transparent animationType="slide" onRequestClose={() => { setRazorpayOrder(null); setPayingOnline(false); }}>
          <View style={styles.rzHost}>
            <View style={styles.rzBar}>
              <T style={styles.rzTitle}>Pay ₹{payable} via {payMode}</T>
              <TouchableOpacity
                onPress={() => { setRazorpayOrder(null); setPayingOnline(false); }}
                style={styles.rzClose}
                accessibilityLabel="Cancel payment"
              >
                <MaterialCommunityIcons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <RazorpayCheckout
              options={{
                keyId: razorpayOrder.keyId,
                orderId: razorpayOrder.orderId,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'PathoNexa Lab',
                description: 'Report payment',
                prefill: { name: patient?.name, contact: patient?.mobile },
              }}
              onSuccess={(result) => {
                verifyOnlinePayment(result)
                  .catch((error) => toast({ kind: 'error', title: 'Verification failed', message: error instanceof Error ? error.message : 'Unable to verify the payment.' }))
                  .finally(() => { setRazorpayOrder(null); setPayingOnline(false); });
              }}
              onClose={(error) => {
                setRazorpayOrder(null);
                setPayingOnline(false);
                if (error) toast({ kind: 'error', title: 'Payment failed', message: error });
              }}
            />
          </View>
        </Modal>
      ) : null}
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
  payOnlineBtn: {
    marginTop: 10,
    minHeight: 42,
    borderRadius: 4,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  payOnlineText: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
  paidRef: { marginTop: 8, color: C.green, fontSize: 10.5, fontWeight: '600' },
  rzHost: { flex: 1, backgroundColor: C.headerTop },
  rzBar: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rzTitle: { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1 },
  rzClose: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  btnRow: { flexDirection: 'row', marginTop: 8 },
  summaryPatient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
  },
  summaryPatientDetails: { flex: 1, minWidth: 0, marginLeft: 4 },
  summaryTest: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  summaryDetailsRow: { flexDirection: 'row' },
  summaryDetailCell: { flex: 1, minWidth: 0, paddingTop: 8, paddingHorizontal: 4 },
  summaryDetailDivider: { borderLeftWidth: 1, borderLeftColor: C.borderSoft },
  sumLbl: { fontSize: 9.5, color: C.faint },
  sumVal: { fontSize: 11, fontWeight: '700', color: C.text, marginTop: 2 },
  sumSub: { fontSize: 9.5, color: C.faint, marginTop: 1 },
  valuesToolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 8 },
  parameterSearch: { flexBasis: 160, flexGrow: 1, minWidth: 150 },
  valuesActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4, flexGrow: 1 },
  rangeControl: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rangeToggleLabel: { fontSize: 11, color: C.text, fontWeight: '600' },
  groupHead: { backgroundColor: '#EFF4FC', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6 },
  groupHeadText: { color: C.primary, fontSize: 11.5, fontWeight: '700' },
  tblHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingTop: 6, paddingBottom: 4 },
  tblHeadText: { fontSize: 9.5, color: C.faint, fontWeight: '700' },
  tblRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 4 },
  tblName: { fontSize: 11, color: C.text, fontWeight: '600' },
  tblUnit: { fontSize: 10, color: C.sub },
  tblRange: { fontSize: 10, color: C.sub },
  resultColumn: { width: 64 },
  valInput: {
    height: 28,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    fontSize: 11,
    color: C.text,
    paddingHorizontal: 6,
    paddingVertical: 0,
    textAlignVertical: 'center',
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
