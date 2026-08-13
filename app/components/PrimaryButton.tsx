import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, fonts, radius, sizes } from '@/lib/theme';

export default function PrimaryButton({
  title, onPress, loading, disabled,
}: { title: string; onPress?: () => void; loading?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      style={[styles.btn, (loading || disabled) && { opacity: 0.65 }]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.txt}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: sizes.button,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  txt: { color: '#FFFFFF', fontSize: 14, fontFamily: fonts.bold },
});
