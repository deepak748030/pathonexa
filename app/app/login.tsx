import React from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView,
  Platform, Image, ActivityIndicator, Keyboard, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Phone, ArrowRight, ShieldCheck, RefreshCw, ChevronLeft } from 'lucide-react-native';
import { useAuth, DEMO_OTP } from '@/lib/auth';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { FadeIn } from '@/components/UI';

export default function Login() {
  const [mobile, setMobile] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [step, setStep] = React.useState<'mobile' | 'otp'>('mobile');
  const [loading, setLoading] = React.useState(false);
  const { login, verifyOtp } = useAuth();

  const handleMobileSubmit = async () => {
    if (mobile.length !== 10) return;
    setLoading(true);
    try {
      await login(mobile);
      setStep('otp');
    } finally {
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
      alert(e.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const renderOTPInputs = () => {
    return (
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
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.content} onPress={Keyboard.dismiss}>
          {step === 'otp' && (
            <Pressable style={styles.backBtn} onPress={() => setStep('mobile')}>
              <ChevronLeft size={24} color="#000" />
            </Pressable>
          )}

          <View style={styles.header}>
            <Image 
              source={{ uri: 'https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg' }} 
              style={styles.heroImage} 
            />

            
            <Text style={styles.mainHeadline}>India's fastest app</Text>
            <Text style={styles.subHeadline}>Log in or sign up</Text>
          </View>

          <View style={styles.formContainer}>
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

                <Pressable style={styles.socialBtn}>
                  <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} style={styles.socialIcon} />
                  <Text style={styles.socialText}>Continue with Google</Text>
                </Pressable>
              </>
            ) : (
              <FadeIn>
                <Text style={styles.otpTitle}>Verify OTP</Text>
                <Text style={styles.otpSub}>We've sent a verification code to</Text>
                <Text style={styles.otpTarget}>+91 {mobile}</Text>

                {renderOTPInputs()}

                <Text style={styles.resendTimer}>Resend OTP in 27s</Text>

                <Pressable
                  style={[styles.continueBtn, (otp.length !== 6 || loading) && styles.btnDisabled]}
                  onPress={handleOtpSubmit}
                  disabled={otp.length !== 6 || loading}
                >
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.continueText}>Verify & Login</Text>}
                </Pressable>
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
  content: { flex: 1, paddingHorizontal: 0, paddingVertical: 15 },
  backBtn: { position: 'absolute', top: 40, left: 10, zIndex: 10, padding: 10 },
  header: { alignItems: 'center', marginTop: 30, marginBottom: 25 },
  heroImage: { width: '100%', height: 200, borderRadius: 0, marginBottom: 20, resizeMode: 'cover' },
  mainHeadline: { fontSize: 26, fontFamily: fonts.extrabold, color: '#000', textAlign: 'center' },
  subHeadline: { fontSize: 14, fontFamily: fonts.medium, color: '#64748B', marginTop: 4, textAlign: 'center' },
  formContainer: { paddingHorizontal: 5 },
  inputOuter: {
    flexDirection: 'row', alignItems: 'center', height: 48,
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12,
    paddingHorizontal: 15, marginBottom: 15, backgroundColor: '#FFF',
  },
  countryCode: { borderRightWidth: 1, borderColor: '#E2E8F0', paddingRight: 12, marginRight: 12 },
  countryText: { fontFamily: fonts.semibold, color: '#000', fontSize: 15 },
  phoneInput: { flex: 1, height: '100%', fontFamily: fonts.medium, fontSize: 15, color: '#000' },
  continueBtn: {
    height: 48, backgroundColor: colors.primary,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  continueText: { color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  orText: { marginHorizontal: 15, color: '#94A3B8', fontSize: 11, fontFamily: fonts.bold },
  socialBtn: {
    flexDirection: 'row', height: 48, borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  socialIcon: { width: 18, height: 18 },
  socialText: { color: '#475569', fontFamily: fonts.semibold, fontSize: 14 },
  otpTitle: { fontSize: 20, fontFamily: fonts.bold, textAlign: 'center', marginBottom: 5 },
  otpSub: { fontSize: 13, fontFamily: fonts.regular, color: '#64748B', textAlign: 'center' },
  otpTarget: { fontSize: 13, fontFamily: fonts.bold, color: '#000', textAlign: 'center', marginBottom: 25 },
  otpContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  otpBox: { width: 45, height: 48, borderBottomWidth: 2, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  otpBoxActive: { borderColor: colors.primary },
  otpText: { fontSize: 20, fontFamily: fonts.bold, color: '#000' },
  hiddenInput: { position: 'absolute', opacity: 0, width: '100%', height: '100%' },
  resendTimer: { textAlign: 'center', color: '#94A3B8', fontSize: 12, marginBottom: 25, fontFamily: fonts.medium },
  footerInfo: { marginTop: 'auto', paddingVertical: 30, alignItems: 'center' },
  version: { color: '#CBD5E1', fontSize: 11, marginTop: 4, fontFamily: fonts.regular },
});
