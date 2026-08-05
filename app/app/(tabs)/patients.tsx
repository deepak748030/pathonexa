import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Menu, Search, SlidersHorizontal, Plus, ChevronRight, Phone, Users, UserPlus, ClipboardList, IndianRupee, Download, Upload, Layers, Copy } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import StatCard from '@/components/StatCard';
import Avatar from '@/components/Avatar';
import { Card } from '@/components/UI';
import { colors, fonts, radius, spacing, shadow } from '@/lib/theme';
import { patients, patientStats } from '@/lib/labData';

const statIcons = [Users, UserPlus, ClipboardList, IndianRupee];
const tools = [
  { label: 'Import Patients', Icon: Download },
  { label: 'Export Patients', Icon: Upload },
  { label: 'Patient Groups', Icon: Layers },
  { label: 'Duplicates', Icon: Copy },
];

export default function Patients() {
  const [q, setQ] = useState('');
  const list = patients.filter((p) => (p.name + p.mobile + p.pid).toLowerCase().includes(q.toLowerCase()));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Patients"
        subtitle="Manage all patient records"
        left={<Menu size={22} color="#FFFFFF" />}
        onLeftPress={() => router.push('/menu' as any)}
        right={
          <>
            <Search size={19} color="#FFFFFF" />
            <SlidersHorizontal size={18} color="#FFFFFF" />
            <Pressable style={styles.addBtn} onPress={() => router.push('/add-patient' as any)}>
              <Plus size={13} color={colors.primary} strokeWidth={3} />
              <Text style={styles.addBtnText}>Add Patient</Text>
            </Pressable>
          </>
        }
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {patientStats.map((s, i) => {
            const Icon = statIcons[i];
            return (
              <View key={s.label} style={styles.gridItem}>
                <StatCard compact label={s.label} value={s.value} tone={s.tone} icon={<Icon size={16} color={colors[s.tone === 'primary' ? 'primary' : s.tone]} />} />
              </View>
            );
          })}
        </View>

        <View style={styles.searchBox}>
          <Search size={16} color={colors.mutedForeground} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by Name, Mobile, Patient ID..."
            placeholderTextColor={colors.mutedForeground}
            style={styles.searchInput}
          />
        </View>

        <Card style={{ padding: 0, marginTop: 10 }}>
          {list.map((p) => (
            <Pressable key={p.id} style={styles.row}>
              <Avatar name={p.name} color={p.color} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.meta}>PID: {p.pid}</Text>
                <Text style={styles.meta}>{p.age} Yrs  •  {p.gender}  •  {p.blood}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <View style={styles.phoneRow}>
                  <Phone size={11} color={colors.primary} />
                  <Text style={styles.phone}>{p.mobile}</Text>
                </View>
                <Text style={styles.meta}>Last Test: {p.lastTestDate}</Text>
                <Text style={styles.test}>{p.lastTest}</Text>
              </View>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </Card>

        <Card style={styles.tools}>
          {tools.map((t) => (
            <Pressable key={t.label} style={styles.tool}>
              <t.Icon size={17} color={colors.primary} />
              <Text style={styles.toolText}>{t.label}</Text>
            </Pressable>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.sm },
  addBtnText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 11 },
  body: { paddingHorizontal: spacing.hPad, paddingBottom: 24, marginTop: -14 },
  grid: { flexDirection: 'row', gap: 6 },
  gridItem: { flex: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: 10, marginTop: 10, ...shadow },
  searchInput: { flex: 1, height: 40, color: colors.foreground, fontFamily: fonts.regular, fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  name: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 13 },
  meta: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10, marginTop: 1 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  phone: { color: colors.foreground, fontFamily: fonts.medium, fontSize: 10 },
  test: { color: colors.primary, fontFamily: fonts.medium, fontSize: 10 },
  tools: { flexDirection: 'row', marginTop: 12 },
  tool: { flex: 1, alignItems: 'center', gap: 4 },
  toolText: { color: colors.foreground, fontFamily: fonts.medium, fontSize: 9 },
});
