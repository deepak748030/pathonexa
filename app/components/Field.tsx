import React from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { colors, fonts, radius } from '@/lib/theme';

type Props = {
  label: string;
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
  const inner = (
    <View style={[styles.wrap, filled && styles.filled, multiline && styles.multi]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      {onPress ? (
        <Text style={[styles.text, !value && styles.ph]} numberOfLines={1}>{value || placeholder}</Text>
      ) : (
        <TextInput
          style={[styles.input, multiline && { height: 72, textAlignVertical: 'top' }]}
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
      <Text style={styles.label}>{label}</Text>
      {onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 14 },
  label: { fontSize: 11, fontFamily: fonts.semibold, color: colors.mutedForeground, marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' },
  wrap: {
    flexDirection: 'row', alignItems: 'center', minHeight: 52,
    backgroundColor: colors.inputBg, borderRadius: radius.md,
    paddingHorizontal: 8, borderWidth: 1.5, borderColor: colors.inputBorder,
  },
  filled: { borderColor: '#93C5FD', backgroundColor: '#F8FBFF' },
  multi: { alignItems: 'flex-start', paddingVertical: 8 },
  icon: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, marginLeft: 10, height: 50, fontFamily: fonts.medium, fontSize: 14, color: colors.foreground, outlineStyle: 'none' as any },
  text: { flex: 1, marginLeft: 10, fontFamily: fonts.medium, fontSize: 14, color: colors.foreground },
  ph: { color: colors.placeholder },
});
