import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Home, Users, FileText, FilePlus, Stethoscope, FlaskConical, Building2, Landmark, Percent,
  CreditCard, DatabaseBackup, Trash2, Building, Settings, HelpCircle, Info, LogOut, ChevronRight,
} from 'lucide-react-native';
import Avatar from '@/components/Avatar';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { lab } from '@/lib/labData';
import { useAuth } from '@/lib/auth';

const sections = [
  { title: 'MAIN', items: [
    { title: 'Dashboard', Icon: Home, href: '/(tabs)' },
    { title: 'Patients', Icon: Users, href: '/(tabs)/patients' },
    { title: 'Reports', Icon: FileText, href: '/(tabs)/reports' },
    { title: 'Create Report', Icon: FilePlus, href: '/create-report' },
  ]},
  { title: 'MANAGE', items: [
    { title: 'Doctors', Icon: Stethoscope, href: '/manage/doctors' },
    { title: 'Tests & Packages', Icon: FlaskConical, href: '/manage/tests' },
    { title: 'Lab Employees', Icon: Building2, href: '/manage/employees' },
    { title: 'Sample Collection', Icon: Landmark, href: '/manage/centers' },
    { title: 'Discount & Charges', Icon: Percent, href: '/manage/discounts' },
    { title: 'Payment Methods', Icon: CreditCard, href: '/manage/payments' },
  ]},
  { title: 'DATA & BACKUP', items: [
    { title: 'Report Templates', Icon: FileText, href: '/manage/templates' },
    { title: 'Data Backup', Icon: DatabaseBackup, href: '/manage/backup' },
    { title: 'Deleted Records', Icon: Trash2, href: '/manage/deleted' },
  ]},
  { title: 'SETTINGS & SUPPORT', items: [
    { title: 'Lab Profile', Icon: Building, href: '/manage/lab' },
    { title: 'Settings', Icon: Settings, href: '/manage/settings' },
    { title: 'Help & Support', Icon: HelpCircle, href: '/manage/help' },
    { title: 'About App', Icon: Info, href: '/manage/about' },
  ]},
];

export default function MenuDrawer() {
  const insets = useSafeAreaInsets();
  const logout = useAuth((s) => s.logout);
  const go = (href?: string) => {
    router.back();
    if (href) setTimeout(() => router.push(href as any), 60);
  };
  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <LinearGradient colors={[colors.primary, colors.primaryGradientEnd]} style={[styles.head, { paddingTop: insets.top + 14 }]}>
          <View style={styles.headRow}>
            <Image source={require('../assets/images/icon.png')} style={styles.logo} />
            <View style={styles.headCol}>
              <Text style={styles.labName} numberOfLines={1}>{lab.shortName}</Text>
              <Text style={styles.labMeta} numberOfLines={1}>{lab.city}</Text>
              <Text style={styles.labMeta} numberOfLines={1}>Lab ID: {lab.labId}</Text>
            </View>
            <View style={styles.activePill}><Text style={styles.activeText}>Active</Text></View>
          </View>
          <View style={styles.userCard}>
            <Avatar name={lab.admin} size={34} circle />
            <View style={styles.headCol}>
              <Text style={styles.userName} numberOfLines={1}>{lab.admin}</Text>
              <Text style={styles.userRole} numberOfLines={1}>{lab.role}</Text>
            </View>
            <Text style={styles.online}>Online</Text>
            <ChevronRight size={16} color={colors.mutedForeground} />
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
          {sections.map((s) => (
            <View key={s.title}>
              <Text style={styles.section}>{s.title}</Text>
              <View style={styles.group}>
                {s.items.map((it, i) => (
                  <Pressable
                    key={it.title}
                    style={({ pressed }) => [styles.row, i === s.items.length - 1 && styles.rowLast, pressed && styles.rowPressed]}
                    onPress={() => go((it as any).href)}
                  >
                    <it.Icon size={16} color={colors.primary} />
                    <Text style={styles.rowText} numberOfLines={1}>{it.title}</Text>
                    <ChevronRight size={15} color={colors.mutedForeground} />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          <Pressable style={({ pressed }) => [styles.logout, pressed && { opacity: 0.8 }]} onPress={onLogout}>
            <LogOut size={16} color={colors.danger} />
            <View>
              <Text style={styles.logoutText}>Logout</Text>
              <Text style={styles.logoutSub}>Logout from your account</Text>
            </View>
          </Pressable>
          <Text style={styles.version}>App Version 1.0.0</Text>
        </ScrollView>
      </View>

      <Pressable style={{ flex: 1 }} onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(15,23,42,0.45)' },
  panel: { width: '82%', backgroundColor: colors.background, borderRightWidth: 1, borderRightColor: colors.border },
  head: { paddingHorizontal: spacing.hPad, paddingBottom: 14 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headCol: { flex: 1, minWidth: 0 },
  logo: { width: 38, height: 38, borderRadius: radius.xs, backgroundColor: '#FFFFFF' },
  labName: { color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 13 },
  labMeta: { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.regular, fontSize: 10, marginTop: 1 },
  activePill: { backgroundColor: colors.green, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.xs },
  activeText: { color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 9 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: radius.sm, padding: 10, marginTop: 14 },
  userName: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 12 },
  userRole: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10, marginTop: 1 },
  online: { color: colors.green, fontFamily: fonts.medium, fontSize: 9 },
  section: { color: colors.mutedForeground, fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 0.6, paddingHorizontal: spacing.hPad, paddingTop: 16, paddingBottom: 6 },
  group: { backgroundColor: colors.card, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.hPad, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLast: { borderBottomWidth: 0 },
  rowPressed: { backgroundColor: colors.muted },
  rowText: { flex: 1, color: colors.foreground, fontFamily: fonts.medium, fontSize: 12 },
  logout: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 14, marginTop: 18, padding: 12, borderRadius: radius.sm, backgroundColor: colors.redLight, borderWidth: 1, borderColor: colors.red },
  logoutText: { color: colors.danger, fontFamily: fonts.semibold, fontSize: 12 },
  logoutSub: { color: colors.danger, fontFamily: fonts.regular, fontSize: 9, opacity: 0.8, marginTop: 1 },
  version: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10, textAlign: 'center', marginTop: 14 },
});
