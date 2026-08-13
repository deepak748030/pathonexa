import React from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { colors, spacing } from '@/lib/theme';

export default function Screen({
  children, scroll = true, refreshing, onRefresh,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  if (!scroll) return <View style={styles.screen}>{children}</View>;
  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: spacing.hPad, paddingTop: 4, paddingBottom: 32 },
});
