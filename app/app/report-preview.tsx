import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  ChevronLeft, Share2, Printer, Download, MessageCircle, MoreHorizontal,
  BadgeCheck, Copy, Trash2, Pencil, X, Wallet,
} from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import CodeStrip from '@/components/CodeStrip';
import { Card, EmptyState, Badge, FadeIn } from '@/components/UI';
import { colors, fonts, radius } from '@/lib/theme';
import { endpoints } from '@/lib/api';
import { inr } from '@/lib/format';
import { paramsForTest, groupParams, type ParamRow } from '@/lib/testParams';
import { buildReportHtml, verifyPayload } from '@/lib/reportHtml';
import { printHtml, pdfFromHtml, openWhatsApp, shareText, whatsappMessage } from '@/lib/share';
import { useSettings } from '@/lib/settings';
import { useAuth } from '@/lib/auth';

export default function ReportPreview() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' && params.id ? params.id : undefined;
  const insets = useSafeAreaInsets();
  const user = useAuth((s) => s.user);
  const settings = useSettings((s) => s.settings);
  const loadSettings = useSettings((s) => s.load);
  const [report, setReport] = React.useState<any>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [menu, setMenu] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!id) { setLoaded(true); return; }
    try {
      const r = await endpoints.reports.getById(id);
      setReport(r);
    } catch (e: any) {
      console.warn('Report preview:', e?.message || e);
    } finally {
      setLoaded(true);
    }
  }, [id]);

  useFocusEffect(React.useCallback(() => { loadSettings(); load(); }, [load, loadSettings]));

  const patient = report?.patient && typeof report.patient === 'object'
    ? report.patient
    : { name: report?.patient || '—', age: '—', gender: '—', pid: '—' };
  const doctor = report?.doctor || 'Direct';
  const testName = report?.test || 'Report';
  const reportId = report?.reportId || '—';
  const rows: ParamRow[] = Array.isArray(report?.values) && report.values.length
    ? report.values
    : paramsForTest(testName, true);
  const paid = report?.paid || Number(report?.pendingAmount || 0) === 0;

  const html = () => buildReportHtml(report || {}, rows, settings);

  const onPrint = async () => { setBusy(true); await printHtml(html()); setBusy(false); };
  const onDownload = async () => { setBusy(true); await pdfFromHtml(html(), `Report ${reportId}`); setBusy(false); };

  const onWhatsApp = () => openWhatsApp(
    patient.mobile,
    whatsappMessage({ patient: patient.name, reportId })
  );

  const onShare = () => shareText(
    `${patient.name} · ${testName} · ${reportId}\n${settings.name}\n${verifyPayload(report || {}, settings)}`
  );

  const onVerify = async () => {
    if (!report) return;
    setBusy(true);
    try {
      const updated = await endpoints.reports.verify(String(report._id || report.id), user?.name || 'Lab Owner');
      setReport(updated);
      Alert.alert('Report verified', 'Marked as verified and completed.');
    } catch (e: any) {
      Alert.alert('Could not verify', e?.message || 'Server error');
    } finally {
      setBusy(false);
    }
  };

  const onDuplicate = async () => {
    if (!report) return;
    setMenu(false);
    setBusy(true);
    try {
      const copy = await endpoints.reports.duplicate(String(report._id || report.id));
      Alert.alert('Report duplicated', `New draft ${copy.reportId} created.`, [
        { text: 'Stay here', style: 'cancel' },
        { text: 'Open copy', onPress: () => router.replace({ pathname: '/report-preview', params: { id: copy._id || copy.id } } as any) },
      ]);
    } catch (e: any) {
      Alert.alert('Could not duplicate', e?.message || 'Server error');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = () => {
    setMenu(false);
    Alert.alert('Delete report', 'The report moves to Deleted Records and can be restored.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await endpoints.reports.remove(String(report._id || report.id));
            router.back();
          } catch (e: any) {
            Alert.alert('Could not delete', e?.message || 'Server error');
          }
        },
      },
    ]);
  };

  const onCollect = async () => {
    setMenu(false);
    const pending = Number(report?.pendingAmount || 0);
    if (!pending) return Alert.alert('Nothing pending', 'This report is fully paid.');
    Alert.alert('Collect payment', `Collect ${inr(pending)} now?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Collect',
        onPress: async () => {
          try {
            await endpoints.transactions.collect({ reportId: String(report._id || report.id), amount: pending });
            await load();
            Alert.alert('Payment recorded', `${inr(pending)} collected.`);
          } catch (e: any) {
            Alert.alert('Could not record', e?.message || 'Server error');
          }
        },
      },
    ]);
  };

  return (
    <AppScreen
      header={
        <ScreenHeader
          title="Report Preview"
          subtitle={`Report ID: ${reportId}`}
          left={<ChevronLeft size={24} color="#FFFFFF" />}
          onLeftPress={() => router.back()}
          right={
            <Pressable style={styles.headBtn} onPress={() => setMenu((v) => !v)}>
              {menu ? <X size={18} color="#fff" /> : <MoreHorizontal size={20} color="#fff" />}
            </Pressable>
          }
        />
      }
      footer={
        loaded && report ? (
          <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <BarBtn Icon={Share2} label="Share" onPress={onShare} />
            <BarBtn Icon={Download} label="Download PDF" onPress={onDownload} />
            <BarBtn Icon={Printer} label="Print" onPress={onPrint} />
            <BarBtn Icon={MessageCircle} label="WhatsApp" onPress={onWhatsApp} />
            <BarBtn Icon={MoreHorizontal} label="More" onPress={() => setMenu((v) => !v)} />
          </View>
        ) : null
      }
    >
      {!loaded ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : !report ? (
        <EmptyState title="Report not found" subtitle="Open a report from the Reports tab." />
      ) : (
        <>
          {menu && (
            <FadeIn>
              <Card style={styles.menu}>
                <MenuItem Icon={Pencil} label="Edit report values" onPress={() => { setMenu(false); router.push({ pathname: '/create-report', params: { editId: String(report._id || report.id) } } as any); }} />
                <MenuItem Icon={Copy} label="Duplicate report" onPress={onDuplicate} />
                <MenuItem Icon={Wallet} label={`Collect pending ${inr(report.pendingAmount)}`} onPress={onCollect} />
                <MenuItem Icon={BadgeCheck} label={report.verified ? 'Already verified' : 'Owner verification'} onPress={onVerify} />
                <MenuItem Icon={Trash2} label="Delete report" danger onPress={onDelete} last />
              </Card>
            </FadeIn>
          )}

          {busy ? <ActivityIndicator color={colors.primary} style={{ marginBottom: 8 }} /> : null}

          <Card style={{ padding: 0 }}>
            <View style={styles.letter}>
              <View>
                <Text style={styles.brand}>PathoNexa</Text>
                <Text style={styles.brandSub}>DIAGNOSTIC LABORATORY</Text>
              </View>
              <View style={{ alignItems: 'flex-end', flex: 1, marginLeft: 12 }}>
                <Text style={styles.labN} numberOfLines={2}>{settings.name}</Text>
                <Text style={styles.labM} numberOfLines={2}>{settings.address}</Text>
                <Text style={styles.labM}>{settings.phone}  |  {settings.email}</Text>
                {!!settings.gst && <Text style={styles.labM}>GSTIN: {settings.gst}</Text>}
              </View>
            </View>

            <View style={styles.statusRow}>
              <Badge text={report.status || 'Pending'} tone={report.status === 'Completed' ? 'green' : report.status === 'Cancelled' ? 'red' : 'orange'} />
              <Badge text={paid ? 'PAID' : 'UNPAID'} tone={paid ? 'green' : 'red'} />
              {report.verified ? <Badge text="Verified" tone="primary" /> : null}
              <View style={{ flex: 1 }} />
              <Text style={styles.amount}>{inr(report.amount)}</Text>
            </View>

            <View style={styles.info}>
              <Info label="Patient Name" value={patient.name} />
              <Info label="Ref. Doctor" value={doctor} />
              <Info label="PID" value={patient.pid || '—'} />
              <Info label="Lab No." value={reportId} />
              <Info label="Age / Gender" value={`${patient.age} Yrs / ${patient.gender}`} />
              <Info label="Sample Collected" value={report.sampleDate || report.date} />
              <Info label="Blood Group" value={patient.blood || '—'} />
              <Info label="Report Date" value={`${report.date || ''} ${report.time || ''}`} />
              <Info label="Technician" value={report.technician || '—'} />
              <Info label="Payment" value={`${report.paymentMode || 'Cash'} · Pending ${inr(report.pendingAmount)}`} />
            </View>

            <Text style={styles.testTitle}>{String(testName).toUpperCase()}</Text>

            {groupParams(rows).map((g) => (
              <View key={g.group}>
                <Text style={styles.group}>{g.group}</Text>
                <View style={styles.th}>
                  <Text style={[styles.thT, { flex: 1.6 }]}>Test Name</Text>
                  <Text style={[styles.thT, { width: 52 }]}>Result</Text>
                  <Text style={[styles.thT, { width: 56 }]}>Unit</Text>
                  <Text style={[styles.thT, { flex: 1 }]}>Reference Range</Text>
                </View>
                {g.rows.map((c: any) => (
                  <View key={c.name} style={[styles.tr, c.highlight && { backgroundColor: '#FFFBF5' }]}>
                    <Text style={[styles.td, { flex: 1.6 }, c.bold && { fontFamily: fonts.bold }]}>{c.name}</Text>
                    <Text style={[styles.td, { width: 52, fontFamily: fonts.bold }, c.critical && { color: colors.red }]}>{c.value}</Text>
                    <Text style={[styles.td, { width: 56 }]}>{c.unit}</Text>
                    <Text style={[styles.td, { flex: 1 }]}>
                      {c.range}{'  '}
                      <Text style={{ color: c.flag === 'H' ? colors.red : colors.orange, fontFamily: fonts.extrabold }}>{c.flag}</Text>
                    </Text>
                  </View>
                ))}
              </View>
            ))}

            {!!report.remarks && (
              <View style={styles.remarks}>
                <Text style={styles.remarksTitle}>Remarks / Comments</Text>
                <Text style={styles.remarksTxt}>{report.remarks}</Text>
              </View>
            )}

            <View style={styles.sig}>
              <View>
                <Text style={styles.sigN}>Verified By</Text>
                <Text style={styles.sigV}>{report.verifiedBy || settings.pathologist}</Text>
              </View>
              <View style={[styles.stamp, { borderColor: paid ? colors.green : colors.red }]}>
                <Text style={[styles.stampTxt, { color: paid ? colors.green : colors.red }]}>{paid ? 'PAID' : 'UNPAID'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.sigN}>Authorised By</Text>
                <Text style={styles.sigV}>{settings.shortName}</Text>
              </View>
            </View>

            <CodeStrip
              qrValue={verifyPayload(report, settings)}
              barcodeValue={reportId}
              caption={`Generated ${new Date().toLocaleDateString('en-GB')}`}
            />

            <Text style={styles.note}>{settings.footer}</Text>
          </Card>
        </>
      )}
    </AppScreen>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <View style={{ width: '50%', marginBottom: 6 }}>
      <Text style={styles.il}>{label}</Text>
      <Text style={styles.iv} numberOfLines={1}>{String(value ?? '—')}</Text>
    </View>
  );
}

function BarBtn({ Icon, label, onPress }: { Icon: any; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.barBtn} onPress={onPress}>
      <Icon size={18} color={colors.primary} />
      <Text style={styles.barTxt}>{label}</Text>
    </Pressable>
  );
}

function MenuItem({ Icon, label, onPress, danger, last }: { Icon: any; label: string; onPress: () => void; danger?: boolean; last?: boolean }) {
  return (
    <Pressable style={[styles.menuItem, last && { borderBottomWidth: 0 }]} onPress={onPress}>
      <Icon size={16} color={danger ? colors.danger : colors.primary} />
      <Text style={[styles.menuTxt, danger && { color: colors.danger }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headBtn: { width: 36, height: 36, borderRadius: radius.xs, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  menu: { padding: 0, marginBottom: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuTxt: { fontFamily: fonts.semibold, fontSize: 13, color: colors.foreground },
  letter: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 2, borderBottomColor: colors.primary },
  brand: { fontFamily: fonts.extrabold, fontSize: 19, color: colors.primary, letterSpacing: -0.4 },
  brandSub: { fontFamily: fonts.semibold, fontSize: 8, color: colors.mutedForeground, letterSpacing: 1.6 },
  labN: { fontFamily: fonts.bold, fontSize: 11, color: colors.foreground, textAlign: 'right' },
  labM: { fontFamily: fonts.regular, fontSize: 9.5, color: colors.mutedForeground, textAlign: 'right', marginTop: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingTop: 10 },
  amount: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.foreground },
  info: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, backgroundColor: colors.primarySoft, marginTop: 10 },
  il: { fontFamily: fonts.regular, fontSize: 9, color: colors.mutedForeground },
  iv: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.foreground },
  testTitle: { textAlign: 'center', fontFamily: fonts.extrabold, fontSize: 12.5, letterSpacing: 0.6, paddingVertical: 10, color: colors.navy },
  group: { fontFamily: fonts.bold, fontSize: 11.5, color: colors.primary, paddingHorizontal: 12, paddingTop: 8 },
  th: { flexDirection: 'row', backgroundColor: colors.muted, paddingHorizontal: 12, paddingVertical: 6 },
  thT: { fontFamily: fonts.semibold, fontSize: 10, color: colors.mutedForeground },
  tr: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  td: { fontFamily: fonts.regular, fontSize: 10.5, color: colors.foreground },
  remarks: { paddingHorizontal: 12, paddingTop: 10 },
  remarksTitle: { fontFamily: fonts.bold, fontSize: 11, color: colors.primary },
  remarksTxt: { fontFamily: fonts.regular, fontSize: 11, color: colors.foreground, marginTop: 2 },
  sig: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  sigN: { fontFamily: fonts.regular, fontSize: 10, color: colors.mutedForeground },
  sigV: { fontFamily: fonts.semibold, fontSize: 11, color: colors.foreground, marginTop: 2, maxWidth: 120 },
  stamp: { borderWidth: 2, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, transform: [{ rotate: '-8deg' }] },
  stampTxt: { fontFamily: fonts.extrabold, fontSize: 12, letterSpacing: 1.5 },
  note: { textAlign: 'center', color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10, paddingBottom: 14, paddingHorizontal: 14 },
  bar: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  barBtn: { flex: 1, alignItems: 'center', gap: 3 },
  barTxt: { fontFamily: fonts.semibold, fontSize: 9.5, color: colors.foreground, textAlign: 'center' },
});
