import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, radius } from '@/lib/theme';

type Props = {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  actions?: React.ReactNode;
  onLeftPress?: () => void;
};

export default function ScreenHeader({ title, subtitle, left, right, actions, onLeftPress }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryGradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, { paddingTop: insets.top + 10 }]}
    >
      <View style={styles.row}>
        {left ? (
          <Pressable onPress={onLeftPress} hitSlop={12} style={styles.iconBtn}>
            {left}
          </Pressable>
        ) : null}
        <View style={styles.titleCol}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>
        {right ? <View style={styles.rightRow}>{right}</View> : null}
      </View>
      {actions ? <View style={styles.actionsRow}>{actions}</View> : null}
    </LinearGradient>
  );
}

export function HeaderIcon({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.iconBtn}>
      {children}
    </Pressable>
  );
}

export function HeaderPill({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.pill, pressed && { opacity: 0.85 }]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.headerPad,
    paddingBottom: 28,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: { flex: 1, minWidth: 0 },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  title: { color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 20, lineHeight: 26 },
  subtitle: { color: 'rgba(255,255,255,0.82)', fontFamily: fonts.medium, fontSize: 11.5, lineHeight: 16, marginTop: 1 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
});
