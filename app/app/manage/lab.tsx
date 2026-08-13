import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ChevronLeft, Building, Phone, Mail, MapPin, UserRound } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import Field from '@/components/Field';
import { Card, FadeIn } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { endpoints } from '@/lib/api';
import { lab as fallback } from '@/lib/labData';

export default function LabProfile() {
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
      Alert.alert('Saved', 'Lab profile updated on the server.');
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Server error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Lab Profile" subtitle={form.labId} left={<ChevronLeft size={24} color="#FFFFFF" />} onLeftPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <FadeIn>
          <Card>
            <Field label="Lab name" value={form.name} onChangeText={(t) => setForm((f) => ({ ...f, name: t }))} icon={<Building size={16} color={colors.primary} />} />
            <Field label="Address" value={form.address} onChangeText={(t) => setForm((f) => ({ ...f, address: t }))} multiline icon={<MapPin size={16} color={colors.primary} />} />
            <Field label="Phone" value={form.phone} onChangeText={(t) => setForm((f) => ({ ...f, phone: t }))} icon={<Phone size={16} color={colors.primary} />} />
            <Field label="Email" value={form.email} onChangeText={(t) => setForm((f) => ({ ...f, email: t }))} icon={<Mail size={16} color={colors.primary} />} />
            <Field label="Pathologist" value={form.pathologist} onChangeText={(t) => setForm((f) => ({ ...f, pathologist: t }))} icon={<UserRound size={16} color={colors.primary} />} />
            <Pressable style={styles.save} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save lab profile</Text>}
            </Pressable>
          </Card>
        </FadeIn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: spacing.hPad, paddingTop: 10, paddingBottom: 32 },
  save: { height: 42, backgroundColor: colors.primary, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  saveText: { color: '#fff', fontFamily: fonts.bold, fontSize: 14 },
});
