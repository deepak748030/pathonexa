import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, fonts, radius } from '@/lib/theme';

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
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.top}>
        <View style={[styles.iconBox, { backgroundColor: t.bg }]}>{icon}</View>
        {onPress ? <ChevronRight size={13} color={colors.mutedForeground} /> : null}
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.label} numberOfLines={2}>{label}</Text>
      {!compact && !!sub && <Text style={styles.sub} numberOfLines={1}>{sub}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Flat cell: no radius, no shadow. Dividers come from the grid wrapper.
  card: { flex: 1, backgroundColor: colors.card, paddingHorizontal: 10, paddingVertical: 10, justifyContent: 'flex-start' },
  pressed: { backgroundColor: colors.muted },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  iconBox: { width: 26, height: 26, borderRadius: radius.xs, alignItems: 'center', justifyContent: 'center' },
  value: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 16 },
  label: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 10, marginTop: 2, lineHeight: 13 },
  sub: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 9, marginTop: 1 },
});
