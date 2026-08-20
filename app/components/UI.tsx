import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { ChevronRight, WifiOff } from 'lucide-react-native';
import { colors, fonts, radius, shadow, softShadow } from '@/lib/theme';
import { useServerStatus } from '@/lib/serverStatus';

export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function FadeIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) {
  const v = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 280,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, v]);
  return (
    <Animated.View
      style={[
        style,
        { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!action && (
        <Pressable onPress={onAction} hitSlop={10} style={styles.sectionActionBtn}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function MenuRow({
  icon, title, subtitle, onPress, danger, last,
}: {
  icon: React.ReactNode; title: string; subtitle?: string; onPress?: () => void; danger?: boolean; last?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuRow, last && styles.noDivider, pressed && styles.rowPressed]}>
      <View style={[styles.menuIcon, danger && { backgroundColor: colors.redLight }]}>{icon}</View>
      <View style={styles.menuTextCol}>
        <Text style={[styles.menuTitle, danger && { color: colors.danger }]} numberOfLines={1}>{title}</Text>
        {!!subtitle && <Text style={styles.menuSub} numberOfLines={1}>{subtitle}</Text>}
      </View>
      {!danger && <ChevronRight size={16} color={colors.mutedForeground} />}
    </Pressable>
  );
}

export function ListRow({ children, onPress, last }: { children: React.ReactNode; onPress?: () => void; last?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.listRow, last && styles.noDivider, pressed && styles.rowPressed]}>
      {children}
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

export function Chip({
  label, active, onPress, sub,
}: {
  label: string; active: boolean; onPress?: () => void; sub?: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.85 }]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>{label}</Text>
      {!!sub && <Text style={[styles.chipSub, active && styles.chipTextActive]}>{sub}</Text>}
    </Pressable>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
    </View>
  );
}

export function OfflineBanner() {
  const online = useServerStatus((s) => s.online);
  if (online !== false) return null;
  return (
    <View style={styles.banner}>
      <WifiOff size={13} color="#92400E" />
      <Text style={styles.bannerText}>Server offline — showing saved sample data</Text>
    </View>
  );
}

export function IconCircle({
  children, bg, size = 36,
}: {
  children: React.ReactNode; bg: string; size?: number;
}) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2, backgroundColor: bg,
      alignItems: 'center', justifyContent: 'center',
    }}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    ...shadow,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 18,
  },
  sectionTitle: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 15.5 },
  sectionActionBtn: { flexDirection: 'row', alignItems: 'center' },
  sectionAction: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 12.5 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuTextCol: { flex: 1, minWidth: 0 },
  noDivider: { borderBottomWidth: 0 },
  rowPressed: { backgroundColor: colors.muted },
  menuIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  menuTitle: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 13.5 },
  menuSub: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 11, marginTop: 1 },
  listRow: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.xs },
  badgeText: { fontFamily: fonts.semibold, fontSize: 10 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.mutedForeground, fontFamily: fonts.semibold, fontSize: 12 },
  chipTextActive: { color: '#FFFFFF' },
  chipSub: { color: colors.placeholder, fontFamily: fonts.medium, fontSize: 9.5, marginTop: 1 },
  empty: { paddingVertical: 40, paddingHorizontal: 16, alignItems: 'center' },
  emptyTitle: { fontFamily: fonts.semibold, color: colors.mutedForeground, fontSize: 13, textAlign: 'center' },
  emptySub: { fontFamily: fonts.regular, color: colors.placeholder, fontSize: 11, marginTop: 3, textAlign: 'center' },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A',
    borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10,
  },
  bannerText: { color: '#92400E', fontFamily: fonts.medium, fontSize: 11, flex: 1 },
});
