import React from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { T } from '../components/T';
import { BrandIcon } from '../components/Brand';
import { BlueHeader, Card, Skeleton } from '../components/kit';
import { api, type LabSettings } from '../src/api';
import { C, PAGE_GUTTER } from '../src/theme';

const FEATURES = [
  { icon: 'account-group-outline', title: 'Patient management', detail: 'Account-owned patient records and visit history' },
  { icon: 'file-document-edit-outline', title: 'Digital lab reports', detail: 'Test values, billing, verification and printable reports' },
  { icon: 'chart-box-outline', title: 'Business overview', detail: 'Dashboard, collections, referrals and performance insights' },
  { icon: 'shield-lock-outline', title: 'Secure lab data', detail: 'Authenticated tenant isolation and signed account backups' },
];

function planExpiry(subscription: Record<string, any> | null) {
  const value = subscription?.expiresAt;
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : `Valid until ${date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
}

export default function AboutAppScreen() {
  const router = useRouter();
  const [lab, setLab] = React.useState<LabSettings | null>(null);
  const [subscription, setSubscription] = React.useState<Record<string, any> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [openInfo, setOpenInfo] = React.useState<'privacy' | 'terms' | null>(null);
  const requestRef = React.useRef(0);

  const load = React.useCallback(async () => {
    const request = ++requestRef.current;
    setLoading(true);
    try {
      const [profile, plan] = await Promise.all([api.lab.get(), api.subscription()]);
      if (request !== requestRef.current) return;
      setLab(profile);
      setSubscription(plan);
      setError('');
    } catch (loadError) {
      if (request !== requestRef.current) return;
      setError(loadError instanceof Error ? loadError.message : 'Unable to load account information.');
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load().catch(() => {});
    return () => { requestRef.current += 1; };
  }, [load]);

  const version = Constants.expoConfig?.version || '1.0.0';
  const build = Constants.expoConfig?.android?.versionCode || Constants.expoConfig?.ios?.buildNumber;

  return (
    <View style={styles.screen}>
      <BlueHeader title="About App" sub="PathoNexa information and security" onBack={() => router.back()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.brandCard}>
          <View style={styles.brandIcon}><BrandIcon size={72} circular /></View>
          <T style={styles.appName}>PathoNexa</T>
          <T style={styles.tagline}>Smart pathology lab management</T>
          <View style={styles.versionBadge}>
            <MaterialCommunityIcons name="cellphone-check" size={14} color={C.primary} />
            <T style={styles.versionText}>Version {version}{build ? ` (${build})` : ''}</T>
          </View>
        </Card>

        {!!error && (
          <TouchableOpacity onPress={load} activeOpacity={0.75} style={styles.error}>
            <MaterialCommunityIcons name="alert-circle-outline" size={17} color={C.red} />
            <T style={styles.errorText}>{error} Tap to retry.</T>
          </TouchableOpacity>
        )}

        <T style={styles.sectionTitle}>CURRENT LAB & PLAN</T>
        <Card style={styles.planCard}>
          {loading ? (
            <View style={styles.planLoading}>
              <Skeleton width={40} height={40} radius={4} />
              <View style={styles.planCopy}><Skeleton width="62%" height={12} /><Skeleton width="44%" height={9} style={styles.planSkeleton} /></View>
            </View>
          ) : (
            <>
              <View style={styles.planIcon}><MaterialCommunityIcons name="office-building-outline" size={21} color={C.primary} /></View>
              <View style={styles.planCopy}>
                <T style={styles.planTitle} numberOfLines={1}>{lab?.name || 'My Pathology Lab'}</T>
                <T style={styles.planSub}>{lab?.labId || 'Lab ID unavailable'}</T>
              </View>
              <View style={styles.planStatus}>
                <T style={styles.planName}>{subscription?.plan || 'Free Trial'}</T>
                <T style={styles.planExpiry}>{planExpiry(subscription) || subscription?.status || 'Active'}</T>
              </View>
            </>
          )}
        </Card>

        <T style={styles.sectionTitle}>BUILT FOR PATHOLOGY LABS</T>
        <Card style={styles.featureCard}>
          {FEATURES.map((feature, index) => (
            <View key={feature.title} style={[styles.featureRow, index > 0 && styles.borderTop]}>
              <View style={styles.featureIcon}><MaterialCommunityIcons name={feature.icon as any} size={19} color={C.primary} /></View>
              <View style={styles.featureCopy}>
                <T style={styles.featureTitle}>{feature.title}</T>
                <T style={styles.featureDetail}>{feature.detail}</T>
              </View>
            </View>
          ))}
        </Card>

        <T style={styles.sectionTitle}>PRIVACY & INFORMATION</T>
        <Card style={styles.infoCard}>
          <TouchableOpacity activeOpacity={0.72} onPress={() => setOpenInfo(openInfo === 'privacy' ? null : 'privacy')} style={styles.infoRow}>
            <View style={styles.infoIcon}><MaterialCommunityIcons name="shield-account-outline" size={19} color={C.green} /></View>
            <View style={styles.infoCopy}>
              <T style={styles.infoTitle}>Privacy & data protection</T>
              <T style={styles.infoSub}>How PathoNexa protects account data</T>
            </View>
            <MaterialCommunityIcons name={openInfo === 'privacy' ? 'chevron-up' : 'chevron-down'} size={18} color={C.sub} />
          </TouchableOpacity>
          {openInfo === 'privacy' && (
            <T style={styles.infoDetail}>Your mobile login identifies one lab account. The server enforces account ownership on records, reports, settings, deleted data, notifications, and backups. Exported backups are signed and can only be restored to the same account.</T>
          )}
          <TouchableOpacity activeOpacity={0.72} onPress={() => setOpenInfo(openInfo === 'terms' ? null : 'terms')} style={[styles.infoRow, styles.borderTop]}>
            <View style={[styles.infoIcon, { backgroundColor: C.orangeSoft }]}><MaterialCommunityIcons name="file-certificate-outline" size={19} color={C.orange} /></View>
            <View style={styles.infoCopy}>
              <T style={styles.infoTitle}>Responsible use</T>
              <T style={styles.infoSub}>Clinical and account responsibilities</T>
            </View>
            <MaterialCommunityIcons name={openInfo === 'terms' ? 'chevron-up' : 'chevron-down'} size={18} color={C.sub} />
          </TouchableOpacity>
          {openInfo === 'terms' && (
            <T style={styles.infoDetail}>PathoNexa supports laboratory workflows but does not replace professional clinical judgment. The lab remains responsible for result review, verification, patient consent, regulatory compliance, and secure account access.</T>
          )}
        </Card>

        <Card style={styles.securityCard}>
          <MaterialCommunityIcons name="lock-check-outline" size={21} color={C.green} />
          <View style={styles.securityCopy}>
            <T style={styles.securityTitle}>Connected securely</T>
            <T style={styles.securitySub}>Your profile and plan above were loaded from the authenticated PathoNexa server.</T>
          </View>
          <TouchableOpacity disabled={loading} onPress={load} style={styles.refreshButton} accessibilityLabel="Refresh app information">
            <MaterialCommunityIcons name="refresh" size={18} color={C.green} />
          </TouchableOpacity>
        </Card>

        <T style={styles.copyright}>© {new Date().getFullYear()} PathoNexa. All rights reserved.</T>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: PAGE_GUTTER, paddingTop: 4, paddingBottom: 28 },
  brandCard: { alignItems: 'center', paddingVertical: 16, paddingHorizontal: 10 },
  brandIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  appName: { color: C.text, fontSize: 20, fontWeight: '800', marginTop: 7 },
  tagline: { color: C.sub, fontSize: 10.5, marginTop: 2 },
  versionBadge: { minHeight: 28, marginTop: 7, paddingHorizontal: 9, borderRadius: 4, borderWidth: 1, borderColor: C.primaryBorder, backgroundColor: C.primaryPale, flexDirection: 'row', alignItems: 'center' },
  versionText: { color: C.primary, fontSize: 9.5, fontWeight: '700', marginLeft: 4 },
  error: { flexDirection: 'row', alignItems: 'center', padding: 8, borderWidth: 1, borderColor: '#F8CACA', borderRadius: 4, backgroundColor: C.redSoft, marginTop: 4 },
  errorText: { flex: 1, color: C.red, fontSize: 10.5, marginLeft: 4 },
  sectionTitle: { color: C.faint, fontSize: 9.5, fontWeight: '700', letterSpacing: 0.5, marginTop: 8, marginBottom: 4, marginLeft: 4 },
  planCard: { minHeight: 64, padding: 8, flexDirection: 'row', alignItems: 'center' },
  planLoading: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  planIcon: { width: 40, height: 40, borderRadius: 4, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  planCopy: { flex: 1, minWidth: 0, marginLeft: 6 },
  planTitle: { color: C.text, fontSize: 11.5, fontWeight: '700' },
  planSub: { color: C.sub, fontSize: 9.5, marginTop: 2 },
  planStatus: { maxWidth: '42%', alignItems: 'flex-end' },
  planName: { color: C.green, fontSize: 10.5, fontWeight: '800' },
  planExpiry: { color: C.faint, fontSize: 8.5, textAlign: 'right', marginTop: 2 },
  planSkeleton: { marginTop: 5 },
  featureCard: { padding: 0, overflow: 'hidden' },
  featureRow: { minHeight: 57, paddingHorizontal: 8, paddingVertical: 7, flexDirection: 'row', alignItems: 'center' },
  borderTop: { borderTopWidth: 1, borderTopColor: C.borderSoft },
  featureIcon: { width: 36, height: 36, borderRadius: 4, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  featureCopy: { flex: 1, marginLeft: 6 },
  featureTitle: { color: C.text, fontSize: 10.5, fontWeight: '700' },
  featureDetail: { color: C.sub, fontSize: 9.5, lineHeight: 13, marginTop: 2 },
  infoCard: { padding: 0, overflow: 'hidden' },
  infoRow: { minHeight: 56, paddingHorizontal: 8, paddingVertical: 7, flexDirection: 'row', alignItems: 'center' },
  infoIcon: { width: 36, height: 36, borderRadius: 4, backgroundColor: C.greenSoft, alignItems: 'center', justifyContent: 'center' },
  infoCopy: { flex: 1, marginLeft: 6 },
  infoTitle: { color: C.text, fontSize: 10.5, fontWeight: '700' },
  infoSub: { color: C.sub, fontSize: 9.5, marginTop: 2 },
  infoDetail: { color: C.sub, fontSize: 10, lineHeight: 15, paddingLeft: 50, paddingRight: 10, paddingBottom: 10 },
  securityCard: { minHeight: 62, marginTop: 8, padding: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: C.greenSoft },
  securityCopy: { flex: 1, marginLeft: 6 },
  securityTitle: { color: C.green, fontSize: 10.5, fontWeight: '800' },
  securitySub: { color: C.sub, fontSize: 9.5, lineHeight: 13, marginTop: 2 },
  refreshButton: { width: 34, height: 34, borderWidth: 1, borderColor: '#BCE4C9', borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  copyright: { color: C.faint, fontSize: 9, textAlign: 'center', marginTop: 9 },
});
