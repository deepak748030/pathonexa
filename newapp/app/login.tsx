import React from 'react';
import {
  ActivityIndicator,
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
import { isValidIndianMobile, normalizeIndianMobile, useAuth } from '../src/auth';

export default function LoginScreen() {
  const { requestOtp } = useAuth();
  const [phone, setPhone] = React.useState('');
  const [error, setError] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const valid = isValidIndianMobile(phone);

  const handlePhoneChange = (value: string) => {
    setPhone(normalizeIndianMobile(value));
    if (error) setError('');
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!valid) {
      setError('Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await requestOtp(phone);
      router.push('/verify-otp');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send OTP. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScaffold
      title="Welcome back"
      subtitle="Sign in with your registered Indian mobile number to continue."
      footer={
        <T style={styles.footerText}>
          Protected by encrypted verification. Your details stay private.
        </T>
      }
    >
      <View style={styles.cardHeading}>
        <View style={styles.titleIcon}>
          <MaterialCommunityIcons name="account-lock-outline" size={19} color={C.primary} />
        </View>
        <View style={styles.headingCopy}>
          <T style={styles.title}>Login to your account</T>
          <T style={styles.description}>We will verify your number with a one-time password.</T>
        </View>
      </View>

      <T style={styles.label}>Mobile number</T>
      <View
        style={[
          styles.phoneField,
          focused && styles.phoneFieldFocused,
          !!error && styles.phoneFieldError,
        ]}
      >
        <View style={styles.prefix}>
          <MaterialCommunityIcons name="cellphone" size={17} color={C.primary} />
          <T style={styles.prefixText}>+91</T>
        </View>
        <TextInput
          accessibilityLabel="Indian mobile number"
          value={phone}
          onChangeText={handlePhoneChange}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            if (phone && !valid) {
              setError('Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
            }
          }}
          onSubmitEditing={handleSubmit}
          placeholder="10-digit mobile number"
          placeholderTextColor={C.faint}
          keyboardType="number-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          returnKeyType="done"
          style={styles.input}
        />
        {phone ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Clear mobile number"
            activeOpacity={0.72}
            onPress={() => {
              setPhone('');
              setError('');
            }}
            style={styles.clearButton}
          >
            <MaterialCommunityIcons name="close-circle" size={18} color={C.faint} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.helperRow}>
        <MaterialCommunityIcons
          name={error ? 'alert-circle-outline' : 'information-outline'}
          size={14}
          color={error ? C.red : C.sub}
        />
        <T style={[styles.helper, error && styles.errorText]}>
          {error || 'Only Indian mobile numbers are supported.'}
        </T>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Continue to OTP verification"
        accessibilityState={{ disabled: submitting }}
        activeOpacity={0.82}
        disabled={submitting}
        onPress={handleSubmit}
        style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
      >
        {submitting ? (
          <ActivityIndicator size="small" color={C.card} />
        ) : (
          <>
            <T style={styles.primaryButtonText}>Send OTP</T>
            <MaterialCommunityIcons name="arrow-right" size={19} color={C.card} />
          </>
        )}
      </TouchableOpacity>

      <View style={styles.trustRow}>
        <View style={styles.trustItem}>
          <MaterialCommunityIcons name="shield-key-outline" size={16} color={C.green} />
          <T style={styles.trustText}>Secure OTP</T>
        </View>
        <View style={styles.trustDivider} />
        <View style={styles.trustItem}>
          <MaterialCommunityIcons name="clock-fast" size={16} color={C.primary} />
          <T style={styles.trustText}>Quick access</T>
        </View>
      </View>

      <T style={styles.legal}>
        By continuing, you agree to PathoNexa’s Terms of Use and Privacy Policy.
      </T>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
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
  label: {
    marginBottom: 4,
    color: C.text,
    fontFamily: F.semibold,
    fontSize: 11.5,
  },
  phoneField: {
    height: 46,
    borderWidth: 1,
    borderColor: C.borderStrong,
    borderRadius: R.field,
    backgroundColor: C.card,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  phoneFieldFocused: { borderColor: C.primary, backgroundColor: C.primaryPale },
  phoneFieldError: { borderColor: C.red, backgroundColor: '#fffafa' },
  prefix: {
    height: '100%',
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.bg,
  },
  prefixText: { color: C.text, fontFamily: F.semibold, fontSize: 13 },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
    paddingVertical: 0,
    color: C.text,
    fontFamily: F.semibold,
    fontSize: 14,
    letterSpacing: 0.4,
    outlineStyle: 'none',
  } as any,
  clearButton: {
    width: 38,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperRow: {
    minHeight: 21,
    paddingTop: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  helper: { flex: 1, color: C.sub, fontFamily: F.regular, fontSize: 10, lineHeight: 14 },
  errorText: { color: C.red },
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
  primaryButtonDisabled: { opacity: 0.68 },
  primaryButtonText: { color: C.card, fontFamily: F.bold, fontSize: 13 },
  trustRow: {
    minHeight: 34,
    marginTop: 12,
    borderRadius: R.field,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustItem: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 },
  trustDivider: { width: 1, height: 18, backgroundColor: C.border },
  trustText: { color: C.sub, fontFamily: F.medium, fontSize: 10 },
  legal: {
    marginTop: 10,
    color: C.faint,
    fontFamily: F.regular,
    fontSize: 9.5,
    lineHeight: 14,
    textAlign: 'center',
  },
  footerText: {
    color: C.sub,
    fontFamily: F.regular,
    fontSize: 9.5,
    lineHeight: 14,
    textAlign: 'center',
  },
});
