import React from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { digitsOnly } from '@/lib/format';

const H = spacing.input ?? 48;

type Props = {
  label?: string;
  required?: boolean;
  value: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad' | 'email-address' | 'decimal-pad';
  multiline?: boolean;
  editable?: boolean;
  onPress?: () => void;
  right?: React.ReactNode;
  maxLength?: number;
  /** Restrict to digits only (used for mobile / PIN / age). */
  digits?: number;
  hint?: string;
  error?: string;
};

export default function Field({
  label, required, value, onChangeText, placeholder, icon, keyboardType, multiline,
  editable = true, onPress, right, maxLength, digits, hint, error,
}: Props) {
  const filled = !!value;
  const onChange = (t: string) => {
    if (!onChangeText) return;
    if (typeof digits === 'number') onChangeText(digitsOnly(t, digits));
    else onChangeText(t);
  };

  const box = (
    <View style={[
      styles.wrap,
      filled && styles.filled,
      !!error && styles.err,
      multiline && styles.multi,
      !editable && !onPress && styles.disabled,
    ]}>
      {icon}
      {onPress ? (
        <Text style={[styles.text, !value && styles.ph]} numberOfLines={1}>{value || placeholder}</Text>
      ) : (
        <TextInput
          style={[styles.input, multiline && { minHeight: 72, textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          keyboardType={digits ? 'number-pad' : keyboardType}
          editable={editable}
          multiline={multiline}
          maxLength={digits ?? maxLength}
        />
      )}
      {right}
    </View>
  );

  return (
    <View style={styles.group}>
      {!!label && (
        <Text style={styles.label}>
          {label}{required ? <Text style={styles.req}> *</Text> : null}
        </Text>
      )}
      {onPress ? <Pressable onPress={onPress}>{box}</Pressable> : box}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!error && !!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 12 },
  label: { fontSize: 12, fontFamily: fonts.semibold, color: colors.foreground, marginBottom: 6 },
  req: { color: colors.red },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: H,
    backgroundColor: colors.inputBg,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    gap: 8,
  },
  filled: { borderColor: '#93C5FD' },
  err: { borderColor: colors.red },
  disabled: { backgroundColor: colors.muted },
  multi: { height: undefined, minHeight: 88, alignItems: 'flex-start', paddingVertical: 10 },
  input: { flex: 1, minHeight: H - 2, fontFamily: fonts.medium, fontSize: 13.5, color: colors.foreground, outlineStyle: 'none' as any, padding: 0 },
  text: { flex: 1, fontFamily: fonts.medium, fontSize: 13.5, color: colors.foreground },
  ph: { color: colors.placeholder },
  error: { color: colors.red, fontFamily: fonts.medium, fontSize: 10.5, marginTop: 4 },
  hint: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10.5, marginTop: 4 },
});
