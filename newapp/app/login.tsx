import React from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { T } from '../components/T';
import { AuthScaffold } from '../components/AuthScaffold';
import { Press } from '../components/kit';
import { C, F } from '../src/theme';
import { isValidIndianMobile, normalizeIndianMobile, useAuth } from '../src/auth';

export default function Login() {
  const router = useRouter();
  const { isAuthenticated, pendingPhone, requestOtp } = useAuth();
  const [mobile, setMobile] = React.useState(() => pendingPhone ?? '');
  const [error, setError] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const normalizedMobile = normalizeIndianMobile(mobile);
  const isValid = isValidIndianMobile(normalizedMobile);

  if (isAuthenticated) return <Redirect href="/(tabs)" />;

  const handleMobileChange = (value: string) => {
    setMobile(normalizeIndianMobile(value));
    if (error) setError('');
  };

  const handleContinue = async () => {
    if (submitting) return;
    if (!isValid) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await requestOtp(normalizedMobile);
      router.push('/verify-otp');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send OTP. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScaffold
      title="Sign in to your lab"
      subtitle="Enter the registered mobile number linked with your PathoNexa workspace."
    >
      <View style={styles.form}>
        <T style={styles.label}>Mobile number</T>
        <View style={[styles.phoneField, focused && styles.phoneFieldFocused, error && styles.phoneFieldError]}>
          <View style={styles.countryPrefix}>
            <MaterialCommunityIcons name="phone-outline" size={19} color={C.primary} />
            <T style={styles.countryCode}>+91</T>
          </View>
          <View style={styles.fieldDivider} />
          <TextInput
            value={mobile}
            onChangeText={handleMobileChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={handleContinue}
            style={styles.input}
            placeholder="10-digit mobile number"
            placeholderTextColor={C.faint}
            selectionColor={C.primary}
            keyboardType="number-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            maxLength={12}
            returnKeyType="done"
            accessibilityLabel="Indian mobile number"
          />
          {isValid ? <MaterialCommunityIcons name="check-decagram" size={19} color={C.green} /> : null}
        </View>
        {error ? (
          <View style={styles.errorRow}>
            <MaterialCommunityIcons name="alert-circle-outline" size={15} color={C.red} />
            <T style={styles.errorText}>{error}</T>
          </View>
        ) : null}

        <Press
          style={[styles.continueButton, (!isValid || submitting) && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={submitting}
          accessibilityLabel="Continue to OTP verification"
          accessibilityState={{ disabled: !isValid || submitting }}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={styles.continueContent}>
              <T style={styles.continueText}>Continue securely</T>
              <View style={styles.buttonIcon}>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
              </View>
            </View>
          )}
        </Press>

        <View style={styles.assurance}>
          <View style={styles.assuranceIcon}>
            <MaterialCommunityIcons name="shield-lock-outline" size={20} color={C.primary} />
          </View>
          <View style={styles.assuranceCopy}>
            <T style={styles.assuranceTitle}>Protected sign-in</T>
            <T style={styles.assuranceText}>Your account is verified with a one-time password.</T>
          </View>
          <MaterialCommunityIcons name="check-circle-outline" size={18} color={C.green} />
        </View>
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  form: { marginTop: 24 },
  label: {
    marginBottom: 6,
    color: C.text,
    fontFamily: F.semibold,
    fontSize: 12,
  },
  phoneField: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    backgroundColor: '#F9FBFE',
  },
  phoneFieldFocused: { borderColor: C.primary, backgroundColor: '#fff' },
  phoneFieldError: { borderColor: C.red, backgroundColor: '#FFF8F8' },
  countryPrefix: {
    minWidth: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    marginLeft: 5,
    color: C.text,
    fontFamily: F.bold,
    fontSize: 14,
  },
  fieldDivider: { width: 1, height: 22, marginRight: 8, backgroundColor: C.border },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 11,
    color: C.text,
    fontFamily: F.semibold,
    fontSize: 14,
    letterSpacing: 0.4,
  },
  errorRow: { marginTop: 5, flexDirection: 'row', alignItems: 'center' },
  errorText: { marginLeft: 5, color: C.red, fontFamily: F.medium, fontSize: 11.5 },
  continueButton: {
    minHeight: 50,
    marginTop: 14,
    paddingHorizontal: 7,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: C.primary,
  },
  continueButtonDisabled: { opacity: 0.5 },
  continueContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  continueText: { color: '#fff', fontFamily: F.bold, fontSize: 14 },
  buttonIcon: {
    position: 'absolute',
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  assurance: {
    minHeight: 58,
    marginTop: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDE9F9',
    borderRadius: 12,
    backgroundColor: '#F6FAFF',
  },
  assuranceIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primaryPale,
  },
  assuranceCopy: { flex: 1, minWidth: 0, marginHorizontal: 9 },
  assuranceTitle: { color: C.text, fontFamily: F.semibold, fontSize: 11.5 },
  assuranceText: { marginTop: 2, color: C.sub, fontFamily: F.regular, fontSize: 10.5, lineHeight: 14 },
});
