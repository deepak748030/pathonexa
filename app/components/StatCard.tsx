import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, fonts, radius, shadow } from '@/lib/theme';

export type Tone = 'primary' | 'green' | 'orange' | 'purple' | 'red';

export const toneColor: Record<Tone, { fg: string; bg: string }> = {
  primary: { fg: colors.primary, bg: colors.primaryLight },
  green: { fg: colors.green, bg: colors.greenLight },
  orange: { fg: colors.orange, bg: colors.orangeLight },
  purple: { fg: colors.purple, bg: colors.purpleLight },
  red: { fg: colors.red, bg: colors.redLight },
};

type Props = {
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
  icon?: React.ReactNode;
  compact?: boolean;
  onPress?: () => void;
};

export default function StatCard({ label, value, sub, tone = 'primary', icon, compact, onPress }: Props) {
  const t = toneColor[tone];
  return (
    <Pressable onPress={onPress} style={[styles.card, compact && styles.compact]}>
      <View style={[styles.top, compact && { justifyContent: 'center' }]}>
        <View style={[styles.iconBox, { backgroundColor: t.bg }]}>{icon}</View>
        {!compact && <Text style={styles.label} numberOfLines={1}>{label}</Text>}
      </View>
      <View style={[styles.bottom, compact && { justifyContent: 'center' }]}>
        <Text style={[styles.value, compact && { textAlign: 'center' }]} numberOfLines={1}>{value}</Text>
        {!compact && onPress ? <ChevronRight size={14} color={t.fg} /> : null}
      </View>
      <Text style={[styles.sub, compact && { textAlign: 'center' }]} numberOfLines={1}>{compact ? label : sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 10, ...shadow },
  compact: { alignItems: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBox: { width: 28, height: 28, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 10 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  value: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 17 },
  sub: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 9, marginTop: 2 },
});
