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
import { C, F, PAGE_GUTTER } from '../src/theme';
import { MAXW } from './kit';

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onBack?: () => void;
};

export default function AuthScaffold({ title, subtitle, children, onBack }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 8) + 12 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
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
                <MaterialCommunityIcons name="chevron-left" size={26} color={C.card} />
              </TouchableOpacity>
            ) : null}

            <BrandLogo width={168} style={styles.logo} />
            <T style={styles.heroTitle}>{title}</T>
            <T style={styles.heroSubtitle}>{subtitle}</T>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.authPanel}>{children}</View>
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
    minHeight: 230,
    paddingBottom: 36,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  logo: {
    borderRadius: 16,
    backgroundColor: C.card,
  },
  heroTitle: {
    marginTop: 6,
    color: C.card,
    fontFamily: F.bold,
    fontSize: 23,
    lineHeight: 29,
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: 4,
    maxWidth: 330,
    color: 'rgba(255,255,255,0.86)',
    fontFamily: F.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  body: {
    width: '100%',
    maxWidth: MAXW,
    flex: 1,
    alignSelf: 'center',
    marginTop: -24,
    paddingHorizontal: PAGE_GUTTER,
  },
  authPanel: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 18,
    backgroundColor: C.card,
  },
});
