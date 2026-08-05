import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '@/lib/theme';

export default function Avatar({ name, color, size = 36 }: { name: string; color?: string; size?: number }) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: radius.sm, backgroundColor: color || colors.primaryLight }]}>
      <Text style={[styles.txt, { fontSize: size * 0.34 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  txt: { color: colors.navy, fontFamily: fonts.bold },
});
