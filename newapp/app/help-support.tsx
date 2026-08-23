import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { T } from '../components/T';
import { BlueHeader, Card, Skeleton } from '../components/kit';
import { api, type AuthUser, type LabSettings } from '../src/api';
import { C, PAGE_GUTTER } from '../src/theme';
import { useFeedback } from '../src/feedback';

const SUPPORT_EMAIL = 'care@pathonexa.in';
const SUPPORT_PHONE = '+919876543210';

const FAQS = [
  { question: 'How do I create a patient report?', answer: 'Open Create Report, select or add the patient, choose tests, fill results, review billing, and save the report. Saved reports appear in the Reports tab.' },
  { question: 'How is my lab data protected?', answer: 'Every request is authenticated and bound to your mobile account. Server records and signed backups cannot be read or restored by another mobile account.' },
  { question: 'How do I restore deleted data?', answer: 'Open More, then Deleted Records. Restore a patient before restoring any report linked to that patient.' },
  { question: 'How do backups work?', answer: 'Open Data Backup to create a server backup point or export a signed JSON file. Restore accepts only intact backups created for the same mobile account.' },
  { question: 'Why can’t I delete a doctor?', answer: 'Doctors with report or commission history are protected so financial and clinical history remains accurate. You may edit their current contact details instead.' },
  { question: 'What should I do if a request fails?', answer: 'Check your internet connection, use the refresh action, and try again. If the issue continues, contact support with your Lab ID and a short description.' },
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const { toast } = useFeedback();

  const openLink = async (url: string) => {
    try {
      if (!(await Linking.canOpenURL(url))) throw new Error('This action is not available on your device.');
      await Linking.openURL(url);
    } catch (error) {
      toast({ kind: 'error', title: 'Unable to open', message: error instanceof Error ? error.message : 'Please try again.' });
    }
  };
  const [account, setAccount] = React.useState<AuthUser | null>(null);
  const [lab, setLab] = React.useState<LabSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [expanded, setExpanded] = React.useState<number | null>(0);
  const requestRef = React.useRef(0);

  const load = React.useCallback(async () => {
    const request = ++requestRef.current;
    setLoading(true);
    try {
      const [me, profile] = await Promise.all([api.auth.me(), api.lab.get()]);
      if (request !== requestRef.current) return;
      setAccount(me.user);
      setLab(profile);
      setError('');
    } catch (loadError) {
      if (request !== requestRef.current) return;
      setError(loadError instanceof Error ? loadError.message : 'Unable to load account support details.');
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load().catch(() => {});
    return () => { requestRef.current += 1; };
  }, [load]);

  const emailSubject = encodeURIComponent(`PathoNexa support · ${lab?.labId || account?.mobile || 'mobile app'}`);
  const emailBody = encodeURIComponent(`Hello PathoNexa Support,\n\nI need help with:\n\nLab: ${lab?.name || '—'}\nLab ID: ${lab?.labId || '—'}\nAccount: +91 ${account?.mobile || '—'}\n\nDetails:\n`);

  return (
    <View style={styles.screen}>
      <BlueHeader title="Help & Support" sub="Guides and contact assistance" onBack={() => router.back()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.hero}>
          <View style={styles.heroIcon}><MaterialCommunityIcons name="lifebuoy" size={30} color={C.primary} /></View>
          <View style={styles.heroCopy}>
            <T style={styles.heroTitle}>How can we help?</T>
            <T style={styles.heroSub}>Review quick answers or contact our support team with your account details.</T>
          </View>
        </Card>

        {!!error && (
          <TouchableOpacity activeOpacity={0.75} onPress={load} style={styles.error}>
            <MaterialCommunityIcons name="alert-circle-outline" size={17} color={C.red} />
            <T style={styles.errorText}>{error} Tap to retry.</T>
          </TouchableOpacity>
        )}

        <View style={styles.contactRow}>
          <TouchableOpacity activeOpacity={0.75} onPress={() => openLink(`mailto:${SUPPORT_EMAIL}?subject=${emailSubject}&body=${emailBody}`)} style={styles.contactCard}>
            <View style={[styles.contactIcon, { backgroundColor: C.blueSoft }]}><MaterialCommunityIcons name="email-outline" size={22} color={C.primary} /></View>
            <T style={styles.contactTitle}>Email support</T>
            <T style={styles.contactSub}>{SUPPORT_EMAIL}</T>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.75} onPress={() => openLink(`tel:${SUPPORT_PHONE}`)} style={styles.contactCard}>
            <View style={[styles.contactIcon, { backgroundColor: C.greenSoft }]}><MaterialCommunityIcons name="phone-outline" size={22} color={C.green} /></View>
            <T style={styles.contactTitle}>Call support</T>
            <T style={styles.contactSub}>+91 98765 43210</T>
          </TouchableOpacity>
        </View>

        <T style={styles.sectionTitle}>YOUR SUPPORT DETAILS</T>
        <Card style={styles.accountCard}>
          {loading ? Array.from({ length: 3 }).map((_, index) => (
            <View key={index} style={[styles.accountRow, index > 0 && styles.borderTop]}>
              <Skeleton width="30%" height={10} />
              <Skeleton width="42%" height={10} />
            </View>
          )) : [
            ['Lab name', lab?.name || 'Not configured'],
            ['Lab ID', lab?.labId || 'Not available'],
            ['Mobile account', account?.mobile ? `+91 ${account.mobile}` : 'Not available'],
          ].map(([label, value], index) => (
            <View key={label} style={[styles.accountRow, index > 0 && styles.borderTop]}>
              <T style={styles.accountLabel}>{label}</T>
              <T style={styles.accountValue} numberOfLines={1}>{value}</T>
            </View>
          ))}
        </Card>

        <T style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</T>
        <Card style={styles.faqCard}>
          {FAQS.map((faq, index) => {
            const open = expanded === index;
            return (
              <View key={faq.question} style={index > 0 && styles.borderTop}>
                <TouchableOpacity activeOpacity={0.72} onPress={() => setExpanded(open ? null : index)} style={styles.faqQuestion}>
                  <View style={styles.faqNumber}><T style={styles.faqNumberText}>{index + 1}</T></View>
                  <T style={styles.questionText}>{faq.question}</T>
                  <MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={C.sub} />
                </TouchableOpacity>
                {open && <T style={styles.answerText}>{faq.answer}</T>}
              </View>
            );
          })}
        </Card>

        <Card style={styles.hoursCard}>
          <MaterialCommunityIcons name="clock-outline" size={20} color={C.orange} />
          <View style={styles.hoursCopy}>
            <T style={styles.hoursTitle}>Support hours</T>
            <T style={styles.hoursSub}>Monday–Saturday, 9:00 AM–6:00 PM IST. Email is available at any time.</T>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: PAGE_GUTTER, paddingTop: 4, paddingBottom: 28 },
  hero: { minHeight: 88, padding: 10, flexDirection: 'row', alignItems: 'center' },
  heroIcon: { width: 52, height: 52, borderRadius: 6, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1, marginLeft: 8 },
  heroTitle: { color: C.text, fontSize: 15, fontWeight: '800' },
  heroSub: { color: C.sub, fontSize: 10.5, lineHeight: 15, marginTop: 3 },
  error: { flexDirection: 'row', alignItems: 'center', padding: 8, borderWidth: 1, borderColor: '#F8CACA', borderRadius: 4, backgroundColor: C.redSoft, marginTop: 4 },
  errorText: { flex: 1, color: C.red, fontSize: 10.5, marginLeft: 4 },
  contactRow: { flexDirection: 'row', marginTop: 4 },
  contactCard: { flex: 1, minHeight: 103, padding: 9, borderWidth: 1, borderColor: C.border, borderRadius: 6, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginHorizontal: 2 },
  contactIcon: { width: 38, height: 38, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  contactTitle: { color: C.text, fontSize: 11, fontWeight: '700', marginTop: 5 },
  contactSub: { color: C.sub, fontSize: 9.5, marginTop: 2 },
  sectionTitle: { color: C.faint, fontSize: 9.5, fontWeight: '700', letterSpacing: 0.5, marginTop: 8, marginBottom: 4, marginLeft: 4 },
  accountCard: { padding: 0, overflow: 'hidden' },
  accountRow: { minHeight: 40, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  borderTop: { borderTopWidth: 1, borderTopColor: C.borderSoft },
  accountLabel: { color: C.sub, fontSize: 10.5 },
  accountValue: { maxWidth: '62%', color: C.text, fontSize: 10.5, fontWeight: '700', textAlign: 'right' },
  faqCard: { padding: 0, overflow: 'hidden' },
  faqQuestion: { minHeight: 50, paddingHorizontal: 8, paddingVertical: 7, flexDirection: 'row', alignItems: 'center' },
  faqNumber: { width: 28, height: 28, borderRadius: 4, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  faqNumberText: { color: C.primary, fontSize: 10, fontWeight: '800' },
  questionText: { flex: 1, color: C.text, fontSize: 10.5, lineHeight: 15, fontWeight: '700', marginHorizontal: 6 },
  answerText: { color: C.sub, fontSize: 10.5, lineHeight: 16, paddingLeft: 42, paddingRight: 10, paddingBottom: 10 },
  hoursCard: { marginTop: 8, minHeight: 58, padding: 9, flexDirection: 'row', alignItems: 'center', backgroundColor: C.orangeSoft },
  hoursCopy: { flex: 1, marginLeft: 7 },
  hoursTitle: { color: C.text, fontSize: 10.5, fontWeight: '700' },
  hoursSub: { color: C.sub, fontSize: 9.5, lineHeight: 14, marginTop: 2 },
});
