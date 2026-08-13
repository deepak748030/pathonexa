import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '@/lib/theme';

export default function Avatar({
  name, color, size = 36, circle,
}: { name: string; color?: string; size?: number; circle?: boolean }) {
  const initials = (name || 'U').split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'U';
  return (
    <View style={[styles.wrap, {
      width: size,
      height: size,
      borderRadius: circle ? size / 2 : radius.sm,
      backgroundColor: color || colors.primaryLight,
    }]}>
      <Text style={[styles.txt, { fontSize: size * 0.34 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  txt: { color: colors.navy, fontFamily: fonts.bold },
});
