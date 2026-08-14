import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { ChevronLeft, Share2, Printer, Download, CheckCircle2, Clock, XCircle, IndianRupee } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import { Card, EmptyState } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { lab, cbcParams } from '@/lib/labData';
import { endpoints } from '@/lib/api';

const esc = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default function ReportPreview() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' && params.id ? params.id : undefined;
  const insets = useSafeAreaInsets();
  const [report, setReport] = React.useState<any>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Strictly server-first: load the report from the API, sample fallback only
  // when no id was passed or the server is unreachable.
  React.useEffect(() => {
    let alive = true;
    async function load() {
      if (!id) {
        setLoaded(true);
        return;
      }
      try {
        const r = await endpoints.reports.getById(id);
        if (alive) setReport(r);
      } catch (e: any) {
        console.warn('Report preview: using sample data —', e?.message || e);
      } finally {
        if (alive) setLoaded(true);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [id]);

  const patient = report?.patient && typeof report.patient === 'object' ? report.patient : { name: report?.patient || '—', age: '—', gender: '—', pid: '—' };
  const doctor = report?.doctor || 'Direct';
  const testName = report?.test || 'Report';
  const isCbc = /cbc|complete blood count/i.test(testName);
  const reportId = report?.reportId || '—';
  const reportDate = report?.date || '';
  const amount = report?.amount ?? 0;
  const status = report?.status || 'Pending';
  const paid = !!report?.paid;

  const patchReport = async (data: any) => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await endpoints.reports.update(id, data);
      setReport(updated);
    } catch (e: any) {
      alert(e?.message || 'Could not update report');
    } finally {
      setSaving(false);
    }
  };

  const statusMeta =
    status === 'Completed'
      ? { Icon: CheckCircle2, color: colors.green }
      : status === 'Pending'
        ? { Icon: Clock, color: colors.orange }
        : { Icon: XCircle, color: colors.red };
  const StatusIcon = statusMeta.Icon;

  const buildHtml = () => {
    const rows = cbcParams
      .map(
        (c) =>
          `<tr><td>${esc(c.name)}</td><td style="font-weight:600">${esc(c.value)}</td><td>${esc(c.unit)}</td><td>${esc(c.range)}</td></tr>`
      )
      .join('');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(reportId)}</title>
<style>body{font-family:Arial,Helvetica,sans-serif;color:#0F172A;margin:32px}
h1{color:#1668E3;font-size:18px;margin:0} .meta{color:#64748B;font-size:11px;margin:2px 0}
.box{border:1px solid #E2E8F0;border-radius:6px;padding:12px;margin:10px 0;background:#F8FAFC}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#F1F5F9;text-align:left;padding:6px 8px;border:1px solid #E2E8F0}
td{padding:6px 8px;border:1px solid #E2E8F0}
.right{text-align:right;margin-top:24px;font-weight:600}</style></head><body>
<h1>${esc(lab.name)}</h1>
<p class="meta">${esc(lab.address)}</p>
<p class="meta">${esc(lab.phone)} | ${esc(lab.email)}</p>
<div class="box">
<p class="meta"><strong>Patient:</strong> ${esc(patient.name)} &nbsp;|&nbsp; <strong>Age/Gender:</strong> ${patient.age} Yrs / ${esc(patient.gender)} &nbsp;|&nbsp; <strong>Patient ID:</strong> ${esc(patient.pid)}</p>
<p class="meta"><strong>Report ID:</strong> ${esc(reportId)} &nbsp;|&nbsp; <strong>Referred By:</strong> ${esc(doctor)} &nbsp;|&nbsp; <strong>Date:</strong> ${esc(reportDate)}</p>
</div>
<h2 style="font-size:14px;text-align:center;letter-spacing:0.5px">${esc(testName.toUpperCase())}</h2>
${isCbc ? `<table><tr><th>Test</th><th>Result</th><th>Unit</th><th>Reference</th></tr>${rows}</table>` : `<div class="box"><p class="meta"><strong>Amount:</strong> ₹${amount} &nbsp;|&nbsp; <strong>Status:</strong> ${esc(status)} &nbsp;|&nbsp; <strong>Payment:</strong> ${paid ? 'Paid' : 'Unpaid'}</p></div>`}
<div class="right">${esc(lab.pathologist)}<br><span class="meta">Consultant Pathologist</span></div>
<p style="text-align:center;color:#64748B;font-size:11px">*** End of Report ***</p>
</body></html>`;
  };

  const onPrint = async () => {
    try {
      setBusy(true);
      await Print.printAsync({ html: buildHtml() });
    } catch (e: any) {
      console.warn('Print failed:', e?.message || e);
      alert('Printing is not available here, but the PDF download works.');
    } finally {
      setBusy(false);
    }
  };

  const onDownload = async () => {
    try {
      setBusy(true);
      const { uri } = await Print.printToFileAsync({ html: buildHtml() });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Save Report PDF' });
      } else {
        alert(`PDF saved at:\n${uri}`);
      }
    } catch (e: any) {
      console.warn('PDF failed:', e?.message || e);
      alert('Could not generate the PDF on this device.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Report Preview"
        subtitle={testName}
        left={<ChevronLeft size={24} color="#FFFFFF" />}
        onLeftPress={() => router.back()}
        right={<Share2 size={18} color="#FFFFFF" />}
      />

      {!loaded ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Card style={{ padding: 0 }}>
              <View style={styles.letterhead}>
                <Image source={require('../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.labName}>{lab.name}</Text>
                  <Text style={styles.labMeta}>{lab.address}</Text>
                  <Text style={styles.labMeta}>{lab.phone}  |  {lab.email}</Text>
                </View>
              </View>

              <View style={styles.info}>
                <InfoRow label="Patient Name" value={patient.name} label2="Report ID" value2={reportId} />
                <InfoRow label="Age / Gender" value={`${patient.age} Yrs / ${patient.gender}`} label2="Patient ID" value2={patient.pid || '—'} />
                <InfoRow label="Referred By" value={doctor} label2="Report Date" value2={reportDate} />
              </View>

              <Text style={styles.testTitle}>{testName.toUpperCase()}</Text>

              {isCbc ? (
                <>
                  <View style={styles.tableHead}>
                    <Text style={[styles.th, { flex: 2 }]}>Test</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Result</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Unit</Text>
                    <Text style={[styles.th, { flex: 1.4 }]}>Reference</Text>
                  </View>
                  {cbcParams.map((c) => (
                    <View key={c.name} style={styles.tr}>
                      <Text style={[styles.td, { flex: 2 }]}>{c.name}</Text>
                      <Text style={[styles.td, { flex: 1, fontFamily: fonts.semibold }]}>{c.value}</Text>
                      <Text style={[styles.td, { flex: 1 }]}>{c.unit}</Text>
                      <Text style={[styles.td, { flex: 1.4 }]}>{c.range}</Text>
                    </View>
                  ))}
                </>
              ) : (
                <View style={styles.summary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Amount</Text>
                    <View style={styles.summaryValueRow}>
                      <IndianRupee size={12} color={colors.foreground} />
                      <Text style={styles.summaryValue}>₹{amount}</Text>
                    </View>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Status</Text>
                    <View style={styles.summaryValueRow}>
                      <StatusIcon size={12} color={statusMeta.color} />
                      <Text style={[styles.summaryValue, { color: statusMeta.color }]}>{status}</Text>
                    </View>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Payment</Text>
                    <Text style={[styles.summaryValue, { color: paid ? colors.green : colors.red }]}>
                      {paid ? 'Paid' : 'Unpaid'}
                    </Text>
                  </View>
                  <Text style={styles.summaryNote}>
                    Detailed parameters for "{testName}" will be added by the lab technician.
                  </Text>
                </View>
              )}

              <View style={styles.signature}>
                <View>
                  <Text style={styles.sigName}>{lab.pathologist}</Text>
                  <Text style={styles.sigRole}>Consultant Pathologist</Text>
                </View>
              </View>
              <Text style={styles.note}>*** End of Report ***</Text>
            </Card>
            {!report && (
              <EmptyState title="Report not found" subtitle="Open a report from the Reports tab." />
            )}

            {!!report && (
              <View style={styles.actions}>
                <Pressable style={styles.chipBtn} disabled={saving} onPress={() => patchReport({ paid: !paid })}>
                  <Text style={styles.chipBtnText}>{paid ? 'Mark unpaid' : 'Mark paid'}</Text>
                </Pressable>
                {status !== 'Completed' && (
                  <Pressable style={[styles.chipBtn, styles.chipSolid]} disabled={saving} onPress={() => patchReport({ status: 'Completed' })}>
                    <Text style={[styles.chipBtnText, { color: '#fff' }]}>Mark completed</Text>
                  </Pressable>
                )}
              </View>
            )}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            <Pressable style={styles.ghost} onPress={onPrint} disabled={busy}>
              <Printer size={15} color={colors.primary} />
              <Text style={styles.ghostText}>Print</Text>
            </Pressable>
            <Pressable style={styles.solid} onPress={onDownload} disabled={busy}>
              {busy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Download size={15} color="#FFFFFF" />
                  <Text style={styles.solidText}>Download PDF</Text>
                </>
              )}
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

function InfoRow({ label, value, label2, value2 }: { label: string; value: string; label2: string; value2: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label2}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value2}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.hPad, paddingTop: 4, paddingBottom: 24 },
  letterhead: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 2, borderBottomColor: colors.primary },
  logo: { width: 44, height: 44 },
  labName: { color: colors.primary, fontFamily: fonts.bold, fontSize: 13 },
  labMeta: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 9, marginTop: 1 },
  info: { padding: 12, backgroundColor: colors.primaryLight },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  infoLabel: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 9 },
  infoValue: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 11 },
  testTitle: { textAlign: 'center', color: colors.foreground, fontFamily: fonts.bold, fontSize: 12, paddingVertical: 10, letterSpacing: 0.4 },
  tableHead: { flexDirection: 'row', backgroundColor: colors.muted, paddingVertical: 7, paddingHorizontal: 10 },
  th: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 10 },
  tr: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  td: { color: colors.foreground, fontFamily: fonts.regular, fontSize: 10 },
  summary: { padding: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryLabel: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10.5 },
  summaryValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryValue: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 11.5 },
  summaryNote: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 9.5, marginTop: 10, lineHeight: 13 },
  signature: { alignItems: 'flex-end', padding: 14 },
  sigName: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 11 },
  sigRole: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 9 },
  note: { textAlign: 'center', color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 10, paddingBottom: 14 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  chipBtn: { flex: 1, height: 42, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  chipSolid: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipBtnText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.primary },
  footer: { flexDirection: 'row', gap: 10, padding: spacing.hPad, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  ghost: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary },
  ghostText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 13 },
  solid: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: radius.sm, backgroundColor: colors.primary },
  solidText: { color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 13 },
});
