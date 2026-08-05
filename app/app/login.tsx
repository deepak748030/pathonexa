import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ShieldCheck, ChevronLeft } from 'lucide-react-native';
import { colors, radius } from '@/lib/theme';
import { authApi, setToken, setStoredUser, kycApi } from '@/lib/api';
import BottomSheet from '@/components/BottomSheet';

type Step = 'phone' | 'otp' | 'details';
const OTP_LEN = 6;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [dealerName, setDealerName] = useState('');
  const [dealerCode, setDealerCode] = useState('');
  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [existingUser, setExistingUser] = useState(false);
  const otpRef = useRef<TextInput | null>(null);

  const phoneValid = /^[6-9]\d{9}$/.test(phone);

  useEffect(() => {
    if (step !== 'otp') return;
    setResendIn(30);
    const id = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    const t = setTimeout(() => otpRef.current?.focus(), 250);
    return () => { clearInterval(id); clearTimeout(t); };
  }, [step]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 'otp') { setError(null); setOtp(''); setStep('phone'); return true; }
      if (step === 'details') { setError(null); setStep('phone'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [step]);

  const sendOtp = async () => {
    if (!phoneValid) { setError('Enter a valid 10-digit Indian mobile number'); return; }
    setLoading(true);
    try {
      const check = await authApi.checkPhone(phone).catch(() => ({ exists: false } as any));
      setExistingUser(!!check.exists);
      await authApi.sendOtp(phone);
      setOtp('');
      setStep('otp');
    } catch (e: any) {
      setError(e?.message || 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== OTP_LEN) { setError(`Enter the ${OTP_LEN}-digit OTP`); return; }
    setLoading(true);
    try {
      if (existingUser) {
        const r = await authApi.verifyOtp({ phone, otp });
        await setToken(r.token);
        await setStoredUser(r.user);
        try {
          const k = await kycApi.mine();
          const st = k.data.status;
          if (st === 'approved') { router.replace('/(tabs)'); return; }
          if (st === 'pending' || st === 'in_progress') { router.replace('/payment-pending' as any); return; }
          // not_started or rejected → fill KYC form
          router.replace('/kyc');
        } catch {
          router.replace('/kyc');
        }
      } else {
        setStep('details');
      }
    } catch (e: any) {
      setError(e?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const submitDetails = async () => {
    if (!name.trim()) { setError('Please enter your full name'); return; }
    if (!address.trim()) { setError('Please enter your address'); return; }
    if (!dealerName.trim()) { setError('Please enter your dealer / dealership name'); return; }
    if (!dealerCode.trim()) { setError('Please enter your dealer code'); return; }
    setLoading(true);
    try {
      const r = await authApi.verifyOtp({ phone, otp, name, city: address });
      await setToken(r.token);
      await setStoredUser(r.user);
      router.replace('/kyc');
    } catch (e: any) {
      setError(e?.message || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0) return;
    setOtp('');
    setResendIn(30);
    try { await authApi.sendOtp(phone); } catch { /* ignore */ }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[colors.primaryDark, colors.primary, colors.primaryGradientEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 14 }]}
      >
        {step !== 'phone' && (
          <Pressable
            style={[styles.back, { top: insets.top + 6 }]}
            onPress={() => { setError(null); setStep('phone'); }}
            hitSlop={10}
          >
            <ChevronLeft size={20} color="#FFFFFF" />
          </Pressable>
        )}
        <Image source={require('../assets/images/icon.png')} style={styles.brandImg} resizeMode="contain" />
        <Text style={styles.brand}>Tractor Wala</Text>
        <Text style={styles.tagline}>Bid Smart · Win Big · 100% Secure</Text>
        <View style={styles.trustRow}>
          <ShieldCheck size={11} color={colors.accent} />
          <Text style={styles.trustText}>RBI compliant · OTP secured</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.sheet}
        contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 20, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'phone' && (
          <View>
            <Text style={styles.heading}>Login or Sign up</Text>
            <Text style={styles.subheading}>Enter your mobile number to continue</Text>

            <View style={styles.phoneRow}>
              <View style={styles.cc}>
                <Text style={styles.ccText}>+91</Text>
              </View>
              <View style={styles.divider} />
              <TextInput
                style={styles.phoneInput}
                placeholder="98765 43210"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                maxLength={10}
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, ''))}
              />
            </View>

            <PrimaryButton
              label="Send OTP"
              loading={loading}
              disabled={!phoneValid}
              onPress={sendOtp}
            />
          </View>
        )}

        {step === 'otp' && (
          <View>
            <Text style={styles.heading}>Verify OTP</Text>
            <Text style={styles.subheading}>OTP sent to +91 {phone}</Text>

            <OtpCells value={otp} onChange={setOtp} inputRef={otpRef} />

            <PrimaryButton
              label="Verify & Continue"
              loading={loading}
              disabled={otp.length !== OTP_LEN}
              onPress={verifyOtp}
            />

            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Didn't receive code?</Text>
              <Pressable onPress={resend} disabled={resendIn > 0}>
                <Text style={[styles.resendLink, resendIn > 0 && { color: colors.mutedForeground }]}>
                  {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 'details' && (
          <View>
            <Text style={styles.heading}>Complete your profile</Text>
            <Text style={styles.subheading}>Looks like you're new here. Fill the details below to continue to KYC.</Text>

            <Field label="Full Name" required value={name} onChangeText={setName} placeholder="e.g. Rahul Kumar" />
            <Field label="Address" required value={address} onChangeText={setAddress} placeholder="House, street, city, state" multiline />
            <Field label="Dealer Name" required value={dealerName} onChangeText={setDealerName} placeholder="e.g. Kumar Tractors" />
            <Field label="Dealer Code" required value={dealerCode} onChangeText={setDealerCode} placeholder="e.g. TWD-1024" autoCapitalize="characters" />

            <PrimaryButton
              label="Continue to KYC"
              loading={loading}
              disabled={!name.trim() || !address.trim() || !dealerName.trim() || !dealerCode.trim()}
              onPress={submitDetails}
            />
          </View>
        )}

        <Text style={styles.legal}>
          By continuing you agree to Tractor Wala's Terms & Privacy Policy.
        </Text>
      </ScrollView>

      <BottomSheet
        visible={!!error}
        variant="error"
        title="Please check"
        message={error || ''}
        confirmText="OK"
        onClose={() => setError(null)}
      />
    </KeyboardAvoidingView>
  );
}

