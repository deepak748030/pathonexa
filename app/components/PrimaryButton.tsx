import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, fonts, radius, spacing } from '@/lib/theme';

const H = spacing.button ?? 52;

export default function PrimaryButton({
  title, onPress, loading, disabled, icon, ghost,
}: {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  ghost?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        ghost && styles.ghost,
        (loading || disabled) && { opacity: 0.55 },
        pressed && { opacity: 0.88 },
      ]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      {loading ? (
        <ActivityIndicator color={ghost ? colors.primary : '#fff'} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text style={[styles.txt, ghost && styles.ghostTxt]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: H,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ghost: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  txt: { color: '#FFFFFF', fontSize: 15, fontFamily: fonts.bold },
  ghostTxt: { color: colors.foreground },
});
