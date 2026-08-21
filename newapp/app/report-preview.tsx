// Report Preview — PDF viewer look, UI PDF screen 7 (right side)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, { Path, Circle } from 'react-native-svg';
import { BlueHeader, HeaderIconBtn } from '../components/kit';
import { QRBox, Signature, Stamp } from '../components/charts';
import { C } from '../src/theme';
import { lab, cbcGroups } from '../src/data';

function LogoMark() {
  return (
    <Svg width={34} height={34}>
      <Path d="M17 3 C 22 10, 27 14, 27 20 a 10 10 0 0 1 -20 0 C 7 14, 12 10, 17 3 Z" fill="#1467E8" />
      <Path d="M17 10 C 19.5 13.5, 22 16, 22 19.5 a 5 5 0 0 1 -10 0 C 12 16, 14.5 13.5, 17 10 Z" fill="#7FB2F7" />
    </Svg>
  );
}

const infoRows: [string, string, string, string][] = [
  ['Patient Name', 'Ramesh Kumar', 'Ref. Doctor', 'Dr. Rakesh Kumar'],
  ['PID', 'PT250726001', 'Lab No.', 'RP250726001'],
  ['Age / Gender', '32 Yrs / Male', 'Sample Collected', '26 Jul 2024 08:45 AM'],
  ['Blood Group', 'B+', 'Report Date', '26 Jul 2024 09:21 AM'],
];

