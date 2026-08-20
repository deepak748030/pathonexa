import React from 'react';
import { Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ChevronLeft, Building, Phone, Mail, MapPin, UserRound } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import Field from '@/components/Field';
import PrimaryButton from '@/components/PrimaryButton';
import { Card, FadeIn } from '@/components/UI';
import { colors } from '@/lib/theme';
import { endpoints } from '@/lib/api';
import { lab as fallback } from '@/lib/labData';
import { useSettings } from '@/lib/settings';

export default function LabProfile() {
  const reloadSettings = useSettings((s) => s.load);
  const [form, setForm] = React.useState({ ...fallback });
  const [saving, setSaving] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      endpoints.meta.lab().then((d) => d && setForm((f) => ({ ...f, ...d }))).catch(() => {});
    }, [])
  );

  const save = async () => {
    setSaving(true);
    try {
      const saved = await endpoints.meta.updateLab(form);
      setForm((f) => ({ ...f, ...saved }));
      await reloadSettings(true);
      Alert.alert('Saved', 'Lab profile updated on the server.');
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Server error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen
      keyboard
      header={<ScreenHeader title="Lab Profile" subtitle={form.labId} left={<ChevronLeft size={24} color="#FFFFFF" />} onLeftPress={() => router.back()} />}
    >
        <FadeIn>
          <Card>
            <Field label="Lab name" value={form.name} onChangeText={(t) => setForm((f) => ({ ...f, name: t }))} icon={<Building size={16} color={colors.primary} />} />
            <Field label="Address" value={form.address} onChangeText={(t) => setForm((f) => ({ ...f, address: t }))} multiline icon={<MapPin size={16} color={colors.primary} />} />
            <Field label="Phone" value={form.phone} onChangeText={(t) => setForm((f) => ({ ...f, phone: t }))} icon={<Phone size={16} color={colors.primary} />} />
            <Field label="Email" value={form.email} onChangeText={(t) => setForm((f) => ({ ...f, email: t }))} icon={<Mail size={16} color={colors.primary} />} />
            <Field label="Pathologist" value={form.pathologist} onChangeText={(t) => setForm((f) => ({ ...f, pathologist: t }))} icon={<UserRound size={16} color={colors.primary} />} />
            <PrimaryButton title="Save lab profile" onPress={save} loading={saving} />
          </Card>
        </FadeIn>
    </AppScreen>
  );
}


