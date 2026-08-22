import React from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { T } from '../components/T';
import { BrandIcon } from '../components/Brand';
import { BlueHeader, Card, Press, Skeleton } from '../components/kit';
import { api, type LabSettings } from '../src/api';
import { C, F, PAGE_GUTTER } from '../src/theme';
import { useFeedback } from '../src/feedback';

type ProfileKey = keyof LabSettings;
type ProfileField = { key: ProfileKey; label: string; placeholder: string; icon: string; required?: boolean; keyboard?: 'default' | 'phone-pad' | 'email-address'; multiline?: boolean };

const IDENTITY_FIELDS: ProfileField[] = [
  { key: 'name', label: 'Lab name', placeholder: 'Enter registered lab name', icon: 'office-building-outline', required: true },
  { key: 'shortName', label: 'Short name', placeholder: 'Name shown in compact places', icon: 'format-letter-case' },
  { key: 'pathologist', label: 'Pathologist / owner', placeholder: 'Enter pathologist or owner name', icon: 'doctor' },
  { key: 'gst', label: 'GST / registration number', placeholder: 'Enter GST or registration number', icon: 'identifier' },
];

const CONTACT_FIELDS: ProfileField[] = [
  { key: 'phone', label: 'Primary phone', placeholder: 'Enter primary phone', icon: 'phone-outline', keyboard: 'phone-pad' },
  { key: 'altPhone', label: 'Alternate phone', placeholder: 'Enter alternate phone', icon: 'phone-plus-outline', keyboard: 'phone-pad' },
  { key: 'email', label: 'Email address', placeholder: 'lab@example.com', icon: 'email-outline', keyboard: 'email-address' },
  { key: 'website', label: 'Website', placeholder: 'https://example.com', icon: 'web' },
  { key: 'city', label: 'City', placeholder: 'Enter city', icon: 'city-variant-outline' },
  { key: 'address', label: 'Full address', placeholder: 'Enter complete lab address', icon: 'map-marker-outline', multiline: true },
];

const REPORT_FIELDS: ProfileField[] = [
  { key: 'footer', label: 'Report footer', placeholder: 'Footer displayed on reports', icon: 'page-layout-footer', multiline: true },
  { key: 'reportNote', label: 'Default clinical note', placeholder: 'Note displayed on reports', icon: 'note-text-outline', multiline: true },
];

function valueOf(profile: LabSettings | null, key: ProfileKey) {
  const value = profile?.[key];
  return typeof value === 'string' ? value : '';
}

function ProfileInput({ field, value, onChange }: { field: ProfileField; value: string; onChange: (value: string) => void }) {
  return (
    <View style={[styles.field, field.multiline && styles.fieldFull]}>
      <T style={styles.fieldLabel}>{field.label}{field.required ? <T style={styles.required}> *</T> : null}</T>
      <View style={[styles.fieldBox, field.multiline && styles.multilineBox]}>
        <MaterialCommunityIcons name={field.icon as any} size={15} color={C.faint} style={styles.fieldIcon} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={field.placeholder}
          placeholderTextColor={C.faint}
          selectionColor={C.primary}
          keyboardType={field.keyboard || 'default'}
          autoCapitalize={field.keyboard === 'email-address' ? 'none' : 'sentences'}
          multiline={field.multiline}
          textAlignVertical={field.multiline ? 'top' : 'center'}
          style={[styles.input, field.multiline && styles.multilineInput]}
        />
      </View>
    </View>
  );
}

function ProfileSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={index} style={styles.skeletonField}>
          <Skeleton width="32%" height={9} />
          <Skeleton width="100%" height={40} radius={4} style={styles.skeletonBox} />
        </View>
      ))}
    </>
  );
}

