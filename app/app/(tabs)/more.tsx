import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  ArrowLeftRight, Stethoscope, FlaskConical, Users, Building2, Landmark, Percent, CreditCard,
  FileText, CloudUpload, Trash2, Building, Settings, Shield, HelpCircle, Info, LogOut,
  Bell, FlaskConical as Beaker, Receipt, BarChart3, Wallet, Crown,
} from 'lucide-react-native';
import ScreenHeader, { HeaderIcon } from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import HeaderUser from '@/components/HeaderUser';
import { Card, MenuRow, FadeIn } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { lab } from '@/lib/labData';
import { useAuth } from '@/lib/auth';
import { useServerStatus } from '@/lib/serverStatus';
import { useCan, useRole, type Permission } from '@/lib/permissions';
import { endpoints } from '@/lib/api';

const groups: {
  title: string;
  items: { title: string; subtitle: string; Icon: any; href: string; perm?: Permission }[];
}[] = [
  {
    title: 'MANAGE',
    items: [
      { title: 'Doctors', subtitle: 'Manage referring doctors', Icon: Stethoscope, href: '/manage/doctors', perm: 'doctors' },
      { title: 'Tests & Packages', subtitle: 'Manage tests and packages', Icon: FlaskConical, href: '/manage/tests', perm: 'tests' },
      { title: 'Patients', subtitle: 'Manage patient records', Icon: Users, href: '/(tabs)/patients', perm: 'patients' },
      { title: 'Lab Employees', subtitle: 'Manage lab staff and roles', Icon: Building2, href: '/manage/employees', perm: 'staff' },
      { title: 'Sample Collection Center', subtitle: 'Manage collection centers', Icon: Landmark, href: '/manage/centers', perm: 'tests' },
      { title: 'Discount & Charges', subtitle: 'Manage discounts and extra charges', Icon: Percent, href: '/manage/discounts', perm: 'payments' },
      { title: 'Payments & Ledger', subtitle: 'Collections, receipts and payment modes', Icon: CreditCard, href: '/manage/transactions', perm: 'payments' },
      { title: 'Doctor Commission', subtitle: 'Wallets, payouts and history', Icon: Wallet, href: '/manage/commissions', perm: 'commissions' },
      { title: 'Expenses', subtitle: 'Track lab expenses by category', Icon: Receipt, href: '/manage/expenses', perm: 'expenses' },
    ],
  },
  {
    title: 'REPORTS & DATA',
    items: [
      { title: 'Analytics', subtitle: 'Revenue, profit and test insights', Icon: BarChart3, href: '/manage/analytics', perm: 'analytics' },
      { title: 'Report Templates', subtitle: 'Manage report templates', Icon: FileText, href: '/manage/templates', perm: 'tests' },
      { title: 'Data Backup', subtitle: 'Backup and restore data', Icon: CloudUpload, href: '/manage/backup', perm: 'backup' },
      { title: 'Deleted Records', subtitle: 'View deleted patients & reports', Icon: Trash2, href: '/manage/deleted' },
    ],
  },
  {
    title: 'SETTINGS & SUPPORT',
    items: [
      { title: 'Lab Profile', subtitle: 'View and edit lab details', Icon: Building, href: '/manage/lab', perm: 'settings' },
      { title: 'Settings', subtitle: 'General app settings', Icon: Settings, href: '/manage/settings', perm: 'settings' },
      { title: 'Users & Roles', subtitle: 'Staff, roles and permissions', Icon: Shield, href: '/manage/roles', perm: 'staff' },
      { title: 'Subscription', subtitle: 'Plan, validity and invoices', Icon: Crown, href: '/manage/subscription', perm: 'subscription' },
      { title: 'Help & Support', subtitle: 'Get help and contact support', Icon: HelpCircle, href: '/manage/help' },
      { title: 'About App', subtitle: 'App version and information', Icon: Info, href: '/manage/about' },
    ],
  },
];

