import React from 'react';
import { View, Text, StyleSheet, Switch, ActivityIndicator, Alert, Pressable, Image } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ChevronLeft, Save, Image as ImageIcon, PenLine, Stamp } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import Field from '@/components/Field';
import Select from '@/components/Select';
import PrimaryButton from '@/components/PrimaryButton';
import { Card, FadeIn, OfflineBanner } from '@/components/UI';
import { colors, fonts, radius } from '@/lib/theme';
import { useSettings, type LabSettings } from '@/lib/settings';

const THEMES = ['Blue', 'Teal', 'Purple', 'Green'];
const LANGUAGES = ['English', 'हिन्दी (Hindi)', 'मराठी (Marathi)', 'ગુજરાતી (Gujarati)'];

/**
 * Settings — lab identity for the report header, GST, footer text, signature,
 * stamp, theme, language and workflow switches (auto print, owner verification,
 * notifications, automatic backup).
 */
export default function SettingsScreen() {
  const { settings, load, save } = useSettings();
  const [form, setForm] = React.useState<LabSettings>(settings);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  useFocusEffect(React.useCallback(() => {
    let alive = true;
    load(true).then((s) => { if (alive) { setForm(s); setLoading(false); } });
    return () => { alive = false; };
  }, [load]));

  const set = (k: keyof LabSettings, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const pickImage = async (key: 'logo' | 'signature' | 'stamp') => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        base64: true,
        quality: 0.7,
        allowsEditing: true,
      });
      if (res.canceled || !res.assets?.length) return;
      const a = res.assets[0];
      const uri = a.base64 ? `data:image/png;base64,${a.base64}` : a.uri;
      set(key, uri);
    } catch {
      Alert.alert('Could not open the gallery', 'Grant photo permission and try again.');
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await save(form);
      Alert.alert('Saved', 'Lab settings updated. New reports use them immediately.');
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Server error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppScreen header={<ScreenHeader title="Settings" left={<ChevronLeft size={24} color="#fff" />} onLeftPress={() => router.back()} />}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
      </AppScreen>
    );
  }

  return (
    <AppScreen
      keyboard
      header={
        <ScreenHeader
          title="Settings"
          subtitle="Lab identity, report layout and preferences"
          left={<ChevronLeft size={24} color="#fff" />}
          onLeftPress={() => router.back()}
          right={
            <Pressable style={styles.addBtn} onPress={onSave}>
              <Save size={17} color="#fff" />
            </Pressable>
          }
        />
      }
      footer={
        <View style={styles.footer}>
          <PrimaryButton title="Save settings" onPress={onSave} loading={saving} icon={<Save size={16} color="#fff" />} />
        </View>
      }
    >
      <OfflineBanner />

      <FadeIn>
        <Card>
          <Text style={styles.section}>Lab identity</Text>
          <View style={styles.assets}>
            <AssetBox label="Logo" uri={form.logo} Icon={ImageIcon} onPress={() => pickImage('logo')} />
            <AssetBox label="Signature" uri={form.signature} Icon={PenLine} onPress={() => pickImage('signature')} />
            <AssetBox label="Stamp" uri={form.stamp} Icon={Stamp} onPress={() => pickImage('stamp')} />
          </View>
          <Field label="Lab name" value={form.name} onChangeText={(t) => set('name', t)} />
          <Field label="Display / short name" value={form.shortName} onChangeText={(t) => set('shortName', t)} />
          <Field label="Address" value={form.address} onChangeText={(t) => set('address', t)} multiline />
          <View style={styles.split}>
            <View style={{ flex: 1 }}><Field label="Contact number" value={form.phone} onChangeText={(t) => set('phone', t)} /></View>
            <View style={{ flex: 1 }}><Field label="Alternate number" value={form.altPhone || ''} onChangeText={(t) => set('altPhone', t)} /></View>
          </View>
          <View style={styles.split}>
            <View style={{ flex: 1 }}><Field label="Email" value={form.email} onChangeText={(t) => set('email', t)} keyboardType="email-address" /></View>
            <View style={{ flex: 1 }}><Field label="GST number" value={form.gst || ''} onChangeText={(t) => set('gst', t)} placeholder="09ABCDE1234F1Z5" /></View>
          </View>
          <Field label="Consultant pathologist" value={form.pathologist} onChangeText={(t) => set('pathologist', t)} />
          <Field label="Lab ID" value={form.labId} onChangeText={(t) => set('labId', t)} />
        </Card>
      </FadeIn>

      <FadeIn delay={60}>
        <Card style={{ marginTop: 12 }}>
          <Text style={styles.section}>Report layout</Text>
          <Field label="Report note" value={form.reportNote || ''} onChangeText={(t) => set('reportNote', t)} multiline placeholder="Kindly correlate clinically." />
          <Field label="Report footer" value={form.footer || ''} onChangeText={(t) => set('footer', t)} multiline />
          <Field
            label="WhatsApp message template"
            value={form.whatsappTemplate || ''}
            onChangeText={(t) => set('whatsappTemplate', t)}
            multiline
            hint="Placeholders: {patient}, {reportId}, {lab}"
          />
        </Card>
      </FadeIn>

      <FadeIn delay={100}>
        <Card style={{ marginTop: 12 }}>
          <Text style={styles.section}>Appearance</Text>
          <Select label="Theme" value={form.theme} options={THEMES} onChange={(v) => set('theme', v)} />
          <Select label="Language" value={form.language} options={LANGUAGES} onChange={(v) => set('language', v)} />
        </Card>
      </FadeIn>

      <FadeIn delay={140}>
        <Card style={{ marginTop: 12, marginBottom: 20 }}>
          <Text style={styles.section}>Workflow</Text>
          <Toggle
            title="Auto-print reports"
            sub="Open the print dialog right after saving a report"
            value={!!form.autoPrint}
            onChange={(v) => set('autoPrint', v)}
          />
          <Toggle
            title="Owner verification"
            sub="Ask for verification before a report is marked completed"
            value={!!form.ownerVerification}
            onChange={(v) => set('ownerVerification', v)}
          />
          <Toggle
            title="Push notifications"
            sub="Pending reports, payments, commission and subscription alerts"
            value={!!form.notifications}
            onChange={(v) => set('notifications', v)}
          />
          <Toggle
            title="Automatic cloud backup"
            sub="Back up patients, reports and masters every day"
            value={!!form.autoBackup}
            onChange={(v) => set('autoBackup', v)}
            last
          />
        </Card>
      </FadeIn>
    </AppScreen>
  );
}

