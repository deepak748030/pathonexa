import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  ArrowLeftRight, Stethoscope, FlaskConical, Users, Building2, Landmark, Percent, CreditCard,
  FileText, DatabaseBackup, Trash2, Building, Settings, HelpCircle, Info, LogOut,
  WifiOff, Database,
} from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import HeaderUser from '@/components/HeaderUser';
import { Card, MenuRow, FadeIn } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { lab } from '@/lib/labData';
import { useAuth } from '@/lib/auth';
import { useServerStatus } from '@/lib/serverStatus';
import { API_URL } from '@/lib/api';

const groups = [
  {
    title: 'MANAGE',
    items: [
      { title: 'Doctors', subtitle: 'Manage referring doctors', Icon: Stethoscope, href: '/manage/doctors' },
      { title: 'Tests & Packages', subtitle: 'Manage tests and packages', Icon: FlaskConical, href: '/manage/tests' },
      { title: 'Patients', subtitle: 'Manage patient records', Icon: Users, href: '/(tabs)/patients' },
      { title: 'Lab Employees', subtitle: 'Manage lab staff and roles', Icon: Building2, href: '/manage/employees' },
      { title: 'Sample Collection Center', subtitle: 'Manage collection centers', Icon: Landmark, href: '/manage/centers' },
      { title: 'Discount & Charges', subtitle: 'Discounts and extra charges', Icon: Percent, href: '/manage/discounts' },
      { title: 'Payment Methods', subtitle: 'Manage payment modes', Icon: CreditCard, href: '/manage/payments' },
    ],
  },
  {
    title: 'REPORTS & DATA',
    items: [
      { title: 'Report Templates', subtitle: 'Manage report templates', Icon: FileText, href: '/manage/templates' },
      { title: 'Data Backup', subtitle: 'Backup and restore data', Icon: DatabaseBackup, href: '/manage/backup' },
      { title: 'Deleted Records', subtitle: 'View deleted patients & reports', Icon: Trash2, href: '/manage/deleted' },
    ],
  },
  {
    title: 'SETTINGS & SUPPORT',
    items: [
      { title: 'Lab Profile', subtitle: 'View and edit lab details', Icon: Building, href: '/manage/lab' },
      { title: 'Settings', subtitle: 'General app settings', Icon: Settings, href: '/manage/settings' },
      { title: 'Help & Support', subtitle: 'Get help and contact support', Icon: HelpCircle, href: '/manage/help' },
      { title: 'About App', subtitle: 'App version and information', Icon: Info, href: '/manage/about' },
    ],
  },
];

export default function More() {
  const logout = useAuth((s) => s.logout);
  const { online, dbMode, checking, check } = useServerStatus();

  useFocusEffect(
    React.useCallback(() => {
      check();
    }, [check])
  );

  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="More"
        subtitle="Manage your lab, settings and more"
        right={<HeaderUser />}
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <FadeIn>
          <Card style={styles.labCard}>
            <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
            <View style={styles.labCol}>
              <Text style={styles.labName} numberOfLines={2}>{lab.name}</Text>
              <Text style={styles.labMeta} numberOfLines={1}>{lab.city}</Text>
              <Text style={styles.labMeta} numberOfLines={1}>Lab ID: {lab.labId}</Text>
            </View>
            <Pressable style={({ pressed }) => [styles.switchBtn, pressed && { opacity: 0.7 }]} onPress={() => router.push('/manage/lab' as any)}>
              <ArrowLeftRight size={13} color={colors.primary} />
              <Text style={styles.switchText}>Switch</Text>
            </Pressable>
          </Card>
        </FadeIn>

        {/* Live server connection status */}
        <FadeIn delay={50}>
          <Text style={styles.groupTitle}>SERVER STATUS</Text>
          <Card style={styles.serverCard}>
            {checking && online === null ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-start' }} />
            ) : online ? (
              <>
                <View style={[styles.statusDot, { backgroundColor: colors.green }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.serverTitle}>Connected to server</Text>
                  <Text style={styles.serverSub} numberOfLines={1}>{API_URL}</Text>
                </View>
                <View style={styles.dbPill}>
                  <Database size={11} color={dbMode === 'mongodb' ? colors.green : colors.purple} />
                  <Text style={[styles.dbPillText, { color: dbMode === 'mongodb' ? colors.green : colors.purple }]}>
                    {dbMode === 'mongodb' ? 'MongoDB' : 'In-memory'}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={[styles.statusDot, { backgroundColor: colors.red }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.serverTitle, { color: colors.danger }]}>Server offline</Text>
                  <Text style={styles.serverSub} numberOfLines={1}>Start it with: cd server && npm run dev</Text>
                </View>
                <Pressable style={styles.retryBtn} onPress={check}>
                  <WifiOff size={13} color={colors.danger} />
                </Pressable>
              </>
            )}
          </Card>
        </FadeIn>

        {groups.map((g, gi) => (
          <FadeIn key={g.title} delay={100 + gi * 50}>
            <Text style={styles.groupTitle}>{g.title}</Text>
            <Card style={{ padding: 0 }}>
              {g.items.map((it, i) => (
                <MenuRow
                  key={it.title}
                  last={i === g.items.length - 1}
                  title={it.title}
                  subtitle={it.subtitle}
                  icon={<it.Icon size={16} color={colors.primary} />}
                  onPress={() => (it as any).href && router.push((it as any).href as any)}
                />
              ))}
            </Card>
          </FadeIn>
        ))}

        <FadeIn delay={280}>
          <Card style={{ padding: 0, marginTop: 16, backgroundColor: colors.redLight, borderColor: colors.red }}>
            <MenuRow last danger title="Logout" subtitle="Logout from your account" icon={<LogOut size={16} color={colors.danger} />} onPress={onLogout} />
          </Card>
        </FadeIn>
        <Text style={styles.version}>App Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: spacing.hPad, paddingTop: 4, paddingBottom: 28 },
  labCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  labCol: { flex: 1, minWidth: 0 },
  logo: { width: 40, height: 40, borderRadius: radius.xs },
  labName: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 13 },
  labMeta: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10, marginTop: 1 },
  switchBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.sm },
  switchText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 11 },
  groupTitle: { color: colors.mutedForeground, fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 0.6, marginTop: 18, marginBottom: 8 },
  serverCard: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: radius.pill },
  serverTitle: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 12.5 },
  serverSub: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10, marginTop: 1 },
  dbPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.muted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.xs },
  dbPillText: { fontFamily: fonts.semibold, fontSize: 9.5 },
  retryBtn: { width: 30, height: 30, borderRadius: radius.xs, backgroundColor: colors.redLight, alignItems: 'center', justifyContent: 'center' },
  version: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10, textAlign: 'center', marginTop: 14 },
});
