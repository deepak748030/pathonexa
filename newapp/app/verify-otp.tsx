import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { AuthScaffold } from '../components/AuthScaffold';
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
    if (!pendingPhone || resendIn > 0 || submitting) return;
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
      title="Check your messages"
      subtitle="Enter the six-digit one-time password sent to your registered mobile number."
      onBack={handleBack}
    >
      <View style={styles.form}>
        <View style={styles.phoneSummary}>
          <View style={styles.phoneIcon}>
            <MaterialCommunityIcons name="message-lock-outline" size={18} color={C.primary} />
          </View>
          <View style={styles.phoneCopy}>
            <T style={styles.sentLabel}>OTP sent to</T>
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
            <T style={styles.changeText}>Change</T>
          </TouchableOpacity>
        </View>

        <View style={styles.otpHeading}>
          <T style={styles.label}>One-time password</T>
          <View style={styles.secureTag}>
            <MaterialCommunityIcons name="shield-check-outline" size={13} color={C.green} />
            <T style={styles.secureTagText}>Secure</T>
          </View>
        </View>
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
                  index > 0 && styles.otpCellJoined,
                  index === 0 && styles.otpCellFirst,
                  index === OTP_LENGTH - 1 && styles.otpCellLast,
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
            styles.verifyButton,
            (submitting || locked || otp.length !== OTP_LENGTH) && styles.verifyButtonDisabled,
          ]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <T style={styles.verifyButtonText}>Verify and sign in</T>
              <View style={styles.verifyIcon}>
                <MaterialCommunityIcons name="lock-check-outline" size={19} color="#fff" />
              </View>
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
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  form: { marginTop: 20 },
  phoneSummary: {
    minHeight: 56,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#DDE9F9',
    borderRadius: 12,
    backgroundColor: '#F6FAFF',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  phoneIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
  },
  phoneCopy: { flex: 1, minWidth: 0, paddingLeft: 9 },
  sentLabel: { color: C.sub, fontFamily: F.regular, fontSize: 10 },
  phoneNumber: { marginTop: 2, color: C.text, fontFamily: F.bold, fontSize: 13 },
  changeButton: {
    minHeight: 30,
    paddingHorizontal: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.primaryBorder,
    backgroundColor: C.card,
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: { marginLeft: 3, color: C.primary, fontFamily: F.semibold, fontSize: 10 },
  otpHeading: {
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { color: C.text, fontFamily: F.semibold, fontSize: 12 },
  secureTag: { flexDirection: 'row', alignItems: 'center' },
  secureTagText: { marginLeft: 3, color: C.green, fontFamily: F.semibold, fontSize: 10 },
  otpRow: {
    width: '100%',
    height: 48,
    flexDirection: 'row',
    gap: 0,
    position: 'relative',
  },
  otpCell: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: C.borderStrong,
    backgroundColor: '#F9FBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpCellJoined: { borderLeftWidth: 0 },
  otpCellFirst: { borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  otpCellLast: { borderTopRightRadius: 12, borderBottomRightRadius: 12 },
  otpCellActive: { borderWidth: 2, borderColor: C.primary, backgroundColor: C.primaryPale },
  otpCellFilled: { borderColor: C.primaryBorder, backgroundColor: C.primaryPale },
  otpCellError: { borderColor: C.red, backgroundColor: '#FFF8F8' },
  otpDigit: { color: C.text, fontFamily: F.bold, fontSize: 18 },
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
  errorRow: { marginTop: 5, flexDirection: 'row', alignItems: 'flex-start' },
  errorText: { flex: 1, marginLeft: 5, color: C.red, fontFamily: F.regular, fontSize: 10.5, lineHeight: 15 },
  verifyButton: {
    minHeight: 50,
    marginTop: 14,
    paddingHorizontal: 7,
    borderRadius: 12,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonDisabled: { opacity: 0.48 },
  verifyButtonText: { color: '#fff', fontFamily: F.bold, fontSize: 14 },
  verifyIcon: {
    position: 'absolute',
    right: 7,
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  resendRow: {
    minHeight: 34,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendPrompt: { color: C.sub, fontFamily: F.regular, fontSize: 10.5 },
  timerPill: {
    minHeight: 28,
    marginLeft: 7,
    paddingHorizontal: 10,
    borderRadius: 11,
    backgroundColor: C.bg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: { marginLeft: 4, color: C.sub, fontFamily: F.semibold, fontSize: 10.5 },
  resendButton: {
    minHeight: 30,
    marginLeft: 7,
    paddingHorizontal: 9,
    borderRadius: 11,
    backgroundColor: C.primaryPale,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendText: { marginLeft: 4, color: C.primary, fontFamily: F.bold, fontSize: 10.5 },
});