function AssetBox({ label, uri, Icon, onPress }: { label: string; uri?: string; Icon: any; onPress: () => void }) {
  return (
    <Pressable style={styles.asset} onPress={onPress}>
      {uri ? (
        <Image source={{ uri }} style={styles.assetImg} resizeMode="contain" />
      ) : (
        <View style={styles.assetEmpty}><Icon size={18} color={colors.primary} /></View>
      )}
      <Text style={styles.assetLabel}>{label}</Text>
      <Text style={styles.assetHint}>{uri ? 'Tap to change' : 'Tap to upload'}</Text>
    </Pressable>
  );
}

function Toggle({ title, sub, value, onChange, last }: { title: string; sub: string; value: boolean; onChange: (v: boolean) => void; last?: boolean }) {
  return (
    <View style={[styles.toggleRow, last && { borderBottomWidth: 0 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleSub}>{sub}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: { width: 36, height: 36, borderRadius: radius.xs, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  section: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground, marginBottom: 10 },
  split: { flexDirection: 'row', gap: 10 },
  assets: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  asset: { flex: 1, alignItems: 'center', padding: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  assetImg: { width: 56, height: 42, borderRadius: 6 },
  assetEmpty: { width: 56, height: 42, borderRadius: 6, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  assetLabel: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.foreground, marginTop: 6 },
  assetHint: { fontFamily: fonts.regular, fontSize: 9.5, color: colors.mutedForeground, marginTop: 1 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  toggleTitle: { fontFamily: fonts.semibold, fontSize: 13, color: colors.foreground },
  toggleSub: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  footer: { padding: 12, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
});
