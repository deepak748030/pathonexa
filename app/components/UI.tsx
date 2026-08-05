import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, fonts, radius, shadow } from '@/lib/theme';

export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function MenuRow({ icon, title, subtitle, onPress, danger }: { icon: React.ReactNode; title: string; subtitle?: string; onPress?: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={styles.menuRow}>
      <View style={[styles.menuIcon, danger && { backgroundColor: colors.redLight }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuTitle, danger && { color: colors.danger }]}>{title}</Text>
        {!!subtitle && <Text style={styles.menuSub}>{subtitle}</Text>}
      </View>
      {!danger && <ChevronRight size={16} color={colors.mutedForeground} />}
    </Pressable>
  );
}

export function Badge({ text, tone }: { text: string; tone: 'green' | 'orange' | 'red' | 'primary' }) {
  const map = {
    green: [colors.green, colors.greenLight],
    orange: [colors.orange, colors.orangeLight],
    red: [colors.red, colors.redLight],
    primary: [colors.primary, colors.primaryLight],
  } as const;
  const [fg, bg] = map[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 12, ...shadow },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 14 },
  sectionTitle: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 14 },
  sectionAction: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 12 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  menuIcon: { width: 30, height: 30, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  menuTitle: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 13 },
  menuSub: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10, marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  badgeText: { fontFamily: fonts.semibold, fontSize: 10 },
});
