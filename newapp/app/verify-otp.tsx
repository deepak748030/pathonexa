import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AuthScaffold from '../components/AuthScaffold';
import { T } from '../components/T';
import { C, F } from '../src/theme';
import { formatIndianMobile, useAuth } from '../src/auth';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;
const MAX_ATTEMPTS = 5;

export default function VerifyOtpScreen() {
  const { pendingPhone, requestOtp, verifyOtp, clearPendingPhone } = useAuth();
  const inputRef = React.useRef<TextInput>(null);
  const [otp, setOtp] = React.useState('');
  const [error, setError] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [resendIn, setResendIn] = React.useState(RESEND_SECONDS);
  const [attempts, setAttempts] = React.useState(0);
  const [locked, setLocked] = React.useState(false);

  React.useEffect(() => {
    if (!pendingPhone) router.replace('/login');
  }, [pendingPhone]);

  React.useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const handleBack = () => {
    clearPendingPhone();
    router.replace('/login');
  };

  const handleOtpChange = (value: string) => {
    if (locked) return;
    setOtp(value.replace(/\D/g, '').slice(0, OTP_LENGTH));
    if (error) setError('');
  };

  const handleVerify = async () => {
    if (submitting || locked) return;
    if (otp.length !== OTP_LENGTH) {
      setError('Enter the complete 6-digit OTP.');
      inputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setError('');
    const verified = await verifyOtp(otp);
    if (!verified) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setOtp('');
      if (nextAttempts >= MAX_ATTEMPTS) {
        setLocked(true);
        setError('Too many incorrect attempts. Request a new OTP to continue.');
      } else {
        setError(
          `Incorrect OTP. ${MAX_ATTEMPTS - nextAttempts} attempt${
            MAX_ATTEMPTS - nextAttempts === 1 ? '' : 's'
          } remaining.`,
        );
        requestAnimationFrame(() => inputRef.current?.focus());
      }
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!pendingPhone || resendIn > 0) return;
    setSubmitting(true);
    setError('');
    setOtp('');
    setAttempts(0);
    setLocked(false);
    try {
      await requestOtp(pendingPhone);
      setResendIn(RESEND_SECONDS);
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch {
      setError('Unable to resend OTP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!pendingPhone) return null;

  const activeIndex = otp.length === OTP_LENGTH ? OTP_LENGTH - 1 : otp.length;

  return (
    <AuthScaffold
      title="Verify OTP"
      subtitle="Enter the secure code sent to your registered mobile number."
      onBack={handleBack}
    >
      <View style={styles.heading}>
        <View style={styles.headingIcon}>
          <MaterialCommunityIcons name="key-outline" size={25} color={C.card} />
        </View>
        <View style={styles.headingCopy}>
          <T style={styles.title}>Verify your code</T>
          <T style={styles.description}>Complete verification to access your workspace.</T>
        </View>
      </View>

      <View style={styles.phoneSummary}>
        <View style={styles.phoneIcon}>
          <MaterialCommunityIcons name="message-lock-outline" size={21} color={C.primary} />
        </View>
        <View style={styles.phoneCopy}>
          <T style={styles.sentLabel}>Code sent to</T>
          <T style={styles.phoneNumber}>{formatIndianMobile(pendingPhone)}</T>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Change mobile number"
          activeOpacity={0.76}
          onPress={handleBack}
          style={styles.changeButton}
        >
          <MaterialCommunityIcons name="pencil-outline" size={15} color={C.primary} />
          <T style={styles.changeText}>Edit</T>
        </TouchableOpacity>
      </View>

      <T style={styles.label}>Enter 6-digit OTP</T>
      <Pressable
        accessibilityRole="none"
        onPress={() => inputRef.current?.focus()}
        style={styles.otpRow}
      >
        {Array.from({ length: OTP_LENGTH }, (_, index) => {
          const digit = otp[index] || '';
          const active = focused && index === activeIndex;
          return (
            <View
              key={index}
              pointerEvents="none"
              style={[
                styles.otpCell,
                !!digit && styles.otpCellFilled,
                active && styles.otpCellActive,
                !!error && styles.otpCellError,
              ]}
            >
              <T style={styles.otpDigit}>{digit}</T>
            </View>
          );
        })}
        <TextInput
          ref={inputRef}
          accessibilityLabel="Six-digit one-time password"
          value={otp}
          onChangeText={handleOtpChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={handleVerify}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={OTP_LENGTH}
          returnKeyType="done"
          autoFocus
          caretHidden
          style={styles.hiddenInput}
        />
      </Pressable>

      {error ? (
        <View style={styles.errorRow}>
          <MaterialCommunityIcons name="alert-circle-outline" size={15} color={C.red} />
          <T style={styles.errorText}>{error}</T>
        </View>
      ) : null}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Verify OTP and login"
        accessibilityState={{ disabled: submitting || locked || otp.length !== OTP_LENGTH }}
        activeOpacity={0.84}
        disabled={submitting || locked || otp.length !== OTP_LENGTH}
        onPress={handleVerify}
        style={[
          styles.primaryButton,
          (submitting || locked || otp.length !== OTP_LENGTH) && styles.primaryButtonDisabled,
        ]}
      >
        {submitting ? (
          <ActivityIndicator size="small" color={C.card} />
        ) : (
          <>
            <MaterialCommunityIcons name="check-decagram-outline" size={21} color={C.card} />
            <T style={styles.primaryButtonText}>Verify & Login</T>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.resendRow}>
        <T style={styles.resendPrompt}>Didn’t receive the code?</T>
        {resendIn > 0 ? (
          <View style={styles.timerPill}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={C.sub} />
            <T style={styles.timerText}>00:{String(resendIn).padStart(2, '0')}</T>
          </View>
        ) : (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Resend OTP"
            activeOpacity={0.76}
            disabled={submitting}
            onPress={handleResend}
            style={styles.resendButton}
          >
            <MaterialCommunityIcons name="refresh" size={16} color={C.primary} />
            <T style={styles.resendText}>Resend OTP</T>
          </TouchableOpacity>
        )}
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  headingIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
  },
  headingCopy: { flex: 1, minWidth: 0, paddingLeft: 10 },
  title: { color: C.text, fontFamily: F.bold, fontSize: 18, lineHeight: 23 },
  description: {
    marginTop: 3,
    color: C.sub,
    fontFamily: F.regular,
    fontSize: 11,
    lineHeight: 16,
  },
  phoneSummary: {
    minHeight: 60,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: C.primaryPale,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  phoneIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
  },
  phoneCopy: { flex: 1, minWidth: 0, paddingLeft: 9 },
  sentLabel: { color: C.sub, fontFamily: F.regular, fontSize: 10 },
  phoneNumber: { marginTop: 2, color: C.text, fontFamily: F.bold, fontSize: 13 },
  changeButton: {
    minHeight: 34,
    paddingHorizontal: 9,
    borderRadius: 11,
    backgroundColor: C.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  changeText: { color: C.primary, fontFamily: F.semibold, fontSize: 10 },
  label: {
    marginBottom: 8,
    color: C.text,
    fontFamily: F.semibold,
    fontSize: 12,
  },
  otpRow: {
    width: '100%',
    height: 53,
    flexDirection: 'row',
    gap: 6,
    position: 'relative',
  },
  otpCell: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: C.borderStrong,
    borderRadius: 13,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpCellActive: { borderWidth: 2, borderColor: C.primary, backgroundColor: C.primaryPale },
  otpCellFilled: { borderColor: C.primaryBorder, backgroundColor: C.primaryPale },
  otpCellError: { borderColor: C.red, backgroundColor: '#FFFAFA' },
  otpDigit: { color: C.text, fontFamily: F.bold, fontSize: 20 },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01,
    color: 'transparent',
    backgroundColor: 'transparent',
    outlineStyle: 'none',
  } as any,
  errorRow: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  errorText: { flex: 1, color: C.red, fontFamily: F.regular, fontSize: 10.5, lineHeight: 15 },
  primaryButton: {
    height: 52,
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonDisabled: { opacity: 0.48 },
  primaryButtonText: { color: C.card, fontFamily: F.bold, fontSize: 14 },
  resendRow: {
    minHeight: 38,
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  resendPrompt: { color: C.sub, fontFamily: F.regular, fontSize: 10.5 },
  timerPill: {
    minHeight: 31,
    paddingHorizontal: 10,
    borderRadius: 11,
    backgroundColor: C.bg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: { color: C.sub, fontFamily: F.semibold, fontSize: 10.5 },
  resendButton: {
    minHeight: 32,
    paddingHorizontal: 9,
    borderRadius: 11,
    backgroundColor: C.primaryPale,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resendText: { color: C.primary, fontFamily: F.bold, fontSize: 10.5 },
});