function PrimaryButton({ label, loading, disabled, onPress }: { label: string; loading: boolean; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.primaryBtn, (loading || disabled) && { opacity: 0.55 }]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryBtnText}>{label}</Text>}
    </Pressable>
  );
}

function Field({ label, required, multiline, ...rest }: any) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={styles.label}>{label}{required ? <Text style={{ color: colors.danger }}> *</Text> : null}</Text>
      <TextInput
        {...rest}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, multiline && { height: 70, textAlignVertical: 'top', paddingTop: 10 }]}
        multiline={!!multiline}
      />
    </View>
  );
}

function OtpCells({ value, onChange, inputRef }: { value: string; onChange: (v: string) => void; inputRef: React.RefObject<TextInput> }) {
  const cells = Array.from({ length: OTP_LEN });
  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={styles.otpWrap}>
      {cells.map((_, i) => {
        const ch = value[i] || '';
        const focused = i === value.length;
        return (
          <View key={i} style={[styles.otpCell, ch && styles.otpCellFilled, focused && styles.otpCellFocused]}>
            <Text style={styles.otpChar}>{ch}</Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, '').slice(0, OTP_LEN))}
        keyboardType="number-pad"
        maxLength={OTP_LEN}
        style={styles.otpHidden}
        autoFocus
        caretHidden
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingBottom: 36, alignItems: 'center' },
  back: { position: 'absolute', left: 10, top: 0, padding: 8, marginTop: 0, zIndex: 2 },
  brandImg: { width: 96, height: 96 },
  brand: { color: '#FFFFFF', fontWeight: '800', fontSize: 24, marginTop: 8, letterSpacing: 0.5 },
  tagline: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4, fontWeight: '600' },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(0,0,0,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: radius.pill },
  trustText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  sheet: { flex: 1, backgroundColor: colors.background, marginTop: -16, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },

  heading: { color: colors.foreground, fontWeight: '800', fontSize: 20 },
  subheading: { color: colors.mutedForeground, fontSize: 13, marginTop: 4 },

  phoneRow: { flexDirection: 'row', marginTop: 14, borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.card, alignItems: 'stretch', overflow: 'hidden', borderRadius: radius.md },
  cc: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, backgroundColor: colors.primaryLight },
  ccFlag: { fontSize: 14 },
  ccText: { color: colors.primaryDark, fontWeight: '800', fontSize: 14 },
  divider: { width: 1, backgroundColor: colors.border },
  phoneInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: colors.foreground, letterSpacing: 1, fontWeight: '600' },

  primaryBtn: { backgroundColor: colors.primary, paddingVertical: 14, alignItems: 'center', marginTop: 14, borderRadius: radius.md },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },

  hintBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.sm },
  hintText: { color: colors.primaryDark, fontSize: 12, fontWeight: '600' },

  otpWrap: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 8 },
  otpCell: { flex: 1, height: 50, borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  otpCellFilled: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  otpCellFocused: { borderColor: colors.accent, borderWidth: 2 },
  otpChar: { fontSize: 22, fontWeight: '800', color: colors.primaryDark },
  otpHidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },

  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 },
  resendText: { color: colors.mutedForeground, fontSize: 12 },
  resendLink: { color: colors.primary, fontWeight: '800', fontSize: 12 },

  label: { color: colors.foreground, fontWeight: '600', fontSize: 13, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.foreground, borderRadius: radius.md },

  legal: { color: colors.mutedForeground, fontSize: 11, textAlign: 'center', marginTop: 16, paddingHorizontal: 12 },
});
