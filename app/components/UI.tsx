import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { ChevronRight, WifiOff } from 'lucide-react-native';
import { colors, fonts, radius } from '@/lib/theme';
import { useServerStatus } from '@/lib/serverStatus';

/** Flat panel: hairline border, minimal radius, never a shadow. */
export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Subtle entrance animation used to stagger sections and list rows. */
export function FadeIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) {
  const v = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 260,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, v]);
  return (
    <Animated.View
      style={[
        style,
        { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Seamless grid: children sit edge to edge with ZERO gaps (gap: 0),
 * separated only by hairline dividers so nothing floats or overlaps.
 */
export function GridPanel({ children, columns = 3 }: { children: React.ReactNode; columns?: number }) {
  const items = React.Children.toArray(children);
  const rows = Math.ceil(items.length / columns);
  return (
    <View style={styles.gridPanel}>
      {items.map((child, i) => {
        const isLastCol = (i + 1) % columns === 0;
        const isLastRow = Math.floor(i / columns) === rows - 1;
        return (
          <View
            key={i}
            style={[
              { width: `${100 / columns}%` },
              !isLastCol && styles.colDivider,
              !isLastRow && styles.rowDivider,
            ]}
          >
            {child}
          </View>
        );
      })}
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!action && (
        <Pressable onPress={onAction} hitSlop={10} style={styles.sectionActionBtn}>
          <Text style={styles.sectionAction}>{action}</Text>
          <ChevronRight size={13} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

export function MenuRow({ icon, title, subtitle, onPress, danger, last }: { icon: React.ReactNode; title: string; subtitle?: string; onPress?: () => void; danger?: boolean; last?: boolean }) {
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

/** Contiguous list row: ZERO gap between rows, single hairline divider. */
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

/**
 * Selectable filter chip. Render a row of chips with gap 0 inside a Card
 * (use `segmented` + index > 0 divider) so they read as one control.
 */
export function Chip({ label, active, onPress, divider }: { label: string; active: boolean; onPress?: () => void; divider?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        divider && styles.chipDivider,
        active && styles.chipActive,
        pressed && styles.rowPressed,
      ]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

/** Empty list placeholder. */
export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
    </View>
  );
}

/**
 * Slim amber banner shown whenever the backend is unreachable and the
 * screen is therefore rendering sample data.
 */
export function OfflineBanner() {
  const online = useServerStatus((s) => s.online);
  if (online !== false) return null;
  return (
    <View style={styles.banner}>
      <WifiOff size={13} color="#92400E" />
      <Text style={styles.bannerText}>Server offline — showing sample data</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, padding: 12, overflow: 'hidden' },
  gridPanel: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, overflow: 'hidden' },
  colDivider: { borderRightWidth: 1, borderRightColor: colors.border },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 16 },
  sectionTitle: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 14 },
  sectionActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionAction: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 12 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuTextCol: { flex: 1, minWidth: 0 },
  noDivider: { borderBottomWidth: 0 },
  rowPressed: { backgroundColor: colors.muted },
  menuIcon: { width: 30, height: 30, borderRadius: radius.xs, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  menuTitle: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 13 },
  menuSub: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10, marginTop: 1 },
  listRow: { paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.xs },
  badgeText: { fontFamily: fonts.semibold, fontSize: 10 },
  chip: { flex: 1, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  chipDivider: { borderLeftWidth: 1, borderLeftColor: colors.border },
  chipActive: { backgroundColor: colors.primaryLight },
  chipText: { color: colors.mutedForeground, fontFamily: fonts.semibold, fontSize: 11 },
  chipTextActive: { color: colors.primary },
  empty: { paddingVertical: 40, paddingHorizontal: 16, alignItems: 'center' },
  emptyTitle: { fontFamily: fonts.semibold, color: colors.mutedForeground, fontSize: 13, textAlign: 'center' },
  emptySub: { fontFamily: fonts.regular, color: colors.placeholder, fontSize: 11, marginTop: 3, textAlign: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8 },
  bannerText: { color: '#92400E', fontFamily: fonts.medium, fontSize: 10.5, flex: 1 },
});
