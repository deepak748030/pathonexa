import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Microscope } from 'lucide-react-native';
import { colors, fonts } from '@/lib/theme';

export default function LabLogo({ size = 44 }: { size?: number }) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.sr, { fontSize: size * 0.18 }]}>SRPL</Text>
      <Text style={[styles.lab, { fontSize: size * 0.14, marginTop: -1 }]}>LAB</Text>
      <Microscope size={size * 0.34} color={colors.primary} strokeWidth={2.2} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  sr: { color: colors.primary, fontFamily: fonts.extrabold, letterSpacing: 0.4, lineHeight: 12 },
  lab: { color: colors.primary, fontFamily: fonts.bold, letterSpacing: 0.6, lineHeight: 10 },
});
