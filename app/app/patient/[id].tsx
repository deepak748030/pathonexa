import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  ChevronLeft, Phone, FlaskConical, Pencil, Trash2, MessageCircle, Share2, IdCard,
} from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import Avatar from '@/components/Avatar';
import Field from '@/components/Field';
import Select from '@/components/Select';
import PrimaryButton from '@/components/PrimaryButton';
import CodeStrip from '@/components/CodeStrip';
import { Card, FadeIn, ListRow, EmptyState, OfflineBanner, Badge } from '@/components/UI';
import { colors, fonts, radius } from '@/lib/theme';
import { endpoints } from '@/lib/api';
import {
  displayMobile, inr, isIndianMobile, BLOOD_GROUPS, GENDERS, INDIAN_STATES,
} from '@/lib/format';
import { openWhatsApp, shareText } from '@/lib/share';
import { useSettings } from '@/lib/settings';

export default function PatientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const settings = useSettings((s) => s.settings);
  const loadSettings = useSettings((s) => s.load);
  const [patient, setPatient] = React.useState<any>(null);
  const [reports, setReports] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<any>({});

  const load = React.useCallback(async () => {
    if (!id) return;
    try {
      const [p, all] = await Promise.all([endpoints.patients.getById(String(id)), endpoints.reports.getAll()]);
      setPatient(p);
      setForm({
        name: p?.name || '', age: String(p?.age ?? ''), gender: p?.gender || 'Male',
        mobile: p?.mobile || '', altMobile: p?.altMobile || '', blood: p?.blood || '',
        dob: p?.dob || '', email: p?.email || '', address: p?.address || '', city: p?.city || '',
        state: p?.state || '', pincode: p?.pincode || '', group: p?.group || '', remarks: p?.remarks || '',
        referredBy: p?.referredBy || '',
      });
      const list = Array.isArray(all) ? all : [];
      setReports(list.filter((r) => {
        const pid = r.patient?._id || r.patient?.id || r.patient;
        return String(pid) === String(id) || r.patient?.pid === p?.pid;
      }));
    } catch (e: any) {
      console.warn(e?.message || e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(React.useCallback(() => { loadSettings(); load(); }, [load, loadSettings]));

  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!id) return;
    if (form.mobile && !isIndianMobile(form.mobile)) {
      return Alert.alert('Invalid mobile', 'Enter a valid 10-digit Indian mobile number.');
    }
    setSaving(true);
    try {
      const updated = await endpoints.patients.update(String(id), { ...form, age: Number(form.age) });
      setPatient(updated);
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Server error');
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    Alert.alert('Delete patient', 'The record moves to Deleted Records and can be restored.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await endpoints.patients.remove(String(id));
            router.back();
          } catch (e: any) {
            Alert.alert('Could not delete', e?.message || 'Server error');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <AppScreen header={<ScreenHeader title="Patient" left={<ChevronLeft size={24} color="#fff" />} onLeftPress={() => router.back()} />}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
      </AppScreen>
    );
  }

  if (!patient) {
    return (
      <AppScreen header={<ScreenHeader title="Patient" left={<ChevronLeft size={24} color="#fff" />} onLeftPress={() => router.back()} />}>
        <EmptyState title="Patient not found" subtitle="This record may have been removed." />
      </AppScreen>
    );
  }

  const spent = reports.reduce((s, r) => s + Number(r.amount || 0), 0);
  const pending = reports.reduce((s, r) => s + Number(r.pendingAmount ?? (r.paid ? 0 : r.amount ?? 0)), 0);

  return (
    <AppScreen
      keyboard
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
      header={
        <ScreenHeader
          title={patient.name}
          subtitle={`${patient.pid} · ${reports.length} reports`}
          left={<ChevronLeft size={24} color="#fff" />}
          onLeftPress={() => router.back()}
          right={
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable style={styles.headBtn} onPress={() => setEditing((v) => !v)}>
                <Pencil size={16} color="#fff" />
              </Pressable>
              <Pressable style={styles.headBtn} onPress={remove}>
                <Trash2 size={16} color="#fff" />
              </Pressable>
            </View>
          }
        />
      }
    >
      <OfflineBanner />

      <FadeIn>
        <Card style={{ padding: 0 }}>
          <View style={styles.hero}>
            <Avatar name={patient.name} color={patient.color} size={56} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{patient.name}</Text>
              <Text style={styles.meta}>
                {patient.age}y · {patient.gender}{patient.blood ? ` · ${patient.blood}` : ''}
              </Text>
              <View style={styles.phoneRow}>
                <Phone size={12} color={colors.mutedForeground} />
                <Text style={styles.meta}>{displayMobile(patient.mobile)}</Text>
              </View>
              {!!patient.city && <Text style={styles.meta}>{patient.city}{patient.state ? `, ${patient.state}` : ''}</Text>}
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Badge text={patient.group || 'General'} tone="primary" />
              {pending > 0 ? <Badge text={`Due ${inr(pending)}`} tone="orange" /> : <Badge text="Settled" tone="green" />}
            </View>
          </View>

          <View style={styles.codes}>
            <CodeStrip
              compact
              qrValue={`https://pathonexa.in/patient/${patient.pid}?lab=${settings.labId || ''}`}
              barcodeValue={patient.pid || ''}
            />
          </View>

          <View style={styles.quick}>
            <Quick Icon={MessageCircle} label="WhatsApp" onPress={() => openWhatsApp(patient.mobile, `Hello ${patient.name}, this is ${settings.shortName || settings.name}.`)} />
            <Quick Icon={Phone} label="Call" onPress={() => openWhatsApp(patient.mobile, '')} />
            <Quick
              Icon={Share2}
              label="Share card"
              onPress={() => shareText(`${patient.name} · ${patient.pid}\n${displayMobile(patient.mobile)}\n${settings.name}`)}
            />
            <Quick Icon={IdCard} label="Reports" onPress={() => router.push('/(tabs)/reports' as any)} />
          </View>
        </Card>
      </FadeIn>

      <FadeIn delay={50}>
        <View style={styles.tiles}>
          <Tile label="Reports" value={String(reports.length)} />
          <Tile label="Total Billed" value={inr(spent)} tone={colors.primary} />
          <Tile label="Pending" value={inr(pending)} tone={pending ? colors.orange : colors.green} />
        </View>
      </FadeIn>

      {editing && (
        <FadeIn>
          <Card style={{ marginTop: 12 }}>
            <Text style={styles.section}>Edit patient</Text>
            <Field label="Name" value={form.name} onChangeText={(t) => set('name', t)} />
            <View style={styles.split}>
              <View style={{ flex: 1 }}><Field label="Age" value={form.age} digits={3} onChangeText={(t) => set('age', t)} /></View>
              <View style={{ flex: 1 }}><Select label="Gender" value={form.gender} options={[...GENDERS]} onChange={(v) => set('gender', v)} /></View>
            </View>
            <View style={styles.split}>
              <View style={{ flex: 1 }}><Field label="Date of birth" value={form.dob} onChangeText={(t) => set('dob', t)} placeholder="DD/MM/YYYY" /></View>
              <View style={{ flex: 1 }}><Select label="Blood group" value={form.blood} options={BLOOD_GROUPS} onChange={(v) => set('blood', v)} /></View>
            </View>
            <View style={styles.split}>
              <View style={{ flex: 1 }}><Field label="Mobile" value={form.mobile} digits={10} onChangeText={(t) => set('mobile', t)} /></View>
              <View style={{ flex: 1 }}><Field label="Alternate mobile" value={form.altMobile} digits={10} onChangeText={(t) => set('altMobile', t)} /></View>
            </View>
            <Field label="Email" value={form.email} onChangeText={(t) => set('email', t)} keyboardType="email-address" />
            <Field label="Address" value={form.address} onChangeText={(t) => set('address', t)} multiline />
            <View style={styles.split}>
              <View style={{ flex: 1 }}><Field label="City" value={form.city} onChangeText={(t) => set('city', t)} /></View>
              <View style={{ flex: 1 }}><Field label="PIN code" value={form.pincode} digits={6} onChangeText={(t) => set('pincode', t)} /></View>
            </View>
            <Select label="State" value={form.state} options={INDIAN_STATES} onChange={(v) => set('state', v)} />
            <View style={styles.split}>
              <View style={{ flex: 1 }}><Field label="Group" value={form.group} onChangeText={(t) => set('group', t)} placeholder="Camp / Corporate" /></View>
              <View style={{ flex: 1 }}><Field label="Referred by" value={form.referredBy} onChangeText={(t) => set('referredBy', t)} /></View>
            </View>
            <Field label="Remarks" value={form.remarks} onChangeText={(t) => set('remarks', t)} multiline />
            <PrimaryButton title="Save changes" onPress={save} loading={saving} />
          </Card>
        </FadeIn>
      )}

      <Pressable
        style={styles.cta}
        onPress={() => router.push({ pathname: '/create-report', params: { patientId: patient._id || patient.id } } as any)}
      >
        <FlaskConical size={16} color="#fff" />
        <Text style={styles.ctaText}>Create report for this patient</Text>
      </Pressable>

      <Text style={styles.section}>Report history ({reports.length})</Text>
      <Card style={{ padding: 0, marginBottom: 20 }}>
        {reports.length === 0 ? (
          <EmptyState title="No reports yet" subtitle="Create the first investigation." />
        ) : reports.map((r, i) => (
          <ListRow
            key={r._id || r.id}
            last={i === reports.length - 1}
            onPress={() => router.push({ pathname: '/report-preview', params: { id: r._id || r.id } } as any)}
          >
            <View style={styles.reportRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{r.test}</Text>
                <Text style={styles.rowSub}>{r.reportId} · {r.date} · {r.doctor || 'Direct'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.rowTitle}>{inr(r.amount)}</Text>
                <Text style={[styles.rowSub, { color: r.status === 'Completed' ? colors.green : colors.orange }]}>{r.status}</Text>
              </View>
            </View>
          </ListRow>
        ))}
      </Card>
    </AppScreen>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileV, tone ? { color: tone } : null]} numberOfLines={1}>{value}</Text>
      <Text style={styles.tileL}>{label}</Text>
    </View>
  );
}

function Quick({ Icon, label, onPress }: { Icon: any; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quickBtn} onPress={onPress}>
      <Icon size={15} color={colors.primary} />
      <Text style={styles.quickTxt}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headBtn: { width: 34, height: 34, borderRadius: radius.xs, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.foreground },
  meta: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.mutedForeground, marginTop: 2 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  codes: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.primarySoft },
  quick: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border },
  quickBtn: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 11 },
  quickTxt: { fontFamily: fonts.semibold, fontSize: 10.5, color: colors.foreground },
  tiles: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tile: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 12, alignItems: 'center' },
  tileV: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.foreground },
  tileL: { fontFamily: fonts.medium, fontSize: 10, color: colors.mutedForeground, marginTop: 3 },
  split: { flexDirection: 'row', gap: 10 },
  cta: { marginTop: 14, height: 48, backgroundColor: colors.primary, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { color: '#fff', fontFamily: fonts.bold, fontSize: 14 },
  section: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground, marginTop: 18, marginBottom: 8 },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowTitle: { fontFamily: fonts.semibold, fontSize: 13, color: colors.foreground },
  rowSub: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
});
