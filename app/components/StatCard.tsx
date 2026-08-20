import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, fonts, radius, shadow, toneMap } from '@/lib/theme';

export type Tone = keyof typeof toneMap;

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
  const t = toneMap[tone] || toneMap.primary;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.top}>
        {icon ? <View style={[styles.iconBox, { backgroundColor: t.bg }]}>{icon}</View> : null}
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        {onPress ? <ChevronRight size={14} color={t.fg} /> : <View style={{ width: 8 }} />}
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {!compact && !!sub && <Text style={styles.sub} numberOfLines={1}>{sub}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    ...shadow,
  },
  pressed: { opacity: 0.92 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { color: colors.foreground, fontFamily: fonts.extrabold, fontSize: 20, letterSpacing: -0.3 },
  label: { flex: 1, color: colors.mutedForeground, fontFamily: fonts.semibold, fontSize: 11 },
  sub: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10.5, marginTop: 3 },
});
