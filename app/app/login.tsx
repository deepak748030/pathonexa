import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck, ArrowRight, Phone } from 'lucide-react-native';
import { colors, fonts, radius } from '@/lib/theme';

const illustration = require('../assets/login-illustration.png');

export default function Login() {
  const insets = useSafeAreaInsets();
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const valid = mobile.length === 10;

  const onContinue = () => {
    if (!valid || loading) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)');
    }, 700);
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[colors.primary, colors.primaryGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.brand}>PathoNexa</Text>
        <Text style={styles.brandSub}>Pathology Lab Management</Text>
        <Image source={illustration} style={styles.illustration} resizeMode="contain" />
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Login to your lab</Text>
          <Text style={styles.subtitle}>Enter your registered mobile number to continue</Text>

          <Text style={styles.label}>Mobile Number</Text>
          <View style={[styles.inputRow, valid && styles.inputRowActive]}>
            <View style={styles.prefix}>
              <Phone size={13} color={colors.primary} />
              <Text style={styles.prefixText}>+91</Text>
            </View>
            <TextInput
              value={mobile}
              onChangeText={(t) => setMobile(t.replace(/[^0-9]/g, '').slice(0, 10))}
              placeholder="10 digit mobile number"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              maxLength={10}
              style={styles.input}
            />
          </View>
          <Text style={styles.hint}>{mobile.length}/10 digits · country code +91 is fixed</Text>

          <Pressable
            onPress={onContinue}
            disabled={!valid || loading}
            style={({ pressed }) => [
              styles.cta,
              !valid && styles.ctaDisabled,
              pressed && valid && { opacity: 0.9 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.ctaText}>Send OTP</Text>
                <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.6} />
              </>
            )}
          </Pressable>

          <View style={styles.secure}>
            <ShieldCheck size={13} color={colors.green} />
            <Text style={styles.secureText}>Your data is encrypted & NABL compliant</Text>
          </View>

          <Text style={styles.terms}>By continuing you agree to our Terms & Privacy Policy</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { paddingHorizontal: 10, paddingBottom: 10, alignItems: 'center' },
  brand: { color: '#FFFFFF', fontFamily: fonts.extrabold, fontSize: 22 },
  brandSub: { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.medium, fontSize: 11, marginTop: 2 },
  illustration: { width: '100%', height: 150, marginTop: 6 },
  body: { paddingHorizontal: 3, paddingTop: 14, paddingBottom: 24 },
  title: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 17, paddingHorizontal: 7 },
  subtitle: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 11, marginTop: 3, paddingHorizontal: 7 },
  label: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 10, marginTop: 18, paddingHorizontal: 7 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    marginTop: 5,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  inputRowActive: { borderColor: colors.primary },
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: '100%',
    backgroundColor: colors.primaryLight,
    borderRightWidth: 1,
    borderRightColor: colors.inputBorder,
  },
  prefixText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 13 },
  input: { flex: 1, paddingHorizontal: 10, color: colors.foreground, fontFamily: fonts.semibold, fontSize: 14, letterSpacing: 1 },
  hint: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 9, marginTop: 4, paddingHorizontal: 7 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    marginTop: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  ctaDisabled: { backgroundColor: '#9DBEF0' },
  ctaText: { color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 14 },
  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 14 },
  secureText: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 10 },
  terms: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 9, textAlign: 'center', marginTop: 6 },
});
