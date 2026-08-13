import React from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { colors, fonts, radius, spacing } from '@/lib/theme';

const H = spacing.input ?? 46;

type Props = {
  label?: string;
  value: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad' | 'email-address';
  multiline?: boolean;
  editable?: boolean;
  onPress?: () => void;
  right?: React.ReactNode;
};

export default function Field({
  label, value, onChangeText, placeholder, icon, keyboardType, multiline, editable = true, onPress, right,
}: Props) {
  const filled = !!value;
  const box = (
    <View style={[styles.wrap, filled && styles.filled, multiline && styles.multi]}>
      {icon}
      {onPress ? (
        <Text style={[styles.text, !value && styles.ph]} numberOfLines={1}>{value || placeholder}</Text>
      ) : (
        <TextInput
          style={[styles.input, multiline && { height: H * 1.6, textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          keyboardType={keyboardType}
          editable={editable}
          multiline={multiline}
        />
      )}
      {right}
    </View>
  );

  return (
    <View style={styles.group}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      {onPress ? <Pressable onPress={onPress}>{box}</Pressable> : box}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 12 },
  label: { fontSize: 11, fontFamily: fonts.semibold, color: colors.mutedForeground, marginBottom: 5, letterSpacing: 0.3, textTransform: 'uppercase' },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: H,
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    gap: 8,
  },
  filled: { borderColor: '#93C5FD' },
  multi: { height: undefined, minHeight: H, alignItems: 'flex-start', paddingVertical: 8 },
  input: { flex: 1, height: H, fontFamily: fonts.medium, fontSize: 13, color: colors.foreground, outlineStyle: 'none' as any, padding: 0 },
  text: { flex: 1, fontFamily: fonts.medium, fontSize: 13, color: colors.foreground },
  ph: { color: colors.placeholder },
});
