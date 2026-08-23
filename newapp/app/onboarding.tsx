// First-time setup — ask for the owner's name and email before entering the app.
import React from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { T } from '../components/T';
import { AuthScaffold } from '../components/AuthScaffold';
import { Press } from '../components/kit';
import { C, F } from '../src/theme';
import { useAuth } from '../src/auth';
import { useFeedback } from '../src/feedback';

export default function Onboarding() {
  const { user, completeProfile } = useAuth();
  const { toast } = useFeedback();
  const [name, setName] = React.useState(() => (user && user.name !== 'Lab Owner' ? user.name : ''));
  const [email, setEmail] = React.useState(user?.email || '');
  const [submitting, setSubmitting] = React.useState(false);
  const [focused, setFocused] = React.useState<'name' | 'email' | null>(null);

  const emailValid = !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleContinue = async () => {
    if (submitting) return;
    if (!name.trim()) {
      toast({ kind: 'warning', title: 'Your name is required', message: 'Enter your name to continue setting up your lab account.' });
      return;
    }
    if (!email.trim() || !emailValid) {
      toast({ kind: 'warning', title: 'Enter a valid email', message: 'We use this email for reports and account recovery.' });
      return;
    }
    setSubmitting(true);
    try {
      await completeProfile(name.trim(), email.trim());
    } catch (error) {
      toast({ kind: 'error', title: 'Unable to save your profile', message: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScaffold
      title="Welcome to PathoNexa 👋"
      subtitle="Let's set up your account. Add your name and email so your lab records and reports carry the right details."
    >
      <View style={styles.form}>
        <T style={styles.label}>Your name</T>
        <View style={[styles.field, focused === 'name' && styles.fieldFocused]}>
          <MaterialCommunityIcons name="account-outline" size={19} color={C.primary} />
          <View style={styles.divider} />
          <TextInput
            value={name}
            onChangeText={setName}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
            style={styles.input}
            placeholder="e.g. Dr. Anil Sharma"
            placeholderTextColor={C.faint}
            selectionColor={C.primary}
            autoCapitalize="words"
            returnKeyType="next"
            accessibilityLabel="Your name"
          />
        </View>

        <T style={[styles.label, { marginTop: 14 }]}>Email address</T>
        <View style={[styles.field, focused === 'email' && styles.fieldFocused, !emailValid && styles.fieldError]}>
          <MaterialCommunityIcons name="email-outline" size={19} color={C.primary} />
          <View style={styles.divider} />
          <TextInput
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            onSubmitEditing={handleContinue}
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={C.faint}
            selectionColor={C.primary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="done"
            accessibilityLabel="Email address"
          />
          {emailValid && !!email.trim() ? <MaterialCommunityIcons name="check-decagram" size={19} color={C.green} /> : null}
        </View>

        <Press
          style={[styles.continueButton, (submitting || !name.trim() || !emailValid) && styles.continueDisabled]}
          onPress={handleContinue}
          disabled={submitting}
          accessibilityLabel="Complete account setup"
          accessibilityState={{ disabled: submitting }}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <T style={styles.continueText}>Continue to dashboard</T>
              <View style={styles.buttonIcon}>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
              </View>
            </>
          )}
        </Press>

        <T style={styles.note}>
          You can update these details anytime from the Lab Profile screen.
        </T>
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  form: { marginTop: 24 },
  label: { marginBottom: 6, color: C.text, fontFamily: F.semibold, fontSize: 12 },
  field: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    backgroundColor: '#F9FBFE',
  },
  fieldFocused: { borderColor: C.primary, backgroundColor: '#fff' },
  fieldError: { borderColor: C.red, backgroundColor: '#FFF8F8' },
  divider: { width: 1, height: 22, marginHorizontal: 8, backgroundColor: C.border },
  input: { flex: 1, minWidth: 0, paddingVertical: 11, color: C.text, fontFamily: F.semibold, fontSize: 14 },
  continueButton: {
    minHeight: 50,
    marginTop: 20,
    paddingHorizontal: 7,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: C.primary,
  },
  continueDisabled: { opacity: 0.5 },
  continueText: { color: '#fff', fontFamily: F.bold, fontSize: 14, textAlign: 'center' },
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
  note: { color: C.faint, fontSize: 10.5, textAlign: 'center', marginTop: 12 },
});
