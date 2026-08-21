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
import { C, F, R } from '../src/theme';
import { DEMO_OTP, formatIndianMobile, useAuth } from '../src/auth';

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
        setError(`Incorrect OTP. ${MAX_ATTEMPTS - nextAttempts} attempt${MAX_ATTEMPTS - nextAttempts === 1 ? '' : 's'} remaining.`);
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
      title="Verify your number"
      subtitle="Enter the one-time password sent to your mobile number."
      onBack={handleBack}
      footer={
        <View style={styles.footerRow}>
          <MaterialCommunityIcons name="lock-check-outline" size={14} color={C.green} />
          <T style={styles.footerText}>OTP verification keeps your workspace protected.</T>
        </View>
      }
    >
      <View style={styles.cardHeading}>
        <View style={styles.titleIcon}>
          <MaterialCommunityIcons name="message-processing-outline" size={19} color={C.primary} />
        </View>
        <View style={styles.headingCopy}>
          <T style={styles.title}>OTP verification</T>
          <T style={styles.description}>Use the secure 6-digit code to complete login.</T>
        </View>
      </View>

      <View style={styles.phoneSummary}>
        <View style={styles.phoneIcon}>
          <MaterialCommunityIcons name="cellphone-check" size={18} color={C.primary} />
        </View>
        <View style={styles.phoneCopy}>
          <T style={styles.sentLabel}>Code sent to</T>
          <T style={styles.phoneNumber}>{formatIndianMobile(pendingPhone)}</T>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Change mobile number"
          activeOpacity={0.72}
          onPress={handleBack}
          style={styles.changeButton}
        >
          <MaterialCommunityIcons name="pencil-outline" size={14} color={C.primary} />
          <T style={styles.changeText}>Change</T>
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

      <View style={styles.feedbackRow}>
        <MaterialCommunityIcons
          name={error ? 'alert-circle-outline' : 'information-outline'}
          size={14}
          color={error ? C.red : C.sub}
        />
        <T style={[styles.feedbackText, error && styles.errorText]}>
          {error || 'The OTP is valid for this login attempt only.'}
        </T>
      </View>

      <View style={styles.demoBanner}>
        <MaterialCommunityIcons name="test-tube" size={17} color={C.primary} />
        <View style={styles.demoCopy}>
          <T style={styles.demoLabel}>Temporary testing OTP</T>
          <T style={styles.demoText}>Use {DEMO_OTP} to complete verification.</T>
        </View>
        <View style={styles.codePill}>
          <T style={styles.codeText}>{DEMO_OTP}</T>
        </View>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Verify OTP and login"
        accessibilityState={{ disabled: submitting || locked || otp.length !== OTP_LENGTH }}
        activeOpacity={0.82}
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
            <MaterialCommunityIcons name="shield-check-outline" size={19} color={C.card} />
            <T style={styles.primaryButtonText}>Verify & Login</T>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.resendRow}>
        <T style={styles.resendPrompt}>Didn’t receive the code?</T>
        {resendIn > 0 ? (
          <View style={styles.timerPill}>
            <MaterialCommunityIcons name="timer-sand" size={13} color={C.sub} />
            <T style={styles.timerText}>Resend in 00:{String(resendIn).padStart(2, '0')}</T>
          </View>
        ) : (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Resend OTP"
            activeOpacity={0.72}
            disabled={submitting}
            onPress={handleResend}
            style={styles.resendButton}
          >
            <MaterialCommunityIcons name="refresh" size={15} color={C.primary} />
            <T style={styles.resendText}>Resend OTP</T>
          </TouchableOpacity>
        )}
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  titleIcon: {
    width: 38,
    height: 38,
    borderRadius: R.field,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.blueSoft,
  },
  headingCopy: { flex: 1, paddingLeft: 4 },
  title: { color: C.text, fontFamily: F.bold, fontSize: 17, lineHeight: 22 },
  description: {
    marginTop: 2,
    color: C.sub,
    fontFamily: F.regular,
    fontSize: 10.5,
    lineHeight: 15,
  },
  phoneSummary: {
    minHeight: 54,
    paddingHorizontal: 8,
    borderRadius: R.field,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 14,
  },
  phoneIcon: {
    width: 32,
    height: 32,
    borderRadius: R.field,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.blueSoft,
  },
  phoneCopy: { flex: 1, paddingLeft: 4 },
  sentLabel: { color: C.sub, fontFamily: F.regular, fontSize: 9.5 },
  phoneNumber: { marginTop: 1, color: C.text, fontFamily: F.bold, fontSize: 12.5 },
  changeButton: {
    minHeight: 30,
    paddingHorizontal: 7,
    borderRadius: R.field,
    borderWidth: 1,
    borderColor: C.primaryBorder,
    backgroundColor: C.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  changeText: { color: C.primary, fontFamily: F.semibold, fontSize: 9.5 },
  label: {
    marginBottom: 6,
    color: C.text,
    fontFamily: F.semibold,
    fontSize: 11.5,
  },
  otpRow: {
    width: '100%',
    height: 49,
    flexDirection: 'row',
    gap: 4,
    position: 'relative',
  },
  otpCell: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: C.borderStrong,
    borderRadius: R.field,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpCellActive: { borderWidth: 2, borderColor: C.primary, backgroundColor: C.primaryPale },
  otpCellFilled: { borderColor: C.primaryBorder, backgroundColor: C.primaryPale },
  otpCellError: { borderColor: C.red, backgroundColor: '#fffafa' },
  otpDigit: { color: C.text, fontFamily: F.bold, fontSize: 19 },
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
  feedbackRow: {
    minHeight: 23,
    paddingTop: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  feedbackText: { flex: 1, color: C.sub, fontFamily: F.regular, fontSize: 10, lineHeight: 14 },
  errorText: { color: C.red },
  demoBanner: {
    minHeight: 48,
    marginTop: 8,
    paddingHorizontal: 8,
    borderRadius: R.field,
    borderWidth: 1,
    borderColor: C.primaryBorder,
    backgroundColor: C.primaryPale,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  demoCopy: { flex: 1, paddingLeft: 4 },
  demoLabel: { color: C.primary, fontFamily: F.bold, fontSize: 9.5 },
  demoText: { marginTop: 1, color: C.sub, fontFamily: F.regular, fontSize: 9.5 },
  codePill: {
    minHeight: 27,
    paddingHorizontal: 8,
    borderRadius: R.field,
    borderWidth: 1,
    borderColor: C.primaryBorder,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: { color: C.primaryDark, fontFamily: F.bold, fontSize: 12, letterSpacing: 1 },
  primaryButton: {
    height: 46,
    marginTop: 12,
    borderRadius: R.field,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: C.card, fontFamily: F.bold, fontSize: 13 },
  resendRow: {
    minHeight: 35,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  resendPrompt: { color: C.sub, fontFamily: F.regular, fontSize: 10.5 },
  timerPill: {
    minHeight: 27,
    paddingHorizontal: 7,
    borderRadius: R.field,
    backgroundColor: C.bg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timerText: { color: C.sub, fontFamily: F.semibold, fontSize: 10 },
  resendButton: {
    minHeight: 30,
    paddingHorizontal: 7,
    borderRadius: R.field,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  resendText: { color: C.primary, fontFamily: F.bold, fontSize: 10.5 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  footerText: { color: C.sub, fontFamily: F.regular, fontSize: 9.5 },
});
