import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from './T';
import { BrandLogo } from './Brand';
import { C, F, PAGE_GUTTER, R } from '../src/theme';
import { MAXW } from './kit';

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onBack?: () => void;
  footer?: React.ReactNode;
};

export default function AuthScaffold({ title, subtitle, children, onBack, footer }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 8) + 8 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        bounces={false}
      >
        <LinearGradient
          colors={[C.headerTop, C.headerBottom]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.heroInner}>
            {onBack ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Go back"
                activeOpacity={0.78}
                onPress={onBack}
                style={styles.backButton}
              >
                <MaterialCommunityIcons name="arrow-left" size={21} color={C.card} />
              </TouchableOpacity>
            ) : null}

            <BrandLogo width={180} style={styles.logo} />
            <T style={styles.heroTitle}>{title}</T>
            <T style={styles.heroSubtitle}>{subtitle}</T>
            <View style={styles.securePill}>
              <MaterialCommunityIcons name="shield-check-outline" size={14} color={C.card} />
              <T style={styles.secureText}>Secure diagnostic workspace</T>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.card}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1, backgroundColor: C.bg },
  scrollContent: { flexGrow: 1, backgroundColor: C.bg },
  hero: {
    width: '100%',
    paddingBottom: 18,
    minHeight: 232,
  },
  heroInner: {
    width: '100%',
    maxWidth: MAXW,
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: PAGE_GUTTER,
  },
  backButton: {
    position: 'absolute',
    left: PAGE_GUTTER,
    top: 0,
    width: 38,
    height: 38,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: R.field,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  logo: { backgroundColor: C.card },
  heroTitle: {
    marginTop: 8,
    color: C.card,
    fontFamily: F.bold,
    fontSize: 24,
    lineHeight: 29,
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: 4,
    maxWidth: 330,
    color: 'rgba(255,255,255,0.82)',
    fontFamily: F.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  securePill: {
    marginTop: 8,
    minHeight: 26,
    paddingHorizontal: 9,
    borderRadius: R.field,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secureText: {
    color: C.card,
    fontFamily: F.medium,
    fontSize: 10.5,
  },
  body: {
    width: '100%',
    maxWidth: MAXW,
    flex: 1,
    alignSelf: 'center',
    paddingHorizontal: PAGE_GUTTER,
    paddingTop: 8,
  },
  card: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRadius: R.card,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
});
