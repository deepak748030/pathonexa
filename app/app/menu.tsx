import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Home, Users, FileText, FilePlus, Stethoscope, FlaskConical, Building2, Landmark, Percent,
  CreditCard, CloudUpload, Trash2, Building, Settings, Shield, HelpCircle, Info, LogOut,
  ChevronRight, Bell, Receipt, BarChart3, Wallet, Crown,
} from 'lucide-react-native';
import Avatar from '@/components/Avatar';
import { colors, fonts, radius } from '@/lib/theme';
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
    { title: 'Sample Collection Center', Icon: Landmark, href: '/manage/centers' },
    { title: 'Discount & Charges', Icon: Percent, href: '/manage/discounts' },
    { title: 'Payments & Ledger', Icon: CreditCard, href: '/manage/transactions' },
    { title: 'Doctor Commission', Icon: Wallet, href: '/manage/commissions' },
    { title: 'Expenses', Icon: Receipt, href: '/manage/expenses' },
  ]},
  { title: 'DATA & BACKUP', items: [
    { title: 'Analytics', Icon: BarChart3, href: '/manage/analytics' },
    { title: 'Report Templates', Icon: FileText, href: '/manage/templates' },
    { title: 'Data Backup', Icon: CloudUpload, href: '/manage/backup' },
    { title: 'Deleted Records', Icon: Trash2, href: '/manage/deleted' },
  ]},
  { title: 'SETTINGS & SUPPORT', items: [
    { title: 'Lab Profile', Icon: Building, href: '/manage/lab' },
    { title: 'Settings', Icon: Settings, href: '/manage/settings' },
    { title: 'Users & Roles', Icon: Shield, href: '/manage/roles' },
    { title: 'Subscription', Icon: Crown, href: '/manage/subscription' },
    { title: 'Help & Support', Icon: HelpCircle, href: '/manage/help' },
    { title: 'About App', Icon: Info, href: '/manage/about' },
  ]},
];

export default function MenuDrawer() {
  const insets = useSafeAreaInsets();
  const logout = useAuth((s) => s.logout);
  const user = useAuth((s) => s.user);
  const go = (href?: string) => {
    router.back();
    if (href) setTimeout(() => router.push(href as any), 80);
  };
  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={[styles.head, { paddingTop: insets.top + 14 }]}>
          <View style={styles.headTop}>
            <View style={styles.labIcon}>
              <FlaskConical size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.labName} numberOfLines={1}>{lab.name.replace(' Pvt. Ltd.', '')}</Text>
                <View style={styles.activePill}><Text style={styles.activeText}>Active</Text></View>
              </View>
              <Text style={styles.labMeta}>{lab.city}</Text>
              <Text style={styles.labMeta}>Lab ID: {lab.labId}</Text>
            </View>
            <Pressable onPress={() => go('/notifications')} style={styles.bell}>
              <Bell size={18} color="#fff" />
              <View style={styles.badge} />
            </Pressable>
          </View>
          <Pressable style={styles.userCard} onPress={() => go('/manage/lab')}>
            <Avatar name={user?.name || lab.admin} size={40} circle />
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user?.name || lab.admin}</Text>
              <Text style={styles.userRole}>{lab.role}</Text>
            </View>
            <View style={styles.onlineDot} />
            <Text style={styles.online}>Online</Text>
            <ChevronRight size={16} color={colors.mutedForeground} />
          </Pressable>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
          {sections.map((s) => (
            <View key={s.title}>
              <Text style={styles.section}>{s.title}</Text>
              {s.items.map((it) => (
                <Pressable
                  key={it.title}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed, it.title === 'Dashboard' && styles.rowActive]}
                  onPress={() => go(it.href)}
                >
                  <it.Icon size={17} color={it.title === 'Dashboard' ? colors.primary : colors.foreground} strokeWidth={2.1} />
                  <Text style={[styles.rowText, it.title === 'Dashboard' && { color: colors.primary, fontFamily: fonts.semibold }]}>{it.title}</Text>
                  <ChevronRight size={15} color={colors.mutedForeground} />
                </Pressable>
              ))}
            </View>
          ))}

          <Pressable style={styles.logout} onPress={onLogout}>
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
  panel: { width: '84%', backgroundColor: '#FFFFFF' },
  head: { paddingHorizontal: 16, paddingBottom: 16 },
  headTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  labIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  labName: { color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 14, flexShrink: 1 },
  labMeta: { color: 'rgba(255,255,255,0.82)', fontFamily: fonts.regular, fontSize: 11, marginTop: 1 },
  activePill: { backgroundColor: colors.green, paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill },
  activeText: { color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 9 },
  bell: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF',
    borderRadius: radius.md, padding: 10, marginTop: 14,
  },
  userName: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 13.5 },
  userRole: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 11, marginTop: 1 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
  online: { color: colors.green, fontFamily: fonts.medium, fontSize: 10 },
  section: {
    color: colors.mutedForeground, fontFamily: fonts.semibold, fontSize: 10,
    letterSpacing: 0.7, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  rowActive: { backgroundColor: colors.primaryLight },
  rowPressed: { backgroundColor: colors.muted },
  rowText: { flex: 1, color: colors.foreground, fontFamily: fonts.medium, fontSize: 13.5 },
  logout: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 18,
    padding: 12, borderRadius: radius.sm, backgroundColor: colors.redLight,
  },
  logoutText: { color: colors.danger, fontFamily: fonts.semibold, fontSize: 13 },
  logoutSub: { color: colors.danger, fontFamily: fonts.regular, fontSize: 10, opacity: 0.8 },
  version: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 11, textAlign: 'center', marginTop: 14 },
});
