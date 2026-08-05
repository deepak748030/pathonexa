import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, radius, spacing } from '@/lib/theme';

type Props = {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onLeftPress?: () => void;
};

export default function ScreenHeader({ title, subtitle, left, right, onLeftPress }: Props) {
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
          <Pressable onPress={onLeftPress} hitSlop={10} style={styles.leftBtn}>{left}</Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>
        <View style={styles.rightRow}>{right}</View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.hPad, paddingBottom: 26, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  leftBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 18 },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.medium, fontSize: 11, marginTop: 1 },
});
