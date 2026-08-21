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
import { C, F } from '../src/theme';
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
      setError('Enter a valid 10-digit mobile number.');
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
      subtitle="Sign in securely with your registered mobile number."
    >
      <View style={styles.heading}>
        <View style={styles.headingIcon}>
          <MaterialCommunityIcons name="account-arrow-right-outline" size={24} color={C.card} />
        </View>
        <View style={styles.headingCopy}>
          <T style={styles.title}>Sign in to PathoNexa</T>
          <T style={styles.description}>Enter your mobile number to receive a secure login code.</T>
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
          <MaterialCommunityIcons name="phone-outline" size={19} color={C.primary} />
          <T style={styles.prefixText}>+91</T>
        </View>
        <TextInput
          accessibilityLabel="Mobile number"
          value={phone}
          onChangeText={handlePhoneChange}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            if (phone && !valid) setError('Enter a valid 10-digit mobile number.');
          }}
          onSubmitEditing={handleSubmit}
          placeholder="Enter mobile number"
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
            <MaterialCommunityIcons name="close" size={18} color={C.sub} />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <MaterialCommunityIcons name="alert-circle-outline" size={15} color={C.red} />
          <T style={styles.errorText}>{error}</T>
        </View>
      ) : null}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Continue to OTP verification"
        accessibilityState={{ disabled: submitting }}
        activeOpacity={0.84}
        disabled={submitting}
        onPress={handleSubmit}
        style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
      >
        {submitting ? (
          <ActivityIndicator size="small" color={C.card} />
        ) : (
          <>
            <T style={styles.primaryButtonText}>Send OTP</T>
            <MaterialCommunityIcons name="message-arrow-right-outline" size={20} color={C.card} />
          </>
        )}
      </TouchableOpacity>

      <View style={styles.securityRow}>
        <MaterialCommunityIcons name="shield-lock-outline" size={17} color={C.green} />
        <T style={styles.securityText}>Secure and encrypted OTP verification</T>
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
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
  label: {
    marginBottom: 7,
    color: C.text,
    fontFamily: F.semibold,
    fontSize: 12,
  },
  phoneField: {
    height: 54,
    borderWidth: 1,
    borderColor: C.borderStrong,
    borderRadius: 14,
    backgroundColor: C.card,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  phoneFieldFocused: { borderWidth: 2, borderColor: C.primary, backgroundColor: C.primaryPale },
  phoneFieldError: { borderColor: C.red, backgroundColor: '#FFFAFA' },
  prefix: {
    height: '100%',
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.primaryPale,
  },
  prefixText: { color: C.text, fontFamily: F.bold, fontSize: 14 },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    paddingVertical: 0,
    color: C.text,
    fontFamily: F.semibold,
    fontSize: 14,
    letterSpacing: 0.3,
    outlineStyle: 'none',
  } as any,
  clearButton: {
    width: 42,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  primaryButtonDisabled: { opacity: 0.68 },
  primaryButtonText: { color: C.card, fontFamily: F.bold, fontSize: 14 },
  securityRow: {
    minHeight: 40,
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: C.greenSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  securityText: { color: C.green, fontFamily: F.semibold, fontSize: 10.5 },
});
