// More — UI PDF screen 8
import React from 'react';
import { T } from '../../components/T';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlueHeader, HeaderIconBtn, ScrollPage, Card, Chevron } from '../../components/kit';
import { C } from '../../src/theme';
import { lab, moreSections } from '../../src/data';

export default function More() {
  return (
    <ScrollPage>
      <BlueHeader title="More" sub="Manage your lab, settings and more" right={<HeaderIconBtn icon="bell" badge={3} />} />

      <View style={styles.body}>
        <Card style={[styles.labCard, { marginTop: -6 }]}>
          <View style={styles.labIcon}>
            <MaterialCommunityIcons name="flask" size={26} color={C.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <T style={styles.labName}>{lab.name}</T>
            <T style={styles.labSub}>{lab.city}</T>
            <T style={styles.labSub}>Lab ID: {lab.labId}</T>
          </View>
          <TouchableOpacity style={styles.switchBtn}>
            <MaterialCommunityIcons name="swap-horizontal" size={15} color={C.primary} />
            <T style={styles.switchBtnText}>Switch Lab</T>
          </TouchableOpacity>
        </Card>

        {moreSections.map((sec) => (
          <View key={sec.title}>
            <T style={styles.secTitle}>{sec.title}</T>
            <Card style={{ padding: 4 }}>
              {sec.items.map((it, i) => (
                <TouchableOpacity key={it.label} style={[styles.item, i > 0 && { borderTopWidth: 1, borderTopColor: C.borderSoft }]}>
                  <View style={styles.itemIcon}>
                    <MaterialCommunityIcons name={it.icon as any} size={19} color={C.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <T style={styles.itemLabel}>{it.label}</T>
                    <T style={styles.itemSub}>{it.sub}</T>
                  </View>
                  <Chevron />
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}

        <TouchableOpacity style={styles.logout}>
          <View style={styles.itemIconRed}>
            <MaterialCommunityIcons name="logout" size={19} color={C.red} />
          </View>
          <View style={{ marginLeft: 12 }}>
            <T style={styles.logoutTitle}>Logout</T>
            <T style={styles.logoutSub}>Logout from your account</T>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollPage>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 14 },
  labCard: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  labIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#E8F0FE', alignItems: 'center', justifyContent: 'center' },
  labName: { fontSize: 13.5, fontWeight: '800', color: C.text },
  labSub: { fontSize: 11, color: C.sub, marginTop: 2 },
  switchBtn: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CFE0FB',
    backgroundColor: '#F7FAFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  switchBtnText: { color: C.primary, fontSize: 11.5, fontWeight: '700' },
  secTitle: { fontSize: 10, color: C.faint, fontWeight: '700', letterSpacing: 0.6, marginTop: 16, marginBottom: 7, marginLeft: 4 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 10 },
  itemIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#E8F0FE', alignItems: 'center', justifyContent: 'center' },
  itemIconRed: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#FBDCDC', alignItems: 'center', justifyContent: 'center' },
  itemLabel: { fontSize: 13, fontWeight: '700', color: C.text },
  itemSub: { fontSize: 10.5, color: C.faint, marginTop: 2 },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEEEE',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F6D8D8',
    padding: 12,
    marginTop: 16,
  },
  logoutTitle: { color: C.red, fontWeight: '700', fontSize: 13 },
  logoutSub: { color: C.sub, fontSize: 10.5, marginTop: 1 },
});
