import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import {
  Bell, ArrowLeftRight, Stethoscope, FlaskConical, Users, Building2, Landmark, Percent, CreditCard,
  FileText, DatabaseBackup, Trash2, Building, Settings, ShieldCheck, HelpCircle, Info, LogOut,
} from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import { Card, MenuRow, FadeIn } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { lab } from '@/lib/labData';

const groups = [
  {
    title: 'MANAGE',
    items: [
      { title: 'Doctors', subtitle: 'Manage referring doctors', Icon: Stethoscope },
      { title: 'Tests & Packages', subtitle: 'Manage tests and packages', Icon: FlaskConical },
      { title: 'Patients', subtitle: 'Manage patient records', Icon: Users, href: '/(tabs)/patients' },
      { title: 'Lab Employees', subtitle: 'Manage lab staff and roles', Icon: Building2 },
      { title: 'Sample Collection Center', subtitle: 'Manage collection centers', Icon: Landmark },
      { title: 'Discount & Charges', subtitle: 'Discounts and extra charges', Icon: Percent },
      { title: 'Payment Methods', subtitle: 'Manage payment modes', Icon: CreditCard },
    ],
  },
  {
    title: 'REPORTS & DATA',
    items: [
      { title: 'Report Templates', subtitle: 'Manage report templates', Icon: FileText },
      { title: 'Data Backup', subtitle: 'Backup and restore data', Icon: DatabaseBackup },
      { title: 'Deleted Records', subtitle: 'View deleted patients & reports', Icon: Trash2 },
    ],
  },
  {
    title: 'SETTINGS & SUPPORT',
    items: [
      { title: 'Lab Profile', subtitle: 'View and edit lab details', Icon: Building },
      { title: 'Settings', subtitle: 'General app settings', Icon: Settings },
      { title: 'Users & Roles', subtitle: 'Manage app users and roles', Icon: ShieldCheck },
      { title: 'Help & Support', subtitle: 'Get help and contact support', Icon: HelpCircle },
      { title: 'About App', subtitle: 'App version and information', Icon: Info },
    ],
  },
];

export default function More() {
  return (
    <View style={styles.screen}>
      <ScreenHeader title="More" subtitle="Manage your lab, settings and more" right={<Bell size={20} color="#FFFFFF" />} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <FadeIn>
          <Card style={styles.labCard}>
            <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
            <View style={styles.labCol}>
              <Text style={styles.labName} numberOfLines={2}>{lab.name}</Text>
              <Text style={styles.labMeta} numberOfLines={1}>{lab.city}</Text>
              <Text style={styles.labMeta} numberOfLines={1}>Lab ID: {lab.labId}</Text>
            </View>
            <Pressable style={({ pressed }) => [styles.switchBtn, pressed && { opacity: 0.7 }]}>
              <ArrowLeftRight size={13} color={colors.primary} />
              <Text style={styles.switchText}>Switch</Text>
            </Pressable>
          </Card>
        </FadeIn>

        {groups.map((g, gi) => (
          <FadeIn key={g.title} delay={60 + gi * 50}>
            <Text style={styles.groupTitle}>{g.title}</Text>
            <Card style={{ padding: 0 }}>
              {g.items.map((it, i) => (
                <MenuRow
                  key={it.title}
                  last={i === g.items.length - 1}
                  title={it.title}
                  subtitle={it.subtitle}
                  icon={<it.Icon size={16} color={colors.primary} />}
                  onPress={() => (it as any).href && router.push((it as any).href)}
                />
              ))}
            </Card>
          </FadeIn>
        ))}

        <FadeIn delay={240}>
          <Card style={{ padding: 0, marginTop: 16, backgroundColor: colors.redLight, borderColor: colors.red }}>
            <MenuRow last danger title="Logout" subtitle="Logout from your account" icon={<LogOut size={16} color={colors.danger} />} />
          </Card>
        </FadeIn>
        <Text style={styles.version}>App Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: spacing.hPad, paddingTop: 14, paddingBottom: 28 },
  labCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  labCol: { flex: 1, minWidth: 0 },
  logo: { width: 40, height: 40, borderRadius: radius.xs },
  labName: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 13 },
  labMeta: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10, marginTop: 1 },
  switchBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.sm },
  switchText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 11 },
  groupTitle: { color: colors.mutedForeground, fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 0.6, marginTop: 18, marginBottom: 8 },
  version: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10, textAlign: 'center', marginTop: 14 },
});
