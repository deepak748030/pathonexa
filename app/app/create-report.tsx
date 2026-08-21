import React from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, ScrollView, Switch,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft, Plus, Phone, ChevronDown, FileText, Check, Banknote,
  Smartphone, CreditCard, Building2, Circle, Search, Sparkles,
} from 'lucide-react-native';
import ScreenHeader, { HeaderPill } from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import Avatar from '@/components/Avatar';
import SearchBar from '@/components/SearchBar';
import PrimaryButton from '@/components/PrimaryButton';
import { Card, FadeIn, EmptyState } from '@/components/UI';
import { colors, fonts, radius, shadow } from '@/lib/theme';
import { tests as localTests, doctors as localDoctors, packages as localPackages } from '@/lib/labData';
import { endpoints } from '@/lib/api';
import { inr, displayMobile, todayLabel, timeLabel, digitsOnly } from '@/lib/format';
import {
  paramsForTest, paramsForTests, applyFlags, groupParams, paramSummary, type ParamRow,
} from '@/lib/testParams';
import Field from '@/components/Field';
import { useSettings } from '@/lib/settings';
import { useAuth } from '@/lib/auth';
import { buildReportHtml } from '@/lib/reportHtml';
import { printHtml } from '@/lib/share';

type Step = 1 | 2 | 3;
const STEPS = ['Patient & Test', 'Report Values', 'Preview & Save'];

