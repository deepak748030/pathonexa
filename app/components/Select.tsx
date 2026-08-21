import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native';
import { Check, ChevronDown, X } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '@/lib/theme';

type Option = string | { label: string; value: string; sub?: string };

const norm = (o: Option) => (typeof o === 'string' ? { label: o, value: o } : o);

/** Chip row picker — used for payment modes, categories, statuses, plans. */
export function ChipSelect({
  options, value, onChange, small,
}: {
  options: Option[]; value?: string; onChange: (v: string) => void; small?: boolean;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map((raw) => {
        const o = norm(raw);
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.chip, small && styles.chipSmall, on && styles.chipOn]}
          >
            <Text style={[styles.chipTxt, small && { fontSize: 11 }, on && styles.chipTxtOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Dropdown-style select with a bottom sheet list (long option sets). */
export default function Select({
  label, value, placeholder = 'Select', options, onChange, required, hint,
}: {
  label?: string;
  value?: string;
  placeholder?: string;
  options: Option[];
  onChange: (v: string) => void;
  required?: boolean;
  hint?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = options.map(norm).find((o) => o.value === value);

  return (
    <View style={{ marginBottom: 12 }}>
      {!!label && (
        <Text style={styles.label}>
          {label}{required ? <Text style={{ color: colors.red }}> *</Text> : null}
        </Text>
      )}
      <Pressable style={[styles.box, !!value && styles.boxFilled]} onPress={() => setOpen(true)}>
        <Text style={[styles.boxTxt, !value && { color: colors.placeholder }]} numberOfLines={1}>
          {selected?.label || placeholder}
        </Text>
        <ChevronDown size={16} color={colors.mutedForeground} />
      </Pressable>
      {!!hint && <Text style={styles.hint}>{hint}</Text>}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{label || 'Select'}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={10}><X size={18} color={colors.mutedForeground} /></Pressable>
          </View>
          <ScrollView style={{ maxHeight: 380 }}>
            {options.map((raw) => {
              const o = norm(raw);
              const on = o.value === value;
              return (
                <Pressable
                  key={o.value}
                  style={styles.row}
                  onPress={() => { onChange(o.value); setOpen(false); }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTxt, on && { color: colors.primary }]}>{o.label}</Text>
                    {!!o.sub && <Text style={styles.rowSub}>{o.sub}</Text>}
                  </View>
                  {on ? <Check size={16} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontFamily: fonts.semibold, color: colors.foreground, marginBottom: 6 },
  box: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    minHeight: spacing.input, borderRadius: radius.sm, paddingHorizontal: 12,
    borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.inputBg,
  },
  boxFilled: { borderColor: '#93C5FD' },
  boxTxt: { flex: 1, fontFamily: fonts.medium, fontSize: 13.5, color: colors.foreground },
  hint: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10.5, marginTop: 4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)' },
  sheet: {
    backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    paddingBottom: 24, paddingHorizontal: 6,
  },
  sheetHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 14,
  },
  sheetTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.foreground },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 13,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  rowTxt: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.foreground },
  rowSub: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  chipRow: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
  },
  chipSmall: { paddingHorizontal: 11, paddingVertical: 7 },
  chipOn: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipTxt: { fontFamily: fonts.semibold, fontSize: 12, color: colors.mutedForeground },
  chipTxtOn: { color: colors.primary },
});
