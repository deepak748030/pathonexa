import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Home, Users, FileText, FilePlus, Stethoscope, FlaskConical, Building2, Landmark, Percent,
  CreditCard, DatabaseBackup, Trash2, Building, Settings, ShieldCheck, HelpCircle, Info, LogOut, ChevronRight,
} from 'lucide-react-native';
import Avatar from '@/components/Avatar';
import { colors, fonts, radius } from '@/lib/theme';
import { lab } from '@/lib/labData';

const sections = [
  { title: 'MAIN', items: [
    { title: 'Dashboard', Icon: Home, href: '/(tabs)' },
    { title: 'Patients', Icon: Users, href: '/(tabs)/patients' },
    { title: 'Reports', Icon: FileText, href: '/(tabs)/reports' },
    { title: 'Create Report', Icon: FilePlus, href: '/create-report' },
  ]},
  { title: 'MANAGE', items: [
    { title: 'Doctors', Icon: Stethoscope },
    { title: 'Tests & Packages', Icon: FlaskConical },
    { title: 'Lab Employees', Icon: Building2 },
    { title: 'Sample Collection', Icon: Landmark },
    { title: 'Discount & Charges', Icon: Percent },
    { title: 'Payment Methods', Icon: CreditCard },
  ]},
  { title: 'DATA & BACKUP', items: [
    { title: 'Report Templates', Icon: FileText },
    { title: 'Data Backup', Icon: DatabaseBackup },
    { title: 'Deleted Records', Icon: Trash2 },
  ]},
  { title: 'SETTINGS & SUPPORT', items: [
    { title: 'Lab Profile', Icon: Building },
    { title: 'Settings', Icon: Settings },
    { title: 'Users & Roles', Icon: ShieldCheck },
    { title: 'Help & Support', Icon: HelpCircle },
    { title: 'About App', Icon: Info },
  ]},
];

export default function MenuDrawer() {
  const insets = useSafeAreaInsets();
  const go = (href?: string) => {
    router.back();
    if (href) setTimeout(() => router.push(href as any), 60);
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <LinearGradient colors={[colors.primary, colors.primaryGradientEnd]} style={[styles.head, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headRow}>
            <Image source={require('../assets/images/icon.png')} style={styles.logo} />
            <View style={{ flex: 1 }}>
              <Text style={styles.labName} numberOfLines={1}>{lab.shortName}</Text>
              <Text style={styles.labMeta}>{lab.city}</Text>
              <Text style={styles.labMeta}>Lab ID: {lab.labId}</Text>
            </View>
            <View style={styles.activePill}><Text style={styles.activeText}>Active</Text></View>
          </View>
          <View style={styles.userCard}>
            <Avatar name={lab.admin} />
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{lab.admin}</Text>
              <Text style={styles.userRole}>{lab.role}</Text>
              <Text style={styles.online}>● Online</Text>
            </View>
            <ChevronRight size={16} color={colors.mutedForeground} />
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {sections.map((s) => (
            <View key={s.title}>
              <Text style={styles.section}>{s.title}</Text>
              {s.items.map((it) => (
                <Pressable key={it.title} style={styles.row} onPress={() => go((it as any).href)}>
                  <it.Icon size={16} color={colors.primary} />
                  <Text style={styles.rowText}>{it.title}</Text>
                  <ChevronRight size={15} color={colors.mutedForeground} />
                </Pressable>
              ))}
            </View>
          ))}

          <Pressable style={styles.logout} onPress={() => router.back()}>
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
  panel: { width: '80%', backgroundColor: colors.card },
  head: { paddingHorizontal: 12, paddingBottom: 12 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF' },
  labName: { color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 13 },
  labMeta: { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.regular, fontSize: 10 },
  activePill: { backgroundColor: colors.green, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  activeText: { color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 9 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: radius.md, padding: 8, marginTop: 12 },
  userName: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 12 },
  userRole: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10 },
  online: { color: colors.green, fontFamily: fonts.medium, fontSize: 9 },
  section: { color: colors.mutedForeground, fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 0.6, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 9 },
  rowText: { flex: 1, color: colors.foreground, fontFamily: fonts.medium, fontSize: 12 },
  logout: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 12, padding: 10, borderRadius: radius.md, backgroundColor: colors.redLight },
  logoutText: { color: colors.danger, fontFamily: fonts.semibold, fontSize: 12 },
  logoutSub: { color: colors.danger, fontFamily: fonts.regular, fontSize: 9, opacity: 0.8 },
  version: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10, paddingHorizontal: 14 },
});