export default function CreateReport() {
  const params = useLocalSearchParams<{ patientId?: string; editId?: string }>();
  const settings = useSettings((s) => s.settings);
  const loadSettings = useSettings((s) => s.load);
  const user = useAuth((s) => s.user);
  const [step, setStep] = React.useState<Step>(1);
  const [loading, setLoading] = React.useState(false);
  const [patients, setPatients] = React.useState<any[]>([]);
  const [tests, setTests] = React.useState<any[]>(localTests);
  const [doctors, setDoctors] = React.useState<any[]>(localDoctors);
  const [packs, setPacks] = React.useState<any[]>(localPackages);
  const [drafts, setDrafts] = React.useState<any[]>([]);
  const [technician, setTechnician] = React.useState('');
  const [editId, setEditId] = React.useState<string | undefined>(undefined);
  const [selectedPackage, setSelectedPackage] = React.useState<any>(null);
  const [selectedPatient, setSelectedPatient] = React.useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = React.useState<any>(null);
  const [selectedTests, setSelectedTests] = React.useState<any[]>([]);
  const [tab, setTab] = React.useState<'all' | 'pkg' | 'recent'>('all');
  const [pq, setPq] = React.useState('');
  const [tq, setTq] = React.useState('');
  const [discount, setDiscount] = React.useState('0');
  const [paidAmt, setPaidAmt] = React.useState('');
  const [mode, setMode] = React.useState('Cash');
  const [sampleDate, setSampleDate] = React.useState(`${todayLabel()}  ${timeLabel()}`);
  const [reportDate, setReportDate] = React.useState(`${todayLabel()}  ${timeLabel()}`);
  const [values, setValues] = React.useState<ParamRow[]>([]);
  const [showRange, setShowRange] = React.useState(true);
  const [pqOpen, setPqOpen] = React.useState(false);
  const [remarks, setRemarks] = React.useState('');

  React.useEffect(() => {
    (async () => {
      loadSettings();
      try {
        const [p, t, d, pk, dr] = await Promise.all([
          endpoints.patients.getAll(),
          endpoints.meta.tests(),
          endpoints.meta.doctors(),
          endpoints.meta.packages().catch(() => []),
          endpoints.meta.list('drafts').catch(() => []),
        ]);
        setPatients(Array.isArray(p) ? p : []);
        if (t?.length) setTests(t);
        if (d?.length) setDoctors(d);
        if (pk?.length) setPacks(pk);
        setDrafts(Array.isArray(dr) ? dr : []);
      } catch {
        setPatients([]);
      }
      setTechnician((prev) => prev || user?.name || '');
    })();
  }, [loadSettings, user?.name]);

  /* Edit mode — open an existing report and continue at the values step. */
  React.useEffect(() => {
    if (!params.editId) return;
    (async () => {
      try {
        const r = await endpoints.reports.getById(String(params.editId));
        setEditId(String(r._id || r.id));
        setSelectedPatient(r.patient);
        setSelectedDoctor({ name: r.doctor });
        setSelectedTests((r.tests || []).length ? r.tests : [{ name: r.test, price: r.amount, id: 'existing' }]);
        setValues(applyFlags(r.values || paramsForTest(r.test || '')));
        setDiscount(String(r.discount || 0));
        setPaidAmt(String(r.paidAmount ?? ''));
        setMode(r.paymentMode || 'Cash');
        setTechnician(r.technician || '');
        setRemarks(r.remarks || '');
        if (r.sampleDate) setSampleDate(r.sampleDate);
        if (r.reportDate) setReportDate(r.reportDate);
        setStep(2);
      } catch (e: any) {
        alert(e?.message || 'Could not open the report for editing');
      }
    })();
  }, [params.editId]);

  React.useEffect(() => {
    if (!params.patientId || !patients.length) return;
    const p = patients.find((x) => (x._id || x.id) === params.patientId);
    if (p) setSelectedPatient(p);
  }, [params.patientId, patients]);

  const total = selectedTests.reduce((s, t) => s + Number(t.price || 0), 0);
  const disc = Math.min(total, Number(discount || 0));
  const payable = Math.max(0, total - disc);
  const paid = Math.min(payable, Number(paidAmt === '' ? (mode ? payable : 0) : paidAmt));
  const pending = Math.max(0, payable - paid);
  const testName = selectedTests.map((t) => t.name).join(', ') || 'Investigation';

  const goStep2 = () => {
    if (!selectedPatient || !selectedTests.length) {
      alert('Please select a patient and at least one test');
      return;
    }
    // Parameters come from the Test Master, with the male / female / child
    // reference range that applies to this patient.
    const rows = paramsForTests(selectedTests, selectedPatient);
    setValues(rows.length ? rows : paramsForTest(selectedTests[0].name));
    if (paidAmt === '') setPaidAmt(String(payable));
    setStep(2);
  };

  /** Saves the current work as a draft so it can be resumed later. */
  const saveDraft = async () => {
    if (!selectedPatient) return alert('Select a patient before saving a draft');
    try {
      await endpoints.meta.create('drafts', {
        patient: selectedPatient.name,
        patientId: selectedPatient._id || selectedPatient.id,
        doctor: selectedDoctor?.name || 'Direct',
        test: testName,
        tests: selectedTests.map((t) => t.name),
        amount: payable,
        values,
        technician,
        remarks,
        savedAt: new Date().toISOString(),
      });
      const dr = await endpoints.meta.list('drafts');
      setDrafts(Array.isArray(dr) ? dr : []);
      alert('Draft saved');
    } catch (e: any) {
      alert(e?.message || 'Could not save the draft');
    }
  };

  /** Package selection expands into its individual tests. */
  const choosePackage = (pkg: any) => {
    const names: string[] = pkg.tests || [];
    const expanded = names
      .map((n) => tests.find((t) => t.name === n) || { name: n, price: 0, id: n })
      .filter(Boolean);
    setSelectedPackage(pkg);
    setSelectedTests(expanded.length ? expanded.map((t, i) => (i === 0 ? { ...t, price: pkg.price } : { ...t, price: 0 })) : [pkg]);
  };

  const setVal = (name: string, value: string) => {
    setValues((rows) => applyFlags(rows.map((r) => (r.name === name ? { ...r, value } : r))));
  };

  const summary = paramSummary(values);

  const handleCreate = async () => {
    if (!selectedPatient) return;
    setLoading(true);
    try {
      const needsVerification = settings.ownerVerification && summary.complete;
      const payload = {
        patient: selectedPatient._id || selectedPatient.id,
        test: testName,
        tests: selectedTests.map((t) => t.name),
        package: selectedPackage?.name || '',
        doctor: selectedDoctor?.name || 'Direct',
        date: todayLabel(),
        time: timeLabel(),
        sampleDate,
        reportDate,
        technician,
        amount: payable,
        discount: disc,
        paidAmount: paid,
        pendingAmount: pending,
        paymentMode: mode,
        paid: pending === 0,
        status: summary.complete && !needsVerification ? 'Completed' : 'Pending',
        values,
        remarks,
        color: selectedPatient.color || '#DBEAFE',
      };

      const saved = editId
        ? await endpoints.reports.update(editId, payload)
        : await endpoints.reports.create(payload);

      if (settings.autoPrint) {
        // Auto-print keeps the receptionist workflow one tap shorter.
        printHtml(buildReportHtml({ ...saved, patient: selectedPatient }, values, settings)).catch(() => {});
      }
      router.replace({ pathname: '/report-preview', params: { id: saved?._id || saved?.id } } as any);
    } catch (e: any) {
      alert(e?.message || 'Failed to save report. Check the server connection.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const q = pq.toLowerCase().trim();
    if (!q) return true;
    return `${p.name} ${p.pid} ${p.mobile}`.toLowerCase().includes(q);
  });

  const catalog = tab === 'pkg'
    ? packs.map((p) => ({ ...p, group: `Package · ${(p.tests || []).length} tests`, price: p.price }))
    : tab === 'recent'
      ? tests.slice(0, 5)
      : tests;
  const filteredTests = catalog.filter((t) => (t.name || '').toLowerCase().includes(tq.toLowerCase()));

  return (
    <AppScreen
      keyboard
      header={
        <ScreenHeader
          title="Create Report"
          subtitle={`Step ${step} of 3 · ${STEPS[step - 1]}`}
          left={<ChevronLeft size={24} color="#FFFFFF" />}
          onLeftPress={() => (step > 1 ? setStep((s) => (s - 1) as Step) : router.back())}
          right={
            <HeaderPill onPress={saveDraft}>
              <FileText size={13} color="#fff" />
              <Text style={{ color: '#fff', fontFamily: fonts.semibold, fontSize: 12 }}>
                Drafts ({drafts.length})
              </Text>
            </HeaderPill>
          }
        />
      }
      footer={
        <View style={styles.footer}>
          {step === 1 && (
            <PrimaryButton title="Create Report  →" onPress={goStep2} icon={<FileText size={16} color="#fff" />} />
          )}
          {step === 2 && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 0.8 }}><PrimaryButton title="← Back" ghost onPress={() => setStep(1)} /></View>
              <View style={{ flex: 1.4 }}><PrimaryButton title="Save & Preview  →" onPress={() => setStep(3)} /></View>
            </View>
          )}
          {step === 3 && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 0.8 }}><PrimaryButton title="← Back" ghost onPress={() => setStep(2)} /></View>
              <View style={{ flex: 1.4 }}><PrimaryButton title="Save Report  →" onPress={handleCreate} loading={loading} /></View>
            </View>
          )}
        </View>
      }
    >
      <Stepper step={step} />

      {step === 1 && (
        <FadeIn>
          {/* 1. Patient */}
          <Card style={{ marginBottom: 12 }}>
            <View style={styles.secHead}>
              <Text style={styles.secTitle}>1. Select Patient</Text>
              <Pressable onPress={() => router.push('/add-patient')} style={styles.linkBtn}>
                <Plus size={13} color={colors.primary} />
                <Text style={styles.link}>New Patient</Text>
              </Pressable>
            </View>
            {selectedPatient ? (
              <Pressable style={styles.picked} onPress={() => setPqOpen((v) => !v)}>
                <Avatar name={selectedPatient.name} color={selectedPatient.color} size={42} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pName}>{selectedPatient.name}</Text>
                  <Text style={styles.pMeta}>{selectedPatient.age} Yrs  |  {selectedPatient.gender}  |  {selectedPatient.blood || '—'}</Text>
                  <Text style={styles.pMeta}>PID: {selectedPatient.pid}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={styles.phoneRow}><Phone size={12} color={colors.mutedForeground} /><Text style={styles.pMeta}>{selectedPatient.mobile}</Text></View>
                  <ChevronDown size={16} color={colors.mutedForeground} />
                </View>
              </Pressable>
            ) : null}
            <View style={{ marginTop: 8 }}>
              <SearchBar value={pq} onChangeText={(t) => { setPq(t); setPqOpen(true); }} placeholder="Search by Name, Mobile or Patient ID" />
            </View>
            {(pqOpen || !selectedPatient) && (
              <View style={styles.drop}>
                {filteredPatients.length === 0 ? (
                  <EmptyState title="No patient found" subtitle="Add a new patient first." />
                ) : filteredPatients.slice(0, 6).map((p) => (
                  <Pressable key={p._id || p.id} style={styles.dropRow} onPress={() => { setSelectedPatient(p); setPq(''); setPqOpen(false); }}>
                    <Avatar name={p.name} color={p.color} size={32} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pName}>{p.name}</Text>
                      <Text style={styles.pMeta}>{p.pid} · {p.mobile}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </Card>

          {/* 2. Doctor */}
          <Card style={{ marginBottom: 12 }}>
            <View style={styles.secHead}>
              <Text style={styles.secTitle}>2. Select Ref. Doctor</Text>
              <Pressable onPress={() => router.push('/manage/doctors' as any)} style={styles.linkBtn}>
                <Plus size={13} color={colors.primary} />
                <Text style={styles.link}>New Doctor</Text>
              </Pressable>
            </View>
            {doctors.map((d) => {
              const on = (selectedDoctor?._id || selectedDoctor?.id) === (d._id || d.id);
              return (
                <Pressable key={d._id || d.id} style={[styles.picked, on && styles.pickedOn, { marginBottom: 8 }]} onPress={() => setSelectedDoctor(d)}>
                  <Avatar name={d.name} color="#DCFCE7" size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pName}>{d.name}</Text>
                    <Text style={styles.pMeta}>{d.degree}</Text>
                    <Text style={[styles.pMeta, { color: colors.green }]}>Commission: {d.commission}%</Text>
                  </View>
                  <Text style={styles.pMeta}>{d.mobile}</Text>
                  <ChevronDown size={14} color={colors.mutedForeground} />
                </Pressable>
              );
            })}
          </Card>

          {/* 3. Tests */}
          <Card style={{ marginBottom: 12 }}>
            <Text style={styles.secTitle}>3. Select Test / Package</Text>
            <View style={styles.tabs}>
              {([['all', 'All Tests'], ['pkg', 'Packages'], ['recent', 'Recent Tests']] as const).map(([id, label]) => (
                <Pressable key={id} onPress={() => setTab(id)} style={[styles.tab, tab === id && styles.tabOn]}>
                  <Text style={[styles.tabTxt, tab === id && styles.tabTxtOn]}>{label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ marginVertical: 8 }}>
              <SearchBar value={tq} onChangeText={setTq} placeholder="Search test or package name" />
            </View>
            {filteredTests.map((t) => {
              const on = selectedTests.some((x) => (x._id || x.id) === (t._id || t.id));
              return (
                <Pressable
                  key={t._id || t.id}
                  style={styles.testRow}
                  onPress={() => {
                    if (tab === 'pkg') { choosePackage(t); return; }
                    setSelectedPackage(null);
                    setSelectedTests((cur) => (on ? cur.filter((x) => (x._id || x.id) !== (t._id || t.id)) : [...cur, t]));
                  }}
                >
                  <View style={[styles.check, on && styles.checkOn]}>{on && <Check size={12} color="#fff" strokeWidth={3} />}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pName}>{t.name}</Text>
                    <Text style={styles.pMeta}>{t.group || 'Test'}</Text>
                  </View>
                  <Text style={styles.price}>{inr(t.price)}</Text>
                </Pressable>
              );
            })}
            <Pressable style={styles.addMore}><Plus size={14} color={colors.primary} /><Text style={styles.link}>Add More Tests</Text></Pressable>
          </Card>

          {/* 4 + 5 */}
          <View style={styles.split}>
            <Card style={{ flex: 1 }}>
              <Text style={styles.secTitle}>4. Sample & Report Date</Text>
              <Text style={styles.mini}>Sample Collection Date</Text>
              <Text style={styles.dateVal}>{sampleDate}</Text>
              <Text style={[styles.mini, { marginTop: 10 }]}>Expected Report Date</Text>
              <Text style={styles.dateVal}>{reportDate}</Text>
            </Card>
            <Card style={{ flex: 1.15 }}>
              <Text style={styles.secTitle}>5. Amount Details</Text>
              <Amt label="Total Amount" value={inr(total)} />
              <View style={styles.amtRow}>
                <Text style={styles.amtL}>Discount</Text>
                <TextInput
                  style={styles.amtIn}
                  value={discount}
                  keyboardType="number-pad"
                  onChangeText={(t) => setDiscount(digitsOnly(t, 6))}
                />
              </View>
              <Amt label="Tax (0%)" value="₹0" />
              <Amt label="Payable Amount" value={inr(payable)} bold />
              <View style={styles.amtRow}>
                <Text style={styles.amtL}>Paid Amount</Text>
                <TextInput
                  style={styles.amtIn}
                  value={paidAmt}
                  keyboardType="number-pad"
                  onChangeText={(t) => setPaidAmt(digitsOnly(t, 7))}
                />
              </View>
              <Amt label="Pending Amount" value={inr(pending)} color={pending ? colors.red : colors.green} />
            </Card>
          </View>

          <Card style={{ marginTop: 12 }}>
            <Text style={styles.secTitle}>Payment Mode</Text>
            <View style={styles.modes}>
              {[
                { id: 'Cash', Icon: Banknote },
                { id: 'UPI', Icon: Smartphone },
                { id: 'Card', Icon: CreditCard },
                { id: 'Bank Transfer', Icon: Building2 },
                { id: 'Other', Icon: Circle },
              ].map((m) => (
                <Pressable key={m.id} style={[styles.mode, mode === m.id && styles.modeOn]} onPress={() => setMode(m.id)}>
                  <m.Icon size={14} color={mode === m.id ? colors.primary : colors.mutedForeground} />
                  <Text style={[styles.modeTxt, mode === m.id && { color: colors.primary }]}>{m.id}</Text>
                </Pressable>
              ))}
            </View>
          </Card>
        </FadeIn>
      )}

      {step === 2 && (
        <FadeIn>
          <Card style={styles.summaryBar}>
            <Avatar name={selectedPatient?.name} color={selectedPatient?.color} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.pName}>{selectedPatient?.name}</Text>
              <Text style={styles.pMeta}>{selectedPatient?.age} Yrs  |  {selectedPatient?.gender}  |  {selectedPatient?.blood}</Text>
              <Text style={styles.pMeta}>PID: {selectedPatient?.pid}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.mini}>Test / Package</Text>
              <Text style={styles.pName} numberOfLines={2}>{testName}</Text>
            </View>
            <View style={{ width: 90 }}>
              <Text style={styles.mini}>Ref. Doctor</Text>
              <Text style={styles.pName} numberOfLines={2}>{selectedDoctor?.name || 'Direct'}</Text>
            </View>
          </Card>

          <View style={styles.valHead}>
            <Text style={styles.secTitle}>Enter Test Values</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={styles.mini}>Show Normal Range</Text>
              <Switch value={showRange} onValueChange={setShowRange} trackColor={{ true: colors.primary }} />
              <Pressable
                style={styles.autoBtn}
                onPress={() => setValues(applyFlags(paramsForTests(selectedTests, selectedPatient)))}
              >
                <Sparkles size={13} color={colors.primary} />
                <Text style={styles.link}>Auto Calculate</Text>
              </Pressable>
            </View>
          </View>
          <SearchBar value={tq} onChangeText={setTq} placeholder="Search parameter" />

          {groupParams(values.filter((r) => r.name.toLowerCase().includes(tq.toLowerCase()))).map((g) => (
            <Card key={g.group} style={{ padding: 0, marginTop: 12 }}>
              <Text style={styles.group}>{g.group}</Text>
              <View style={styles.th}>
                <Text style={[styles.thT, { flex: 1.6 }]}>Test Name</Text>
                <Text style={[styles.thT, { width: 72 }]}>Result</Text>
                <Text style={[styles.thT, { width: 56 }]}>Unit</Text>
                {showRange && <Text style={[styles.thT, { width: 78 }]}>Reference Range</Text>}
              </View>
              {g.rows.map((r) => (
                <View key={r.name} style={styles.tr}>
                  <Text style={[styles.td, { flex: 1.6 }]}>{r.name}</Text>
                  <TextInput
                    style={[styles.resIn, r.flag === 'H' && { borderColor: colors.red }, r.flag === 'L' && { borderColor: colors.orange }]}
                    value={r.value}
                    keyboardType="decimal-pad"
                    onChangeText={(t) => setVal(r.name, t.replace(/[^0-9.]/g, '').slice(0, 8))}
                  />
                  <Text style={[styles.td, { width: 56 }]}>{r.unit}</Text>
                  {showRange && (
                    <View style={{ width: 78, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={styles.td}>{r.range}</Text>
                      {!!r.flag && (
                        <Text style={[styles.flag, { color: r.flag === 'H' ? colors.red : colors.orange }]}>{r.flag}</Text>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </Card>
          ))}

          <Card style={{ marginTop: 12 }}>
            <Field
              label="Technician name"
              value={technician}
              onChangeText={setTechnician}
              placeholder="Who performed this test?"
            />
          </Card>

          <Card style={{ marginTop: 12 }}>
            <Text style={styles.mini}>Technologist / Remarks (Optional)</Text>
            <TextInput
              style={styles.remarks}
              value={remarks}
              onChangeText={(t) => setRemarks(t.slice(0, 200))}
              placeholder="Add any notes or remarks here..."
              placeholderTextColor={colors.placeholder}
              multiline
            />
            <Text style={styles.counter}>{remarks.length}/200</Text>
          </Card>

          {summary.complete && (
            <View style={styles.okBox}>
              <Check size={14} color={colors.green} />
              <Text style={styles.okTxt}>All values entered. Please review and proceed to preview.</Text>
            </View>
          )}
        </FadeIn>
      )}

      {step === 3 && (
        <FadeIn>
          <Card>
            <Text style={styles.secTitle}>Report Summary</Text>
            <SumRow k="Patient" v={`${selectedPatient?.name}\n${selectedPatient?.age} Yrs  |  ${selectedPatient?.gender}  |  ${selectedPatient?.blood}\nPID: ${selectedPatient?.pid}`} />
            <SumRow k="Ref. Doctor" v={`${selectedDoctor?.name || 'Direct'}\n${selectedDoctor?.degree || ''}`} />
            <SumRow k="Test / Package" v={testName} />
            <SumRow k="Report Date" v={`${todayLabel()}  |  ${timeLabel()}`} />
            <SumRow k="Technician" v={technician || '—'} />
            <SumRow k="Payment" v={`${mode}  |  Paid ${inr(paid)}  |  Pending ${inr(pending)}`} />
          </Card>
          <Card style={{ marginTop: 12 }}>
            <Text style={styles.secTitle}>Test Summary</Text>
            <View style={styles.sumGrid}>
              <SumStat label="Total Parameters" value={String(summary.total)} />
              <SumStat label="Normal" value={String(summary.normal)} color={colors.green} />
              <SumStat label="High" value={String(summary.high)} color={colors.red} />
              <SumStat label="Low" value={String(summary.low)} color={colors.orange} />
              <SumStat label="Critical" value={String(summary.critical)} color={colors.red} />
            </View>
          </Card>
          <Card style={{ marginTop: 12, padding: 0 }}>
            <Text style={[styles.secTitle, { padding: 14, paddingBottom: 6 }]}>Values Preview</Text>
            {groupParams(values).map((g) => (
              <View key={g.group}>
                <Text style={styles.group}>{g.group}</Text>
                {g.rows.map((r) => (
                  <View key={r.name} style={styles.tr}>
                    <Text style={[styles.td, { flex: 1.4 }]}>{r.name}</Text>
                    <Text style={[styles.td, { width: 48, fontFamily: fonts.bold }]}>{r.value}</Text>
                    <Text style={[styles.td, { width: 52 }]}>{r.unit}</Text>
                    <Text style={[styles.td, { width: 72 }]}>{r.range}</Text>
                    <Text style={[styles.flag, { width: 16, color: r.flag === 'H' ? colors.red : r.flag === 'L' ? colors.orange : 'transparent' }]}>{r.flag || ''}</Text>
                  </View>
                ))}
              </View>
            ))}
          </Card>
          <View style={styles.safeBox}>
            <Text style={styles.safeT}>Your data is safe and secure</Text>
            <Text style={styles.safeS}>All report data is stored only on this device / your lab server.</Text>
          </View>
        </FadeIn>
      )}
    </AppScreen>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <View style={styles.stepper}>
      {STEPS.map((s, i) => {
        const n = i + 1;
        const done = step > n;
        const on = step === n;
        return (
          <React.Fragment key={s}>
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, (on || done) && styles.stepDotOn]}>
                {done ? <Check size={12} color="#fff" /> : <Text style={[styles.stepN, (on || done) && { color: '#fff' }]}>{n}</Text>}
              </View>
              <Text style={[styles.stepL, (on || done) && { color: colors.primary }]}>{s}</Text>
            </View>
            {i < 2 && <View style={[styles.stepLine, step > n && { backgroundColor: colors.primary }]} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function Amt({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <View style={styles.amtRow}>
      <Text style={styles.amtL}>{label}</Text>
      <Text style={[styles.amtV, bold && { fontFamily: fonts.extrabold, color: colors.primary }, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

function SumRow({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.mini}>{k}</Text>
      <Text style={styles.pName}>{v}</Text>
    </View>
  );
}

function SumStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ width: '25%', alignItems: 'center' }}>
      <Text style={[styles.statN, color ? { color } : null]}>{value}</Text>
      <Text style={styles.mini}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, paddingHorizontal: 4 },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  stepDotOn: { backgroundColor: colors.primary },
  stepN: { fontFamily: fonts.bold, fontSize: 11, color: colors.mutedForeground },
  stepL: { fontFamily: fonts.semibold, fontSize: 10, color: colors.mutedForeground },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: 6, marginBottom: 14 },
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  secTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  link: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 12 },
  picked: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: radius.sm, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: '#DBEAFE' },
  pickedOn: { borderColor: colors.primary },
  pName: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.foreground },
  pMeta: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedForeground, marginTop: 1 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  drop: { marginTop: 6 },
  dropRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabs: { flexDirection: 'row', backgroundColor: colors.muted, borderRadius: radius.sm, padding: 3, marginTop: 10 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabOn: { backgroundColor: colors.primary },
  tabTxt: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.mutedForeground },
  tabTxtOn: { color: '#fff' },
  testRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  check: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.inputBorder, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  price: { fontFamily: fonts.bold, fontSize: 13, color: colors.foreground },
  addMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 10 },
  split: { flexDirection: 'row', gap: 10 },
  mini: { fontFamily: fonts.medium, fontSize: 10.5, color: colors.mutedForeground },
  dateVal: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.foreground, marginTop: 4 },
  amtRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  amtL: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.mutedForeground },
  amtV: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.foreground },
  amtIn: { width: 72, height: 30, borderWidth: 1, borderColor: colors.border, borderRadius: 8, textAlign: 'right', paddingHorizontal: 6, fontFamily: fonts.semibold, fontSize: 12, color: colors.foreground },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  mode: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  modeOn: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  modeTxt: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.mutedForeground },
  footer: { padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border },
  summaryBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  valHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 },
  autoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 6, borderRadius: radius.pill },
  group: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.primary, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 },
  th: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.muted },
  thT: { fontFamily: fonts.semibold, fontSize: 10, color: colors.mutedForeground },
  tr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
  td: { fontFamily: fonts.regular, fontSize: 11, color: colors.foreground },
  resIn: { width: 68, height: 32, borderWidth: 1, borderColor: colors.border, borderRadius: 8, textAlign: 'center', fontFamily: fonts.semibold, fontSize: 12, marginRight: 6, color: colors.foreground },
  flag: { fontFamily: fonts.extrabold, fontSize: 12 },
  remarks: { minHeight: 72, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 10, marginTop: 6, fontFamily: fonts.regular, fontSize: 13, color: colors.foreground },
  counter: { alignSelf: 'flex-end', fontFamily: fonts.regular, fontSize: 10, color: colors.placeholder, marginTop: 4 },
  okBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.greenLight, borderRadius: radius.sm, padding: 10, marginTop: 12 },
  okTxt: { flex: 1, fontFamily: fonts.medium, fontSize: 12, color: colors.green },
  sumGrid: { flexDirection: 'row', marginTop: 8 },
  statN: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.foreground },
  safeBox: { backgroundColor: colors.primarySoft, borderRadius: radius.sm, padding: 12, marginTop: 12 },
  safeT: { fontFamily: fonts.semibold, fontSize: 12, color: colors.primary },
  safeS: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
});