export default function ReportPreview() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={styles.phone}>
        <BlueHeader
          onBack={() => router.back()}
          title="Report Preview"
          sub="Report ID: RP250726001"
          right={
            <>
              <HeaderIconBtn icon="magnify" />
              <HeaderIconBtn icon="printer" />
              <HeaderIconBtn icon="dots-vertical" />
            </>
          }
        />

        {/* dark viewer toolbar */}
        <View style={styles.toolbar}>
          <MaterialCommunityIcons name="chevron-left" size={18} color="#E5E7EB" />
          <View style={styles.pageBox}>
            <Text style={styles.pageBoxText}>1</Text>
          </View>
          <Text style={styles.pageOf}>/ 1</Text>
          <View style={{ flex: 1 }} />
          <MaterialCommunityIcons name="minus" size={16} color="#E5E7EB" />
          <MaterialCommunityIcons name="plus" size={16} color="#E5E7EB" style={{ marginLeft: 12 }} />
          <View style={styles.zoomChip}>
            <Text style={styles.zoomText}>100%</Text>
            <MaterialCommunityIcons name="chevron-down" size={12} color="#E5E7EB" />
          </View>
          <MaterialCommunityIcons name="fullscreen" size={16} color="#E5E7EB" style={{ marginLeft: 12 }} />
        </View>

        <ScrollView style={{ flex: 1, backgroundColor: C.darker }} contentContainerStyle={{ padding: 14, alignItems: 'center' }}>
          <View style={styles.paper}>
            {/* letter head */}
            <View style={styles.letterHead}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <LogoMark />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.brand}>PathoNexa</Text>
                  <Text style={styles.brandSub}>DIAGNOSTIC LABORATORY</Text>
                  <Text style={styles.brandTag}>{lab.tagline}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.addr}>{lab.name}</Text>
                <Text style={styles.addr}>{lab.address}</Text>
                <Text style={styles.addr}>{lab.address2}</Text>
                <Text style={styles.addr}>{lab.phone}</Text>
                <Text style={styles.addr}>{lab.email}</Text>
              </View>
              <QRBox size={56} />
            </View>

            {/* patient block */}
            <View style={styles.infoGrid}>
              {infoRows.map((r, i) => (
                <View key={i} style={[styles.infoRow, i > 0 && { borderTopWidth: 1, borderTopColor: '#E5E7EB' }]}>
                  <View style={styles.infoCell}>
                    <Text style={styles.infoLbl}>{r[0]}</Text>
                    <Text style={styles.infoVal}>{r[1]}</Text>
                  </View>
                  <View style={[styles.infoCell, { borderLeftWidth: 1, borderLeftColor: '#E5E7EB' }]}>
                    <Text style={styles.infoLbl}>{r[2]}</Text>
                    <Text style={styles.infoVal}>{r[3]}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.reportTitle}>COMPLETE BLOOD COUNT (CBC)</Text>
            <View style={styles.titleRule} />

            {cbcGroups.map((g) => (
              <View key={g.title} style={{ marginTop: 10 }}>
                <Text style={styles.pdfGroup}>{g.title}</Text>
                <View style={styles.pdfTblHead}>
                  <Text style={[styles.pdfTh, { flex: 1.4 }]}>Test Name</Text>
                  <Text style={[styles.pdfTh, { flex: 0.8 }]}>Result</Text>
                  <Text style={[styles.pdfTh, { flex: 0.9 }]}>Unit</Text>
                  <Text style={[styles.pdfTh, { flex: 1.2 }]}>Reference Range</Text>
                </View>
                {g.params.map((p) => (
                  <View key={p.name} style={styles.pdfRow}>
                    <Text style={[styles.pdfTd, { flex: 1.4 }]} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={[styles.pdfTd, { flex: 0.8, fontWeight: '700' }]}>{p.value}</Text>
                    <Text style={[styles.pdfTd, { flex: 0.9 }]}>{p.unit}</Text>
                    <View style={{ flex: 1.2, flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.pdfTd}>{p.range}</Text>
                      {p.flag && <Text style={styles.pdfFlag}>{p.flag}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            ))}

            <Text style={styles.pdfRemarksTitle}>Remarks / Comments</Text>
            <Text style={styles.pdfRemarks}>No significant abnormality detected.</Text>

            {/* signatures */}
            <View style={styles.sigRow}>
              <View style={styles.sigCell}>
                <Text style={styles.sigLbl}>Verified By</Text>
                <Signature />
                <Text style={styles.sigName}>Dr. Rakesh Kumar</Text>
                <Text style={styles.sigSub}>MD (Pathology)</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Stamp />
              </View>
              <View style={styles.sigCell}>
                <Text style={styles.sigLbl}>Authorized By</Text>
                <Signature color="#334" />
                <Text style={styles.sigName}>Lab Incharge</Text>
                <Text style={styles.sigSub}>PathoNexa Diagnostics</Text>
              </View>
            </View>

            <Text style={styles.pdfFoot}>This is a computer generated report and does not require physical signature.</Text>
          </View>
        </ScrollView>

        {/* dark action bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionBtn}>
            <MaterialCommunityIcons name="share-variant" size={14} color="#fff" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <MaterialCommunityIcons name="download-outline" size={14} color="#fff" />
            <Text style={styles.actionText}>Download PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <MaterialCommunityIcons name="printer" size={14} color="#fff" />
            <Text style={styles.actionText}>Print</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <MaterialCommunityIcons name="dots-horizontal" size={14} color="#fff" />
            <Text style={styles.actionText}>More</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  phone: { flex: 1, maxWidth: 520, width: '100%', alignSelf: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E4E9F2', backgroundColor: C.bg, overflow: 'hidden' },
  toolbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.dark, paddingHorizontal: 14, paddingVertical: 9 },
  pageBox: { borderWidth: 1, borderColor: '#3A4656', borderRadius: 5, paddingHorizontal: 10, paddingVertical: 2, marginLeft: 10 },
  pageBoxText: { color: '#E5E7EB', fontSize: 10.5 },
  pageOf: { color: '#9CA3AF', fontSize: 10.5, marginLeft: 6 },
  zoomChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#3A4656', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 12 },
  zoomText: { color: '#E5E7EB', fontSize: 10 },
  paper: { backgroundColor: '#fff', width: '100%', maxWidth: 430, borderRadius: 4, padding: 16, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  letterHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  brand: { color: C.primary, fontSize: 17, fontWeight: '800' },
  brandSub: { color: C.text, fontSize: 7.5, letterSpacing: 1.2, fontWeight: '700', marginTop: 1 },
  brandTag: { color: C.faint, fontSize: 7, marginTop: 2 },
  addr: { color: C.sub, fontSize: 6.8, textAlign: 'right', lineHeight: 9 },
  infoGrid: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 4, marginTop: 12 },
  infoRow: { flexDirection: 'row' },
  infoCell: { flex: 1, flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 6, gap: 6 },
  infoLbl: { fontSize: 7.5, color: C.faint, flexBasis: '38%' as any },
  infoVal: { fontSize: 7.8, color: C.text, fontWeight: '700', flex: 1 },
  reportTitle: { textAlign: 'center', color: C.primary, fontWeight: '800', fontSize: 11, letterSpacing: 0.8, marginTop: 14 },
  titleRule: { height: 1, backgroundColor: '#DBE4F2', marginTop: 4 },
  pdfGroup: { color: C.primary, fontSize: 8.5, fontWeight: '800', marginBottom: 3 },
  pdfTblHead: { flexDirection: 'row', backgroundColor: '#F1F5FB', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 2 },
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
  actionBar: { flexDirection: 'row', gap: 8, backgroundColor: C.dark, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 16 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.primary,
    borderRadius: 8,
    paddingVertical: 9,
  },
  actionText: { color: '#fff', fontSize: 10.5, fontWeight: '700' },
});