export default function More() {
  const logout = useAuth((s) => s.logout);
  const can = useCan();
  const role = useRole();
  const { online, checking, check } = useServerStatus();
  const [unread, setUnread] = React.useState(0);

  useFocusEffect(React.useCallback(() => {
    check();
    endpoints.notifications.count().then((r) => setUnread(r?.unread || 0)).catch(() => setUnread(0));
  }, [check]));

  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <AppScreen
      header={
        <ScreenHeader
          title="More"
          subtitle="Manage your lab, settings and more"
          right={
            <HeaderIcon onPress={() => router.push('/notifications' as any)}>
              <View>
                <Bell size={20} color="#FFFFFF" />
                {unread > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeTxt}>{unread > 9 ? '9+' : unread}</Text>
                  </View>
                )}
              </View>
            </HeaderIcon>
          }
        />
      }
    >
      <FadeIn>
        <Card style={styles.labCard}>
          <View style={styles.labLogo}>
            <Beaker size={22} color={colors.primary} strokeWidth={2.2} />
          </View>
          <View style={styles.labCol}>
            <Text style={styles.labName} numberOfLines={2}>{lab.name}</Text>
            <Text style={styles.labMeta} numberOfLines={1}>{lab.city}</Text>
            <Text style={styles.labMeta} numberOfLines={1}>Lab ID: {lab.labId} · Signed in as {role}</Text>
          </View>
          <Pressable style={styles.switchBtn} onPress={() => router.push('/manage/lab' as any)}>
            <ArrowLeftRight size={13} color={colors.primary} />
            <Text style={styles.switchText}>Switch Lab</Text>
          </Pressable>
        </Card>
      </FadeIn>

      {checking && online === null ? <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} /> : null}

      {groups.map((g, gi) => {
        const items = g.items.filter((it) => !it.perm || can(it.perm));
        if (!items.length) return null;
        return (
        <FadeIn key={g.title} delay={80 + gi * 50}>
          <Text style={styles.groupTitle}>{g.title}</Text>
          <Card style={{ padding: 0 }}>
            {items.map((it, i) => (
              <MenuRow
                key={it.title}
                last={i === items.length - 1}
                title={it.title}
                subtitle={it.subtitle}
                icon={<it.Icon size={17} color={colors.primary} strokeWidth={2.1} />}
                onPress={() => router.push(it.href as any)}
              />
            ))}
          </Card>
        </FadeIn>
        );
      })}

      <FadeIn delay={280}>
        <Pressable style={styles.logout} onPress={onLogout}>
          <LogOut size={16} color={colors.danger} />
          <View>
            <Text style={styles.logoutTitle}>Logout</Text>
            <Text style={styles.logoutSub}>Logout from your account</Text>
          </View>
        </Pressable>
      </FadeIn>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  labCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  labLogo: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  labCol: { flex: 1, minWidth: 0 },
  labName: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 14 },
  labMeta: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 11, marginTop: 2 },
  switchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.pill,
  },
  switchText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 11.5 },
  groupTitle: {
    color: colors.mutedForeground, fontFamily: fonts.semibold, fontSize: 10.5,
    letterSpacing: 0.7, marginTop: 20, marginBottom: 8, marginLeft: 4,
  },
  logout: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18,
    backgroundColor: colors.redLight, borderRadius: radius.md, padding: 14,
    borderWidth: 1, borderColor: '#FECACA',
  },
  logoutTitle: { color: colors.danger, fontFamily: fonts.semibold, fontSize: 13.5 },
  logoutSub: { color: colors.danger, fontFamily: fonts.regular, fontSize: 11, opacity: 0.8, marginTop: 1 },
  badge: {
    position: 'absolute', top: -5, right: -7, minWidth: 16, height: 16, borderRadius: 8,
    paddingHorizontal: 3, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.primary,
  },
  badgeTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 9 },
});
