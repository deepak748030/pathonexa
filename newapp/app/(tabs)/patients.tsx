// Patients — UI PDF screen 2
import React from 'react';
import { T } from '../../components/T';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlueHeader, HeaderIconBtn, HeaderWhiteBtn, ScrollPage, Card, MiniStat, SearchBar, SquareBtn, Avatar, Chevron } from '../../components/kit';
import { useDrawer } from '../../components/Drawer';
import { C } from '../../src/theme';
import { toneColor, patients, patientStats } from '../../src/data';

const footActions = [
  { icon: 'import', label: 'Import Patients' },
  { icon: 'export', label: 'Export Patients' },
  { icon: 'account-group-outline', label: 'Patient Groups' },
  { icon: 'content-copy', label: 'Duplicates' },
];

export default function Patients() {
  const { setOpen } = useDrawer();
  const router = useRouter();
  return (
    <ScrollPage>
      <BlueHeader
        menu
        onBack={() => setOpen(true)}
        title="Patients"
        sub="Manage all patient records"
        right={
          <>
            <HeaderIconBtn icon="magnify" />
            <HeaderIconBtn icon="filter-variant" />
            <HeaderWhiteBtn icon="plus" label="Add Patient" onPress={() => router.push('/add-patient')} />
          </>
        }
      />

      <View style={styles.body}>
        <View style={styles.statRow}>
          {patientStats.map((s) => (
            <MiniStat key={s.label} {...s} />
          ))}
        </View>

        <View style={[styles.row, { marginTop: 14 }]}>
          <SearchBar placeholder="Search by Name, Mobile, Patient ID..." />
          <SquareBtn icon="barcode-scan" />
        </View>

        <Card style={{ marginTop: 14, padding: 4 }}>
          {patients.map((p, i) => (
            <View key={p.id} style={[styles.pRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.borderSoft }]}>
              <Avatar initials={p.initials} tone={p.tone} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <T style={styles.pName}>{p.name}</T>
                <View style={styles.row}>
                  <T style={styles.pPid}>PID: {p.pid}</T>
                  <MaterialCommunityIcons name="barcode" size={13} color={C.faint} style={{ marginLeft: 6 }} />
                </View>
                <T style={styles.pMeta}>
                  {p.age} &nbsp;•&nbsp; {p.gender} &nbsp;•&nbsp; {p.blood}
                </T>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={styles.row}>
                  <MaterialCommunityIcons name="phone" size={11} color={C.sub} style={{ marginRight: 5 }} />
                  <T style={styles.pPhone}>{p.phone}</T>
                </View>
                <T style={styles.pLast}>Last Test: {p.lastTest}</T>
                <T style={[styles.pTest, { color: toneColor[p.testTone].fg }]}>{p.test}</T>
              </View>
              <View style={{ marginLeft: 8 }}>
                <Chevron />
              </View>
            </View>
          ))}
        </Card>

        <Card style={{ marginTop: 14, paddingVertical: 16 }}>
          <View style={styles.row}>
            {footActions.map((a) => (
              <TouchableOpacity key={a.label} style={styles.footTile}>
                <MaterialCommunityIcons name={a.icon as any} size={20} color={C.primary} />
                <T style={styles.footLabel} numberOfLines={1}>
                  {a.label}
                </T>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </View>
    </ScrollPage>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  pRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  pName: { fontSize: 13.5, fontWeight: '700', color: C.text },
  pPid: { fontSize: 10.5, color: C.faint, marginTop: 2 },
  pMeta: { fontSize: 10.5, color: C.sub, marginTop: 4 },
  pPhone: { fontSize: 11.5, color: C.text, fontWeight: '600' },
  pLast: { fontSize: 10, color: C.faint, marginTop: 4 },
  pTest: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  footTile: { flex: 1, alignItems: 'center', gap: 8 },
  footLabel: { fontSize: 10, color: C.text, fontWeight: '600' },
});
