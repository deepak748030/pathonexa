import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

/**
 * Keeps the focused input above the software keyboard.
 * Use this on every form screen (login, add patient, create report, manage).
 */
export default function KeyboardSafe({
  children,
  style,
  contentStyle,
  extraBottom = 40,
  scroll = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  extraBottom?: number;
  scroll?: boolean;
}) {
  const behavior = Platform.OS === 'ios' ? 'padding' : 'padding';

  if (!scroll) {
    return (
      <KeyboardAvoidingView style={[styles.fill, style]} behavior={behavior} keyboardVerticalOffset={0}>
        {children}
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.fill, style]} behavior={behavior} keyboardVerticalOffset={0}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[{ flexGrow: 1, paddingBottom: extraBottom }, contentStyle]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
        automaticallyAdjustsScrollIndicatorInsets
      >
        {children}
        <View style={{ height: extraBottom }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function FormScroll(props: ScrollViewProps) {
  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
        {...props}
        contentContainerStyle={[{ paddingBottom: 48 }, props.contentContainerStyle]}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