export default function LabProfileScreen() {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const [profile, setProfile] = React.useState<LabSettings | null>(null);
  const [savedProfile, setSavedProfile] = React.useState<LabSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const mounted = React.useRef(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const next = await api.lab.get();
      if (!mounted.current) return;
      setProfile(next);
      setSavedProfile(next);
      setError('');
    } catch (loadError) {
      if (!mounted.current) return;
      setError(loadError instanceof Error ? loadError.message : 'Unable to load lab profile.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    mounted.current = true;
    load().catch(() => {});
    return () => { mounted.current = false; };
  }, [load]);

  const setField = (key: ProfileKey, value: string) => {
    setProfile((current) => ({ ...(current || { name: '' }), [key]: value }));
  };

  const save = async () => {
    const name = profile?.name?.trim();
    if (!name) {
      toast({ kind: 'warning', title: 'Lab name required', message: 'Enter your registered lab name.' });
      return;
    }
    const email = profile?.email?.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ kind: 'warning', title: 'Invalid email', message: 'Enter a valid email address.' });
      return;
    }
    setSaving(true);
    try {
      const fields = [...IDENTITY_FIELDS, ...CONTACT_FIELDS, ...REPORT_FIELDS];
      const payload = Object.fromEntries(fields.map((field) => [field.key, valueOf(profile, field.key).trim()]));
      const next = await api.lab.update(payload);
      setProfile(next);
      setSavedProfile(next);
      toast({ kind: 'success', title: 'Profile saved', message: 'Your lab details were updated successfully.' });
    } catch (saveError) {
      toast({ kind: 'error', title: 'Unable to save', message: saveError instanceof Error ? saveError.message : 'Please try again.' });
    } finally {
      if (mounted.current) setSaving(false);
    }
  };

  const dirty = JSON.stringify(profile) !== JSON.stringify(savedProfile);
  const goBack = () => {
    if (!dirty || saving) {
      router.back();
      return;
    }
    confirm({
      kind: 'warning',
      title: 'Discard changes?',
      message: 'Your unsaved lab profile changes will be lost.',
      confirmText: 'Discard',
      cancelText: 'Keep editing',
      destructive: true,
      onConfirm: () => router.back(),
    });
  };

  const fieldSections = [
    { title: 'LAB IDENTITY', fields: IDENTITY_FIELDS },
    { title: 'CONTACT & LOCATION', fields: CONTACT_FIELDS },
    { title: 'REPORT DETAILS', fields: REPORT_FIELDS },
  ];

  return (
    <View style={styles.screen}>
      <BlueHeader title="Lab Profile" sub="Identity, contact and report details" onBack={goBack} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Card style={styles.identityCard}>
          <View style={styles.brand}><BrandIcon size={50} circular /></View>
          <View style={styles.identityCopy}>
            {loading ? (
              <><Skeleton width="68%" height={14} /><Skeleton width="45%" height={10} style={styles.identitySkeleton} /></>
            ) : (
              <>
                <T style={styles.labName}>{profile?.name || 'My Pathology Lab'}</T>
                <T style={styles.labMeta}>{profile?.labId || 'Lab ID not available'}{profile?.city ? ` · ${profile.city}` : ''}</T>
              </>
            )}
          </View>
          <TouchableOpacity disabled={loading || saving} onPress={load} style={styles.refreshButton} accessibilityLabel="Refresh lab profile">
            <MaterialCommunityIcons name="refresh" size={19} color={C.primary} />
          </TouchableOpacity>
        </Card>

        {!!error && (
          <TouchableOpacity activeOpacity={0.75} onPress={load} style={styles.error}>
            <MaterialCommunityIcons name="alert-circle-outline" size={17} color={C.red} />
            <T style={styles.errorText}>{error} Tap to retry.</T>
          </TouchableOpacity>
        )}

        {fieldSections.map((section) => (
          <View key={section.title}>
            <T style={styles.sectionTitle}>{section.title}</T>
            <Card style={styles.formCard}>
              <View style={styles.fields}>
                {loading ? <ProfileSkeleton /> : section.fields.map((field) => (
                  <ProfileInput
                    key={field.key}
                    field={field}
                    value={valueOf(profile, field.key)}
                    onChange={(value) => setField(field.key, value)}
                  />
                ))}
              </View>
            </Card>
          </View>
        ))}

        <Press disabled={loading || saving || !dirty} onPress={save} style={[styles.saveButton, (loading || saving || !dirty) && styles.disabled]}>
          <MaterialCommunityIcons name={saving ? 'clock-outline' : 'content-save-outline'} size={18} color="#fff" />
          <T style={styles.saveText}>{saving ? 'Saving profile…' : dirty ? 'Save lab profile' : 'Profile is up to date'}</T>
        </Press>
        <T style={styles.note}>Lab ID is generated securely for your mobile account and cannot be edited.</T>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: PAGE_GUTTER, paddingTop: 4, paddingBottom: 28 },
  identityCard: { minHeight: 76, padding: 9, flexDirection: 'row', alignItems: 'center' },
  brand: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  identityCopy: { flex: 1, marginLeft: 6 },
  labName: { color: C.text, fontSize: 14, fontWeight: '800' },
  labMeta: { color: C.sub, fontSize: 10.5, marginTop: 3 },
  identitySkeleton: { marginTop: 6 },
  refreshButton: { width: 36, height: 36, borderWidth: 1, borderColor: C.border, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  error: { flexDirection: 'row', alignItems: 'center', padding: 8, borderWidth: 1, borderColor: '#F8CACA', borderRadius: 4, backgroundColor: C.redSoft, marginTop: 4 },
  errorText: { flex: 1, color: C.red, fontSize: 10.5, marginLeft: 4 },
  sectionTitle: { color: C.faint, fontSize: 9.5, fontWeight: '700', letterSpacing: 0.5, marginTop: 8, marginBottom: 4, marginLeft: 4 },
  formCard: { padding: 8 },
  fields: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -2 },
  field: { width: '50%', paddingHorizontal: 2, marginBottom: 7 },
  fieldFull: { width: '100%' },
  fieldLabel: { color: C.text, fontSize: 10, fontWeight: '600', marginBottom: 4 },
  required: { color: C.red },
  fieldBox: { minHeight: 40, paddingHorizontal: 8, borderWidth: 1, borderColor: C.border, borderRadius: 4, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center' },
  multilineBox: { minHeight: 70, alignItems: 'flex-start', paddingTop: 8 },
  fieldIcon: { marginRight: 4 },
  input: { flex: 1, minWidth: 0, paddingVertical: 7, color: C.text, fontFamily: F.regular, fontSize: 11.5 },
  multilineInput: { minHeight: 56, paddingTop: 0 },
  skeletonField: { width: '50%', paddingHorizontal: 2, marginBottom: 7 },
  skeletonBox: { marginTop: 5 },
  saveButton: { height: 43, marginTop: 8, backgroundColor: C.primary, borderRadius: 4, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  saveText: { color: '#fff', fontSize: 11.5, fontWeight: '700', marginLeft: 4 },
  disabled: { opacity: 0.52 },
  note: { color: C.faint, fontSize: 9.5, textAlign: 'center', marginTop: 6 },
});
