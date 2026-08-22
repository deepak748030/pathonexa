// Report Preview — PDF viewer look, UI PDF screen 7 (right side)
import React, { useEffect, useMemo, useState } from 'react';
import { T } from '../components/T';
import { BrandLogo } from '../components/Brand';
import { Platform, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { BlueHeader, HeaderIconBtn, Skeleton } from '../components/kit';
import { QRBox, Signature, Stamp } from '../components/charts';
import { C, PAGE_GUTTER } from '../src/theme';
import { api, type LabSettings, type Report, type ReportValue } from '../src/api';
import { reportHtml, reportPdfBlob, reportTextLines } from '../src/reportDocument';
import { useFeedback } from '../src/feedback';
const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : `${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
};
const valueFlag = (item: ReportValue): '' | 'H' | 'L' => {
  const result = Number(item.value);
  const limits = String(item.range || '').match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
  if (!Number.isFinite(result) || limits.length < 2) return '';
  return result < limits[0] ? 'L' : result > limits[1] ? 'H' : '';
};

export default function ReportPreview() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const { toast, prompt, actionSheet } = useFeedback();
  const [report, setReport] = useState<Report | null>(null);
  const [lab, setLab] = useState<LabSettings>({ name: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!id) {
      setError('A report ID is required.');
      setLoading(false);
      return () => { active = false; };
    }
    Promise.all([api.reports.get(id), api.settings()]).then(([reportData, settings]) => {
      if (!active) return;
      setReport(reportData);
      setLab(settings);
      setError('');
    }).catch((requestError) => {
      if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load this report.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [id]);

  const infoRows = useMemo<[string, string, string, string][]>(() => [
    ['Patient Name', report?.patient?.name || '—', 'Ref. Doctor', report?.doctor || 'Direct'],
    ['PID', report?.patient?.pid || '—', 'Lab No.', report?.reportId || '—'],
    ['Age / Gender', report ? `${report.patient?.age ?? '—'} Yrs / ${report.patient?.gender || '—'}` : '—', 'Sample Collected', formatDateTime(report?.sampleDate || report?.createdAt)],
    ['Blood Group', report?.patient?.blood || '—', 'Report Date', formatDateTime(report?.reportDate || report?.createdAt)],
  ], [report]);
  const groups = useMemo(() => {
    const map = new Map<string, ReportValue[]>();
    (report?.values || report?.parameters || []).forEach((item) => {
      const title = item.group || item.test || 'Results';
      map.set(title, [...(map.get(title) || []), item]);
    });
    return Array.from(map, ([title, values]) => ({ title, values }));
  }, [report]);
  const requireReport = () => {
    if (report && !loading) return report;
    toast({ kind: 'error', title: 'Report unavailable', message: error || 'Wait for the report to finish loading.' });
    return null;
  };

  const downloadReport = async () => {
    const current = requireReport();
    if (!current) return;
    try {
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(reportPdfBlob(current, lab));
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${current.reportId || 'pathology-report'}.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
      }
      const file = await Print.printToFileAsync({ html: reportHtml(current, lab), base64: false });
      if (!(await Sharing.isAvailableAsync())) throw new Error('File saving is not available on this device.');
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: `Save ${current.reportId}.pdf`,
      });
    } catch (actionError) {
      toast({ kind: 'error', title: 'Download failed', message: actionError instanceof Error ? actionError.message : 'Unable to create the report PDF.' });
    }
  };

  const shareReport = async () => {
    const current = requireReport();
    if (!current) return;
    try {
      if (Platform.OS === 'web') {
        const blob = reportPdfBlob(current, lab);
        const file = new File([blob], `${current.reportId}.pdf`, { type: 'application/pdf' });
        const browserNavigator = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
        if (browserNavigator.share && browserNavigator.canShare?.({ files: [file] })) {
          await browserNavigator.share({ title: current.reportId, text: `${lab.name || 'Pathology'} report`, files: [file] });
          return;
        }
        if (browserNavigator.share) {
          await browserNavigator.share({ title: current.reportId, text: reportTextLines(current, lab).join('\n') });
          return;
        }
        await downloadReport();
        return;
      }
      const file = await Print.printToFileAsync({ html: reportHtml(current, lab), base64: false });
      if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: `Share ${current.reportId}`,
      });
    } catch (actionError) {
      if ((actionError as Error)?.name !== 'AbortError') {
        toast({ kind: 'error', title: 'Sharing failed', message: actionError instanceof Error ? actionError.message : 'Unable to share this report.' });
      }
    }
  };

  const printReport = async () => {
    const current = requireReport();
    if (!current) return;
    try {
      const html = reportHtml(current, lab);
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (!printWindow) throw new Error('Allow pop-ups to print this report.');
        printWindow.opener = null;
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => { printWindow.focus(); printWindow.print(); }, 250);
        return;
      }
      await Print.printAsync({ html });
    } catch (actionError) {
      toast({ kind: 'error', title: 'Printing failed', message: actionError instanceof Error ? actionError.message : 'Unable to print this report.' });
    }
  };

  const searchReport = () => {
    const current = requireReport();
    if (!current) return;
    const find = (term?: string) => {
      if (!term?.trim()) return;
      const matches = reportTextLines(current, lab).filter((line) => line.toLowerCase().includes(term.trim().toLowerCase()));
      toast({
        kind: matches.length ? 'info' : 'warning',
        title: matches.length ? `${matches.length} match${matches.length === 1 ? '' : 'es'}` : 'No matches',
        message: matches.slice(0, 8).join('\n') || `“${term.trim()}” was not found.`,
        durationMs: 4500,
      });
    };
    prompt({
      title: 'Search report',
      message: 'Search by patient, test, or result.',
      placeholder: 'Enter a search term',
      submitText: 'Search',
      onSubmit: (value) => find(value),
    });
  };

  const moreActions = () => actionSheet({
    title: 'Report actions',
    message: 'Choose an action for this report.',
    actions: [
      { icon: 'share-variant', label: 'Share', onPress: () => { shareReport().catch(() => {}); } },
      { icon: 'download-outline', label: 'Download PDF', onPress: () => { downloadReport().catch(() => {}); } },
      { icon: 'printer', label: 'Print', onPress: () => { printReport().catch(() => {}); } },
    ],
  });

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={styles.phone}>
        <BlueHeader
          onBack={() => router.back()}
          title="Report Preview"
          sub={loading ? 'Loading report…' : `Report ID: ${report?.reportId || '—'}`}
          right={
            <>
              <HeaderIconBtn icon="magnify" onPress={searchReport} />
              <HeaderIconBtn icon="printer" onPress={() => { printReport().catch(() => {}); }} />
              <HeaderIconBtn icon="dots-vertical" onPress={moreActions} />
            </>
          }
        />

        {/* dark viewer toolbar */}
        <View style={styles.toolbar}>
          <MaterialCommunityIcons name="chevron-left" size={18} color="#E5E7EB" />
          <View style={styles.pageBox}>
            <T style={styles.pageBoxText}>1</T>
          </View>
          <T style={styles.pageOf}>/ 1</T>
          <View style={{ flex: 1 }} />
          <MaterialCommunityIcons name="minus" size={16} color="#E5E7EB" />
          <MaterialCommunityIcons name="plus" size={16} color="#E5E7EB" style={{ marginLeft: 4 }} />
          <View style={styles.zoomChip}>
            <T style={styles.zoomText}>100%</T>
            <MaterialCommunityIcons name="chevron-down" size={12} color="#E5E7EB" />
          </View>
          <MaterialCommunityIcons name="fullscreen" size={16} color="#E5E7EB" style={{ marginLeft: 4 }} />
        </View>

        <ScrollView
          style={{ flex: 1, backgroundColor: C.darker }}
          contentContainerStyle={{ paddingHorizontal: PAGE_GUTTER, paddingVertical: 8, alignItems: 'center' }}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.paper}>
            {/* letter head */}
            <View style={styles.letterHead}>
              <View style={styles.letterHeadBrand}>
                <BrandLogo width={112} />
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {loading ? <><Skeleton width={120} height={7} /><Skeleton width={145} height={7} style={{ marginTop: 3 }} /><Skeleton width={110} height={7} style={{ marginTop: 3 }} /></> : <>
                  <T style={styles.addr}>{lab.name || 'My Pathology Lab'}</T>
                  <T style={styles.addr}>{lab.address || lab.city || ''}</T>
                  <T style={styles.addr}>{lab.phone || lab.altPhone || ''}</T>
                  <T style={styles.addr}>{lab.email || ''}</T>
                </>}
              </View>
              <QRBox size={56} />
            </View>

            {/* patient block */}
            <View style={styles.infoGrid}>
              {infoRows.map((r, i) => (
                <View key={i} style={[styles.infoRow, i > 0 && { borderTopWidth: 1, borderTopColor: '#E5E7EB' }]}>
                  <View style={styles.infoCell}>
                    <T style={styles.infoLbl}>{r[0]}</T>
                    {loading ? <Skeleton width="55%" height={7} /> : <T style={styles.infoVal}>{r[1]}</T>}
                  </View>
                  <View style={[styles.infoCell, { borderLeftWidth: 1, borderLeftColor: '#E5E7EB' }]}>
                    <T style={styles.infoLbl}>{r[2]}</T>
                    {loading ? <Skeleton width="55%" height={7} /> : <T style={styles.infoVal}>{r[3]}</T>}
                  </View>
                </View>
              ))}
            </View>

            {loading ? <Skeleton width="55%" height={11} style={{ alignSelf: 'center', marginTop: 14 }} /> : <T style={styles.reportTitle}>{report?.test?.toUpperCase() || 'PATHOLOGY REPORT'}</T>}
            <View style={styles.titleRule} />

            {loading ? [0, 1, 2].map((group) => <View key={group}><Skeleton width="42%" height={9} style={{ marginTop: 10, marginBottom: 4 }} /><Skeleton width="100%" height={17} />{[0, 1, 2, 3].map((row) => <View key={row} style={styles.pdfRow}><Skeleton width="30%" height={7} /><Skeleton width="12%" height={7} style={{ marginLeft: 18 }} /><Skeleton width="15%" height={7} style={{ marginLeft: 18 }} /><Skeleton width="20%" height={7} style={{ marginLeft: 18 }} /></View>)}</View>) : groups.map((group) => (
              <View key={group.title}>
                <T style={styles.pdfGroup}>{group.title}</T>
                <View style={styles.pdfTblHead}>
                  <T style={[styles.pdfTh, { flex: 1.4 }]}>Test Name</T>
                  <T style={[styles.pdfTh, { flex: 0.8 }]}>Result</T>
                  <T style={[styles.pdfTh, { flex: 0.9 }]}>Unit</T>
                  <T style={[styles.pdfTh, { flex: 1.2 }]}>Reference Range</T>
                </View>
                {group.values.map((item, index) => {
                  const flag = valueFlag(item);
                  return <View key={`${item.testId || group.title}:${item.short || item.name}:${index}`} style={styles.pdfRow}>
                    <T style={[styles.pdfTd, { flex: 1.4 }]} numberOfLines={1}>{item.name}</T>
                    <T style={[styles.pdfTd, { flex: 0.8, fontWeight: '700' }]}>{item.value || '—'}</T>
                    <T style={[styles.pdfTd, { flex: 0.9 }]}>{item.unit || '—'}</T>
                    <View style={{ flex: 1.2, flexDirection: 'row', justifyContent: 'space-between' }}>
                      <T style={styles.pdfTd}>{item.range || '—'}</T>
                      {flag ? <T style={styles.pdfFlag}>{flag}</T> : null}
                    </View>
                  </View>;
                })}
              </View>
            ))}
            {!loading && error ? <T style={[styles.pdfRemarks, { color: C.red }]}>{error}</T> : null}
            {!loading && !error && !groups.length ? <T style={styles.pdfRemarks}>No report values have been entered.</T> : null}

            <T style={styles.pdfRemarksTitle}>Remarks / Comments</T>
            <T style={styles.pdfRemarks}>{report?.remarks || 'No remarks added.'}</T>

            {/* signatures */}
            <View style={styles.sigRow}>
              <View style={styles.sigCell}>
                <T style={styles.sigLbl}>Verified By</T>
                <Signature />
                <T style={styles.sigName}>{report?.verifiedBy || lab.pathologist || 'Pending verification'}</T>
                <T style={styles.sigSub}>{report?.verified ? 'Verified report' : 'Not yet verified'}</T>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Stamp />
              </View>
              <View style={styles.sigCell}>
                <T style={styles.sigLbl}>Authorized By</T>
                <Signature color="#334" />
                <T style={styles.sigName}>Lab Incharge</T>
                <T style={styles.sigSub}>{lab.name || 'My Pathology Lab'}</T>
              </View>
            </View>

            <T style={styles.pdfFoot}>{lab.footer || 'This is a computer generated report and does not require physical signature.'}</T>
          </View>
        </ScrollView>

        {/* dark action bar */}
        <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => { shareReport().catch(() => {}); }}>
            <MaterialCommunityIcons name="share-variant" size={14} color="#fff" />
            <T style={styles.actionText}>Share</T>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => { downloadReport().catch(() => {}); }}>
            <MaterialCommunityIcons name="download-outline" size={14} color="#fff" />
            <T style={styles.actionText}>Download PDF</T>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => { printReport().catch(() => {}); }}>
            <MaterialCommunityIcons name="printer" size={14} color="#fff" />
            <T style={styles.actionText}>Print</T>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={moreActions}>
            <MaterialCommunityIcons name="dots-horizontal" size={14} color="#fff" />
            <T style={styles.actionText}>More</T>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  phone: { flex: 1, maxWidth: 520, width: '100%', alignSelf: 'center', backgroundColor: C.bg, overflow: 'hidden' },
  toolbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.dark, paddingHorizontal: PAGE_GUTTER, paddingVertical: 8 },
  pageBox: { borderWidth: 1, borderColor: '#3A4656', borderRadius: 2, paddingHorizontal: 10, paddingVertical: 2, marginLeft: 4 },
  pageBoxText: { color: '#E5E7EB', fontSize: 10.5 },
  pageOf: { color: '#9CA3AF', fontSize: 10.5, marginLeft: 4 },
  zoomChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#3A4656', borderRadius: 2, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 4 },
  zoomText: { color: '#E5E7EB', fontSize: 10 },
  paper: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 430,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#D9DEE7',
    padding: 10,
  },
  letterHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  letterHeadBrand: { flex: 1, alignItems: 'flex-start' },
  addr: { color: C.sub, fontSize: 6.8, textAlign: 'right', lineHeight: 9 },
  infoGrid: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 2, marginTop: 12 },
  infoRow: { flexDirection: 'row' },
  infoCell: { flex: 1, flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 5, gap: 4 },
  infoLbl: { fontSize: 7.5, color: C.faint, flexBasis: '38%' as any },
  infoVal: { fontSize: 7.8, color: C.text, fontWeight: '700', flex: 1 },
  reportTitle: { textAlign: 'center', color: C.primary, fontWeight: '800', fontSize: 11, letterSpacing: 0.8, marginTop: 14 },
  titleRule: { height: 1, backgroundColor: '#DBE4F2', marginTop: 4 },
  pdfGroup: { color: C.primary, fontSize: 8.5, fontWeight: '800', marginBottom: 3 },
  pdfTblHead: { flexDirection: 'row', backgroundColor: '#F1F5FB', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 1 },
  pdfTh: { fontSize: 7.3, color: C.sub, fontWeight: '800' },
  pdfRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#F0F2F6' },
  pdfTd: { fontSize: 7.6, color: C.text },
  pdfFlag: { color: C.red, fontSize: 7.6, fontWeight: '800' },
  pdfRemarksTitle: { fontSize: 8, fontWeight: '800', color: C.text, marginTop: 12 },
  pdfRemarks: { fontSize: 7.8, color: C.sub, marginTop: 3 },
  sigRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 22 },
  sigCell: { alignItems: 'center', flexBasis: '30%' as any },
  sigLbl: { fontSize: 7.3, color: C.sub, fontWeight: '700', marginBottom: 2 },
  sigName: { fontSize: 7.8, color: C.text, fontWeight: '800', marginTop: 2 },
  sigSub: { fontSize: 7, color: C.faint },
  pdfFoot: { textAlign: 'center', fontSize: 6.8, color: C.faint, marginTop: 14, borderTopWidth: 1, borderTopColor: '#EEF1F5', paddingTop: 8 },
  actionBar: { flexDirection: 'row', gap: 0, backgroundColor: C.dark, paddingHorizontal: PAGE_GUTTER, paddingTop: 8, paddingBottom: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: C.primary,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.dark,
    paddingVertical: 9,
  },
  actionText: { color: '#fff', fontSize: 10.5, fontWeight: '700' },
});
