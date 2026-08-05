import React, { useRef, useState } from 'react';
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
import { ShieldCheck, ArrowRight, Phone, ChevronLeft, KeyRound } from 'lucide-react-native';
import { colors, fonts, radius } from '@/lib/theme';
import { useAuth, DEMO_OTP } from '@/lib/auth';

const illustration = require('../assets/login-illustration.png');

export default function Login() {
  const insets = useSafeAreaInsets();
  const login = useAuth((s) => s.login);

  const [stage, setStage] = useState<'mobile' | 'otp'>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const otpRef = useRef<TextInput>(null);

  const validMobile = mobile.length === 10;

  const sendOtp = () => {
    if (!validMobile || loading) return;
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      setStage('otp');
      setTimeout(() => otpRef.current?.focus(), 120);
    }, 600);
  };

  const verify = async () => {
    if (otp.length !== 6 || loading) return;
    if (otp !== DEMO_OTP) {
      setError('Incorrect OTP. Please try again.');
      return;
    }
    setLoading(true);
    await login(mobile);
    setLoading(false);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[colors.primary, colors.primaryGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 14 }]}
      >
        <Text style={styles.brand}>PathoNexa</Text>
        <Text style={styles.brandSub}>Pathology Lab Management</Text>
        <Image source={illustration} style={styles.illustration} resizeMode="contain" />
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {stage === 'mobile' ? (
            <>
              <Text style={styles.title}>Login to your lab</Text>
              <Text style={styles.subtitle}>Enter your registered mobile number to continue</Text>

              <Text style={styles.label}>MOBILE NUMBER</Text>
              <View style={[styles.inputRow, validMobile && styles.inputRowActive]}>
                <View style={styles.prefix}>
                  <Phone size={13} color={colors.primary} />
                  <Text style={styles.prefixText}>+91</Text>
                </View>
                <TextInput
                  value={mobile}
                  onChangeText={(t) => setMobile(t.replace(/[^0-9]/g, '').slice(0, 10))}
                  placeholder="Enter 10 digit mobile number"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="number-pad"
                  maxLength={10}
                  style={styles.input}
                />
              </View>
              <Text style={styles.hint}>{mobile.length}/10 digits · country code +91 is fixed</Text>

              <Pressable
                onPress={sendOtp}
                disabled={!validMobile || loading}
                style={({ pressed }) => [styles.cta, !validMobile && styles.ctaDisabled, pressed && validMobile && { opacity: 0.9 }]}
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
            </>
          ) : (
            <>
              <Pressable style={styles.backRow} onPress={() => { setStage('mobile'); setOtp(''); setError(''); }} hitSlop={10}>
                <ChevronLeft size={16} color={colors.primary} />
                <Text style={styles.backText}>Change number</Text>
              </Pressable>

              <Text style={styles.title}>Verify OTP</Text>
              <Text style={styles.subtitle}>We sent a 6 digit code to +91 {mobile}</Text>

              <Pressable style={styles.otpWrap} onPress={() => otpRef.current?.focus()}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <View key={i} style={[styles.otpBox, (otp.length === i) && styles.otpBoxActive, !!otp[i] && styles.otpBoxFilled]}>
                    <Text style={styles.otpDigit}>{otp[i] ?? ''}</Text>
                  </View>
                ))}
                <TextInput
                  ref={otpRef}
                  value={otp}
                  onChangeText={(t) => { setOtp(t.replace(/[^0-9]/g, '').slice(0, 6)); setError(''); }}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.otpHidden}
                />
              </Pressable>

              {!!error && <Text style={styles.error}>{error}</Text>}

              <View style={styles.demo}>
                <KeyRound size={13} color={colors.primary} />
                <Text style={styles.demoText}>Demo OTP: {DEMO_OTP}</Text>
              </View>

              <Pressable
                onPress={verify}
                disabled={otp.length !== 6 || loading}
                style={({ pressed }) => [styles.cta, otp.length !== 6 && styles.ctaDisabled, pressed && { opacity: 0.9 }]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.ctaText}>Verify & Login</Text>
                    <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.6} />
                  </>
                )}
              </Pressable>
            </>
          )}

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
  hero: { paddingHorizontal: 16, paddingBottom: 12, alignItems: 'center' },
  brand: { color: '#FFFFFF', fontFamily: fonts.extrabold, fontSize: 23, letterSpacing: 0.2 },
  brandSub: { color: 'rgba(255,255,255,0.88)', fontFamily: fonts.medium, fontSize: 11, marginTop: 2 },
  illustration: { width: '100%', height: 170, marginTop: 8 },
  body: { paddingHorizontal: 8, paddingTop: 18, paddingBottom: 28 },
  title: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 19 },
  subtitle: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 12, marginTop: 3 },
  label: { color: colors.mutedForeground, fontFamily: fonts.semibold, fontSize: 9.5, letterSpacing: 0.8, marginTop: 20 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    marginTop: 6,
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
    paddingHorizontal: 12,
    height: '100%',
    backgroundColor: colors.primaryLight,
    borderRightWidth: 1,
    borderRightColor: colors.inputBorder,
  },
  prefixText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 13 },
  input: { flex: 1, paddingHorizontal: 12, color: colors.foreground, fontFamily: fonts.semibold, fontSize: 14, letterSpacing: 0.5 },
  hint: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10, marginTop: 6 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    marginTop: 18,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  ctaDisabled: { backgroundColor: '#A9C5EF' },
  ctaText: { color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 14 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 10 },
  backText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 12 },
  otpWrap: { flexDirection: 'row', gap: 8, marginTop: 18 },
  otpBox: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    backgroundColor: colors.inputBg,
  },
  otpBoxActive: { borderColor: colors.primary },
  otpBoxFilled: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  otpDigit: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 17 },
  otpHidden: { position: 'absolute', opacity: 0, width: '100%', height: 50 },
  error: { color: colors.danger, fontFamily: fonts.medium, fontSize: 11, marginTop: 8 },
  demo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.sm },
  demoText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 11 },
  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 18 },
  secureText: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 10.5 },
  terms: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10, textAlign: 'center', marginTop: 6 },
});
