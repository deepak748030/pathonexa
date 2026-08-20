import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '@/lib/theme';
import { initials } from '@/lib/format';

export default function Avatar({
  name, color, size = 40, circle = true,
}: { name: string; color?: string; size?: number; circle?: boolean }) {
  return (
    <View style={[styles.wrap, {
      width: size,
      height: size,
      borderRadius: circle ? size / 2 : 10,
      backgroundColor: color || colors.primaryLight,
    }]}>
      <Text style={[styles.txt, { fontSize: size * 0.32 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  txt: { color: colors.navy, fontFamily: fonts.bold },
});
