import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '@/lib/theme';

const H = spacing.search ?? 46;

export default function SearchBar({
  value, onChangeText, placeholder,
}: { value: string; onChangeText: (t: string) => void; placeholder?: string }) {
  return (
    <View style={styles.wrap}>
      <Search size={16} color={colors.mutedForeground} strokeWidth={2.2} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'Search...'}
        placeholderTextColor={colors.placeholder}
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: H,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  input: { flex: 1, height: H, fontFamily: fonts.medium, fontSize: 13, color: colors.foreground, padding: 0 },
});
