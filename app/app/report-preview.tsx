import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Linking, Share as RNShare } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  ChevronLeft, Share2, Printer, Download, MessageCircle, MoreHorizontal,
} from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import { Card, EmptyState } from '@/components/UI';
import { colors, fonts, radius } from '@/lib/theme';
import { lab } from '@/lib/labData';
import { endpoints } from '@/lib/api';
import { paramsForTest, groupParams, type ParamRow } from '@/lib/testParams';

const esc = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default function ReportPreview() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' && params.id ? params.id : undefined;
  const insets = useSafeAreaInsets();
  const [report, setReport] = React.useState<any>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!id) { setLoaded(true); return; }
      try {
        const r = await endpoints.reports.getById(id);
        if (alive) setReport(r);
      } catch (e: any) {
        console.warn('Report preview:', e?.message || e);
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const patient = report?.patient && typeof report.patient === 'object'
    ? report.patient
    : { name: report?.patient || '—', age: '—', gender: '—', pid: '—' };
  const doctor = report?.doctor || 'Direct';
  const testName = report?.test || 'Report';
  const reportId = report?.reportId || '—';
  const rows: ParamRow[] = Array.isArray(report?.values) && report.values.length
    ? report.values
    : paramsForTest(testName, true);

  const buildHtml = () => {
    const groups = groupParams(rows);
    const tables = groups.map((g) => `
      <h3>${esc(g.group)}</h3>
      <table><tr><th>Test Name</th><th>Result</th><th>Unit</th><th>Reference Range</th><th></th></tr>
      ${g.rows.map((c) => `<tr><td>${esc(c.name)}</td><td style="font-weight:700">${esc(c.value)}</td><td>${esc(c.unit)}</td><td>${esc(c.range)}</td><td style="color:${c.flag === 'H' ? '#EF4444' : '#F59E0B'};font-weight:700">${c.flag || ''}</td></tr>`).join('')}
      </table>`).join('');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(reportId)}</title>
<style>body{font-family:Arial,Helvetica,sans-serif;color:#0F172A;margin:28px}
h1{color:#1668E3;font-size:20px;margin:0} .meta{color:#64748B;font-size:11px;margin:2px 0}
.box{border:1px solid #E2E8F0;border-radius:8px;padding:12px;margin:10px 0;background:#F8FAFC}
table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:12px}
th{background:#F1F5F9;text-align:left;padding:6px 8px;border:1px solid #E2E8F0}
td{padding:6px 8px;border:1px solid #E2E8F0}
h3{font-size:12px;color:#1668E3;margin:10px 0 4px}
.right{text-align:right;margin-top:24px;font-weight:600}</style></head><body>
<h1>${esc(lab.name)}</h1>
<p class="meta">${esc(lab.address)}</p>
<p class="meta">${esc(lab.phone)} | ${esc(lab.email)}</p>
<div class="box">
<p class="meta"><strong>Patient:</strong> ${esc(patient.name)} &nbsp;|&nbsp; <strong>Age/Gender:</strong> ${patient.age} Yrs / ${esc(patient.gender)} &nbsp;|&nbsp; <strong>PID:</strong> ${esc(patient.pid)}</p>
<p class="meta"><strong>Report ID:</strong> ${esc(reportId)} &nbsp;|&nbsp; <strong>Ref By:</strong> ${esc(doctor)} &nbsp;|&nbsp; <strong>Date:</strong> ${esc(report?.date || '')}</p>
</div>
<h2 style="font-size:14px;text-align:center;letter-spacing:0.6px">${esc(testName.toUpperCase())}</h2>
${tables}
<div class="right">${esc(lab.pathologist)}<br><span class="meta">Consultant Pathologist</span></div>
<p style="text-align:center;color:#64748B;font-size:11px">This is a computer generated report.</p>
</body></html>`;
  };

  const onPrint = async () => {
    try { setBusy(true); await Print.printAsync({ html: buildHtml() }); }
    catch { alert('Printing is not available here. Use Download PDF.'); }
    finally { setBusy(false); }
  };

  const onDownload = async () => {
    try {
      setBusy(true);
      const { uri } = await Print.printToFileAsync({ html: buildHtml() });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Save Report PDF' });
      } else alert(`PDF saved at:\n${uri}`);
    } catch { alert('Could not generate the PDF on this device.'); }
    finally { setBusy(false); }
  };

  const onWhatsApp = async () => {
    const mobile = patient.mobile ? `91${String(patient.mobile).replace(/\D/g, '').slice(-10)}` : '';
    const msg = `Hello ${patient.name || 'Patient'},%0A%0AYour pathology report is ready.%0AReport ID: ${reportId}%0APlease find your report attached.%0A%0AThank You.%0A${lab.shortName}`;
    const url = mobile ? `https://wa.me/${mobile}?text=${msg}` : `https://wa.me/?text=${msg}`;
    try { await Linking.openURL(url); } catch { alert('WhatsApp is not available on this device.'); }
  };

  const onShare = async () => {
    try { await RNShare.share({ message: `${patient.name} · ${testName} · ${reportId}\n${lab.name}` }); } catch { /* */ }
  };

  return (
    <AppScreen
      header={
        <ScreenHeader
          title="Report Preview"
          subtitle={`Report ID: ${reportId}`}
          left={<ChevronLeft size={24} color="#FFFFFF" />}
          onLeftPress={() => router.back()}
        />
      }
      footer={
        loaded ? (
          <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <BarBtn Icon={Share2} label="Share" onPress={onShare} />
            <BarBtn Icon={Download} label="Download PDF" onPress={onDownload} />
            <BarBtn Icon={Printer} label="Print" onPress={onPrint} />
            <BarBtn Icon={MessageCircle} label="WhatsApp" onPress={onWhatsApp} />
            <BarBtn Icon={MoreHorizontal} label="More" onPress={onShare} />
          </View>
        ) : null
      }
    >
      {!loaded ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : !report ? (
        <EmptyState title="Report not found" subtitle="Open a report from the Reports tab." />
      ) : (
            <Card style={{ padding: 0 }}>
              <View style={styles.letter}>
                <View>
                  <Text style={styles.brand}>PathoNexa</Text>
                  <Text style={styles.brandSub}>DIAGNOSTIC LABORATORY</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.labN}>{lab.name}</Text>
                  <Text style={styles.labM}>{lab.address}</Text>
                  <Text style={styles.labM}>{lab.phone}  |  {lab.email}</Text>
                </View>
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
              </View>
              <Text style={styles.testTitle}>{testName.toUpperCase()}</Text>
              {groupParams(rows).map((g) => (
                <View key={g.group}>
                  <Text style={styles.group}>{g.group}</Text>
                  <View style={styles.th}>
                    <Text style={[styles.thT, { flex: 1.6 }]}>Test Name</Text>
                    <Text style={[styles.thT, { width: 52 }]}>Result</Text>
                    <Text style={[styles.thT, { width: 56 }]}>Unit</Text>
                    <Text style={[styles.thT, { flex: 1 }]}>Reference Range</Text>
                  </View>
                  {g.rows.map((c) => (
                    <View key={c.name} style={styles.tr}>
                      <Text style={[styles.td, { flex: 1.6 }]}>{c.name}</Text>
                      <Text style={[styles.td, { width: 52, fontFamily: fonts.bold }]}>{c.value}</Text>
                      <Text style={[styles.td, { width: 56 }]}>{c.unit}</Text>
                      <Text style={[styles.td, { flex: 1 }]}>{c.range}  <Text style={{ color: c.flag === 'H' ? colors.red : colors.orange, fontFamily: fonts.extrabold }}>{c.flag}</Text></Text>
                    </View>
                  ))}
                </View>
              ))}
              <View style={styles.sig}>
                <View>
                  <Text style={styles.sigN}>Verified By</Text>
                  <Text style={styles.sigV}>{lab.pathologist}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.sigN}>Authorised By</Text>
                  <Text style={styles.sigV}>{lab.shortName}</Text>
                </View>
              </View>
              <Text style={styles.note}>This is a computer generated report and does not require physical signature.</Text>
            </Card>
          )}
    </AppScreen>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: '50%', marginBottom: 6 }}>
      <Text style={styles.il}>{label}</Text>
      <Text style={styles.iv} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function BarBtn({ Icon, label, onPress }: { Icon: any; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.barBtn}>
      <Icon size={16} color={colors.primary} />
      <Text style={styles.barTxt}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, marginTop: -18 },
  letter: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 2, borderBottomColor: colors.primary },
  brand: { color: colors.primary, fontFamily: fonts.extrabold, fontSize: 18 },
  brandSub: { color: colors.mutedForeground, fontFamily: fonts.semibold, fontSize: 8, letterSpacing: 0.8 },
  labN: { fontFamily: fonts.bold, fontSize: 11, color: colors.foreground },
  labM: { fontFamily: fonts.regular, fontSize: 9, color: colors.mutedForeground },
  info: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, backgroundColor: colors.primarySoft },
  il: { fontFamily: fonts.regular, fontSize: 9, color: colors.mutedForeground },
  iv: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.foreground },
  testTitle: { textAlign: 'center', fontFamily: fonts.extrabold, fontSize: 12.5, letterSpacing: 0.6, paddingVertical: 10, color: colors.navy },
  group: { fontFamily: fonts.bold, fontSize: 11.5, color: colors.primary, paddingHorizontal: 12, paddingTop: 8 },
  th: { flexDirection: 'row', backgroundColor: colors.muted, paddingHorizontal: 12, paddingVertical: 6 },
  thT: { fontFamily: fonts.semibold, fontSize: 10, color: colors.mutedForeground },
  tr: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  td: { fontFamily: fonts.regular, fontSize: 10.5, color: colors.foreground },
  sig: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  sigN: { fontFamily: fonts.regular, fontSize: 10, color: colors.mutedForeground },
  sigV: { fontFamily: fonts.semibold, fontSize: 11, color: colors.foreground, marginTop: 2 },
  note: { textAlign: 'center', color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10, paddingBottom: 14 },
  bar: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  barBtn: { flex: 1, alignItems: 'center', gap: 3 },
  barTxt: { fontFamily: fonts.semibold, fontSize: 9.5, color: colors.foreground, textAlign: 'center' },
});
