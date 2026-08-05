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
      style={[styles.wrap, { paddingTop: insets.top + 10 }]}
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
  // Compact flat header: minimal vertical space, no shadow, no rounded corners.
  wrap: { paddingHorizontal: 10, paddingBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  leftBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  titleCol: { flex: 1, minWidth: 0 },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 0 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  title: { color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 16, lineHeight: 21 },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.medium, fontSize: 10, lineHeight: 13 },
});
