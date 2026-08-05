import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing } from '@/lib/theme';

type Props = {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  /** Optional secondary row rendered under the title (never overlaps it). */
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
      style={[styles.wrap, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.row}>
        {left ? (
          <Pressable onPress={onLeftPress} hitSlop={12} style={styles.leftBtn}>{left}</Pressable>
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

const styles = StyleSheet.create({
  // Flat header: no rounded corners, no shadow, no negative overlap below.
  wrap: { paddingHorizontal: spacing.hPad, paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  leftBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  titleCol: { flex: 1, minWidth: 0 },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flexShrink: 0 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  title: { color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 17 },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.medium, fontSize: 11, marginTop: 2 },
});
