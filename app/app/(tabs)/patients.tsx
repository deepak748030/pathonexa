import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Menu, Search, SlidersHorizontal, Plus, ChevronRight, Phone, Users, UserPlus, ClipboardList, IndianRupee, Download, Upload, Layers, Copy } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import StatCard from '@/components/StatCard';
import Avatar from '@/components/Avatar';
import { Card, GridPanel, FadeIn, ListRow, SectionTitle } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { patients, patientStats } from '@/lib/labData';

const statIcons = [Users, UserPlus, ClipboardList, IndianRupee];
const tools = [
  { label: 'Import', Icon: Download },
  { label: 'Export', Icon: Upload },
  { label: 'Groups', Icon: Layers },
  { label: 'Duplicates', Icon: Copy },
];

export default function Patients() {
  const [q, setQ] = useState('');
  const list = patients.filter((p) => (p.name + p.mobile + p.pid).toLowerCase().includes(q.toLowerCase()));

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Patients"
        subtitle="Manage all patient records"
        left={<Menu size={22} color="#FFFFFF" />}
        onLeftPress={() => router.push('/menu' as any)}
        right={<SlidersHorizontal size={19} color="#FFFFFF" />}
        actions={
          <>
            <View style={styles.headerSearch}>
              <Search size={15} color="rgba(255,255,255,0.9)" />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Search name, mobile or patient ID"
                placeholderTextColor="rgba(255,255,255,0.75)"
                style={styles.headerInput}
              />
            </View>
            <Pressable style={styles.addBtn} onPress={() => router.push('/add-patient' as any)}>
              <Plus size={14} color={colors.primary} strokeWidth={3} />
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          </>
        }
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <FadeIn>
          <GridPanel columns={2}>
            {patientStats.map((s, i) => {
              const Icon = statIcons[i];
              return (
                <StatCard
                  key={s.label}
                  compact
                  label={s.label}
                  value={s.value}
                  tone={s.tone}
                  icon={<Icon size={15} color={colors[s.tone === 'primary' ? 'primary' : s.tone]} />}
                />
              );
            })}
          </GridPanel>
        </FadeIn>

        <SectionTitle title={`All Patients (${list.length})`} />
        <FadeIn delay={60}>
          <Card style={{ padding: 0 }}>
            {list.map((p, i) => (
              <ListRow key={p.id} last={i === list.length - 1}>
                <View style={styles.row}>
                  <Avatar name={p.name} color={p.color} size={38} />
                  <View style={styles.col}>
                    <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.meta} numberOfLines={1}>{p.pid}</Text>
                    <Text style={styles.meta} numberOfLines={1}>{p.age} Yrs · {p.gender} · {p.blood}</Text>
                  </View>
                  <View style={styles.right}>
                    <View style={styles.phoneRow}>
                      <Phone size={11} color={colors.primary} />
                      <Text style={styles.phone}>{p.mobile}</Text>
                    </View>
                    <Text style={styles.test} numberOfLines={1}>{p.lastTest}</Text>
                    <Text style={styles.meta} numberOfLines={1}>{p.lastTestDate}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </View>
              </ListRow>
            ))}
            {list.length === 0 && <Text style={styles.empty}>No patients match your search.</Text>}
          </Card>
        </FadeIn>

        <SectionTitle title="Tools" />
        <FadeIn delay={120}>
          <GridPanel columns={4}>
            {tools.map((t) => (
              <Pressable key={t.label} style={({ pressed }) => [styles.tool, pressed && styles.toolPressed]}>
                <t.Icon size={17} color={colors.primary} />
                <Text style={styles.toolText} numberOfLines={1}>{t.label}</Text>
              </Pressable>
            ))}
          </GridPanel>
        </FadeIn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  headerSearch: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radius.sm, paddingHorizontal: 10, height: 32 },
  headerInput: { flex: 1, color: '#FFFFFF', fontFamily: fonts.regular, fontSize: 12, padding: 0 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 10, height: 32, borderRadius: radius.sm },
  addBtnText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 12 },
  body: { paddingHorizontal: spacing.hPad, paddingTop: 4, paddingBottom: 28 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  col: { flex: 1, minWidth: 0 },
  right: { alignItems: 'flex-end', gap: 2 },
  name: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 13 },
  meta: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10, marginTop: 1 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  phone: { color: colors.foreground, fontFamily: fonts.medium, fontSize: 10 },
  test: { color: colors.primary, fontFamily: fonts.medium, fontSize: 10 },
  empty: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 12, textAlign: 'center', paddingVertical: 24 },
  tool: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, backgroundColor: colors.card },
  toolPressed: { backgroundColor: colors.muted },
  toolText: { color: colors.foreground, fontFamily: fonts.medium, fontSize: 10 },
});
