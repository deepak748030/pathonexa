import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from './T';
import { BrandLogo } from './Brand';
import { Press } from './kit';
import { C, F, PAGE_GUTTER } from '../src/theme';

type AuthScaffoldProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onBack?: () => void;
};

export function AuthScaffold({ title, subtitle, children, onBack }: AuthScaffoldProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
        >
          <LinearGradient
            colors={[C.headerTop, C.primary, '#2B7AF0']}
            start={{ x: 0.06, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { paddingTop: insets.top + 8 }]}
          >
            <View style={styles.heroInner}>
              {onBack ? (
                <Press style={styles.backButton} onPress={onBack} accessibilityLabel="Go back" scaleTo={0.9}>
                  <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
                </Press>
              ) : null}
              <View style={styles.logoPlate}>
                <BrandLogo width={190} />
              </View>
            </View>
          </LinearGradient>

          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 8) + 20 }]}>
            <T style={styles.title}>{title}</T>
            <T style={styles.subtitle}>{subtitle}</T>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.headerTop },
  flex: { flex: 1 },
  scroll: { flex: 1, backgroundColor: C.headerTop },
  scrollContent: { flexGrow: 1, backgroundColor: C.bg },
  hero: {
    minHeight: 176,
    paddingBottom: 34,
    justifyContent: 'center',
  },
  heroInner: {
    width: '100%',
    maxWidth: 520,
    minHeight: 106,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: PAGE_GUTTER,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: PAGE_GUTTER,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
  },
  logoPlate: {
    width: 214,
    height: 98,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    overflow: 'hidden',
  },
  sheet: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    marginTop: -20,
    paddingTop: 30,
    paddingHorizontal: PAGE_GUTTER,
    paddingBottom: 28,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: C.card,
  },
  title: {
    color: C.text,
    fontFamily: F.bold,
    fontSize: 27,
    lineHeight: 33,
    letterSpacing: -0.5,
  },
  subtitle: {
    maxWidth: 430,
    marginTop: 5,
    color: C.sub,
    fontFamily: F.regular,
    fontSize: 12.5,
    lineHeight: 18,
  },
});
