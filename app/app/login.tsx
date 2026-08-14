import React from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView,
  Platform, Image, ActivityIndicator, Keyboard, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Phone, ShieldCheck, ChevronLeft, WifiOff } from 'lucide-react-native';
import { useAuth, DEMO_OTP } from '@/lib/auth';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { FadeIn } from '@/components/UI';

export default function Login() {
  const [mobile, setMobile] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [step, setStep] = React.useState<'mobile' | 'otp'>('mobile');
  const [loading, setLoading] = React.useState(false);
  const [timer, setTimer] = React.useState(30);
  const { login, verifyOtp, offline } = useAuth();

  React.useEffect(() => {
    if (step !== 'otp' || timer === 0) return;
    const t = setTimeout(() => setTimer((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [step, timer]);

  const handleMobileSubmit = async () => {
    if (mobile.length !== 10) return;
    setLoading(true);
    try {
      await login(mobile);
    } catch (e: any) {
      // Server unreachable → continue in offline demo mode (clearly flagged).
      console.warn('Offline login:', e?.message || e);
    } finally {
      setTimer(30);
      setOtp('');
      setStep('otp');
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      await verifyOtp(mobile, otp);
      router.replace('/(tabs)');
    } catch (e: any) {
      alert(e?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await login(mobile);
      setTimer(30);
      setOtp('');
    } catch (e: any) {
      alert(e?.message || 'Could not resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const renderOTPInputs = () => (
    <View style={styles.otpContainer}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <View key={index} style={[styles.otpBox, otp.length === index && styles.otpBoxActive]}>
          <Text style={styles.otpText}>{otp[index] || ''}</Text>
        </View>
      ))}
      <TextInput
        style={styles.hiddenInput}
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
        autoFocus
      />
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screen}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.content} onPress={Keyboard.dismiss}>
          {step === 'otp' && (
            <Pressable style={styles.backBtn} onPress={() => setStep('mobile')}>
              <ChevronLeft size={24} color="#0F172A" />
            </Pressable>
          )}

          <View style={styles.header}>
            <Image source={require('../assets/login-illustration.png')} style={styles.heroImage} resizeMode="cover" />
            <Text style={styles.mainHeadline}>India's fastest lab app</Text>
            <Text style={styles.subHeadline}>Log in or sign up to manage your lab</Text>
          </View>

          <View style={styles.formContainer}>
            {offline && step === 'mobile' && (
              <View style={styles.offlineBox}>
                <WifiOff size={13} color="#92400E" />
                <Text style={styles.offlineText}>
                  Server unreachable — you can still enter with demo OTP {DEMO_OTP}.
                </Text>
              </View>
            )}

            {step === 'mobile' ? (
              <>
                <View style={styles.inputOuter}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Phone Number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={10}
                    value={mobile}
                    onChangeText={setMobile}
                  />
                </View>

                <Pressable
                  style={[styles.continueBtn, (mobile.length !== 10 || loading) && styles.btnDisabled]}
                  onPress={handleMobileSubmit}
                  disabled={mobile.length !== 10 || loading}
                >
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.continueText}>Continue</Text>}
                </Pressable>

                <View style={styles.divider}>
                  <View style={styles.line} />
                  <Text style={styles.orText}>OR</Text>
                  <View style={styles.line} />
                </View>

                <Pressable style={styles.socialBtn} onPress={() => alert('Google sign-in is coming soon. Use your 10-digit mobile + OTP 123456.')}>
                  <Ionicons name="logo-google" size={18} color="#4285F4" />
                  <Text style={styles.socialText}>Continue with Google</Text>
                </Pressable>
              </>
            ) : (
              <FadeIn>
                <Text style={styles.otpTitle}>Verify OTP</Text>
                <Text style={styles.otpSub}>We've sent a verification code to</Text>
                <Text style={styles.otpTarget}>+91 {mobile}</Text>

                {renderOTPInputs()}

                {timer > 0 ? (
                  <Text style={styles.resendTimer}>Resend OTP in {timer}s</Text>
                ) : (
                  <Pressable onPress={handleResend} hitSlop={8} disabled={loading}>
                    <Text style={styles.resendLink}>Resend OTP</Text>
                  </Pressable>
                )}

                {offline && (
                  <View style={styles.offlineBox}>
                    <WifiOff size={13} color="#92400E" />
                    <Text style={styles.offlineText}>Offline mode — demo OTP is {DEMO_OTP}.</Text>
                  </View>
                )}

                <Pressable
                  style={[styles.continueBtn, (otp.length !== 6 || loading) && styles.btnDisabled]}
                  onPress={handleOtpSubmit}
                  disabled={otp.length !== 6 || loading}
                >
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.continueText}>Verify & Login</Text>}
                </Pressable>

                <View style={styles.trustRow}>
                  <ShieldCheck size={13} color={colors.green} />
                  <Text style={styles.trustText}>Your data is secure with PathoNexa Cloud</Text>
                </View>
              </FadeIn>
            )}
          </View>

          <View style={styles.footerInfo}>
            <Text style={styles.version}>v1.0.0 · PathoNexa Cloud</Text>
          </View>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, paddingHorizontal: spacing.hPad, paddingVertical: 15 },
  backBtn: { position: 'absolute', top: 40, left: 10, zIndex: 10, padding: 10 },
  header: { alignItems: 'center', marginTop: 10, marginBottom: 25 },
  heroImage: { width: '100%', height: 190, marginBottom: 20 },
  mainHeadline: { fontSize: 26, fontFamily: fonts.extrabold, color: colors.foreground, textAlign: 'center' },
  subHeadline: { fontSize: 14, fontFamily: fonts.medium, color: colors.mutedForeground, marginTop: 4, textAlign: 'center' },
  formContainer: { paddingHorizontal: spacing.hPad },
  inputOuter: {
    flexDirection: 'row', alignItems: 'center', height: spacing.input,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 15, marginBottom: 15, backgroundColor: '#FFF',
  },
  countryCode: { borderRightWidth: 1, borderColor: colors.border, paddingRight: 12, marginRight: 12 },
  countryText: { fontFamily: fonts.semibold, color: colors.foreground, fontSize: 15 },
  phoneInput: { flex: 1, height: '100%', fontFamily: fonts.medium, fontSize: 15, color: colors.foreground },
  continueBtn: {
    height: spacing.button, backgroundColor: colors.primary,
    borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center',
  },
  continueText: { color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { marginHorizontal: 15, color: colors.placeholder, fontSize: 11, fontFamily: fonts.bold },
  socialBtn: {
    flexDirection: 'row', height: spacing.button, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  socialText: { color: '#475569', fontFamily: fonts.semibold, fontSize: 14 },
  otpTitle: { fontSize: 20, fontFamily: fonts.bold, textAlign: 'center', marginBottom: 5 },
  otpSub: { fontSize: 13, fontFamily: fonts.regular, color: colors.mutedForeground, textAlign: 'center' },
  otpTarget: { fontSize: 13, fontFamily: fonts.bold, color: colors.foreground, textAlign: 'center', marginBottom: 25 },
  otpContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  otpBox: { width: 45, height: 48, borderBottomWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  otpBoxActive: { borderColor: colors.primary },
  otpText: { fontSize: 20, fontFamily: fonts.bold, color: colors.foreground },
  hiddenInput: { position: 'absolute', opacity: 0, width: '100%', height: '100%' },
  resendTimer: { textAlign: 'center', color: colors.placeholder, fontSize: 12, marginBottom: 20, fontFamily: fonts.medium },
  resendLink: { textAlign: 'center', color: colors.primary, fontSize: 12, marginBottom: 20, fontFamily: fonts.semibold },
  offlineBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 14 },
  offlineText: { flex: 1, color: '#92400E', fontFamily: fonts.medium, fontSize: 10.5 },
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18 },
  trustText: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 11 },
  footerInfo: { marginTop: 'auto', paddingVertical: 30, alignItems: 'center' },
  version: { color: colors.border, fontSize: 11, marginTop: 4, fontFamily: fonts.regular },
});
