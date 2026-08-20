import React from 'react';
import {
  View, StyleSheet, ScrollView, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { colors, radius, spacing } from '@/lib/theme';

/**
 * Blue header + overlapping rounded white sheet — matches the PathoNexa UI PDF.
 */
export default function AppScreen({
  header,
  children,
  scroll = true,
  refreshing,
  onRefresh,
  keyboard = false,
  footer,
  sheetStyle,
}: {
  header?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  keyboard?: boolean;
  footer?: React.ReactNode;
  sheetStyle?: any;
}) {
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.body, sheetStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      automaticallyAdjustKeyboardInsets={keyboard}
      refreshControl={
        onRefresh
          ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.body, sheetStyle]}>{children}</View>
  );

  return (
    <View style={styles.root}>
      {header}
      <KeyboardAvoidingView
        style={styles.sheet}
        behavior={keyboard ? (Platform.OS === 'ios' ? 'padding' : 'padding') : undefined}
      >
        {body}
        {footer}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
    marginTop: -18,
  },
  flex: { flex: 1 },
  body: { paddingHorizontal: spacing.hPad, paddingTop: 16, paddingBottom: 28 },
});
