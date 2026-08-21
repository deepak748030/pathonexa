import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  ChevronLeft, Plus, Phone, MessageCircle, Wallet, ChevronRight, Trash2,
} from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import Field from '@/components/Field';
import Select from '@/components/Select';
import PrimaryButton from '@/components/PrimaryButton';
import SearchBar from '@/components/SearchBar';
import Avatar from '@/components/Avatar';
import { Card, FadeIn, EmptyState, OfflineBanner, Badge } from '@/components/UI';
import { colors, fonts, radius, shadow } from '@/lib/theme';
import { endpoints } from '@/lib/api';
import { inr, isIndianMobile, digitsOnly } from '@/lib/format';
import { openWhatsApp } from '@/lib/share';

const EMPTY = {
  name: '', degree: '', clinic: '', specialization: '', address: '', mobile: '',
  whatsapp: '', commission: '', bank: '', upi: '', status: 'Active', notes: '',
};

export default function DoctorsScreen() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ ...EMPTY });
  const [q, setQ] = React.useState('');

  const load = React.useCallback(async () => {
    try {
      const data = await endpoints.doctors.summary();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.warn(e?.message || e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSave = async () => {
    if (!form.name.trim()) return Alert.alert('Doctor name is required');
    if (form.mobile && !isIndianMobile(form.mobile)) {
      return Alert.alert('Invalid mobile', 'Enter a valid 10-digit Indian mobile number.');
    }
    setSaving(true);
    try {
      await endpoints.meta.create('doctors', {
        ...form,
        commission: Number(form.commission || 0),
        whatsapp: form.whatsapp || form.mobile,
      });
      setForm({ ...EMPTY });
      setShowForm(false);
      await load();
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Server error');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (d: any) => {
    Alert.alert('Remove doctor', `Remove ${d.name} from the referral list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await endpoints.meta.remove('doctors', d._id || d.id);
            await load();
          } catch (e: any) {
            Alert.alert('Could not remove', e?.message || 'Server error');
          }
        },
      },
    ]);
  };

  const filtered = items.filter((d) => {
    const s = q.toLowerCase().trim();
    if (!s) return true;
    return `${d.name} ${d.clinic} ${d.specialization} ${d.mobile}`.toLowerCase().includes(s);
  });

  const totals = items.reduce(
    (acc, d) => ({
      commission: acc.commission + (d.totalCommission || 0),
      pending: acc.pending + (d.pendingCommission || 0),
      reports: acc.reports + (d.totalReports || 0),
    }),
    { commission: 0, pending: 0, reports: 0 }
  );

  return (
    <AppScreen
      keyboard
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
      header={
        <ScreenHeader
          title="Doctors"
          subtitle={`${items.length} referring doctors`}
          left={<ChevronLeft size={24} color="#FFFFFF" />}
          onLeftPress={() => router.back()}
          right={
            <Pressable style={styles.addBtn} onPress={() => setShowForm((v) => !v)}>
              <Plus size={18} color="#FFFFFF" />
            </Pressable>
          }
        />
      }
    >
      <OfflineBanner />

      <FadeIn>
        <View style={styles.statRow}>
          <Stat label="Referrals" value={String(totals.reports)} tone="primary" />
          <Stat label="Commission" value={inr(totals.commission)} tone="green" />
          <Stat label="Pending Payout" value={inr(totals.pending)} tone="orange" />
        </View>
      </FadeIn>

      {showForm && (
        <FadeIn>
          <Card style={{ marginBottom: 12 }}>
            <Text style={styles.formTitle}>Add referring doctor</Text>
            <Field label="Doctor name" required value={form.name} onChangeText={(t) => set('name', t)} placeholder="Dr. Rakesh Kumar" />
            <View style={styles.split}>
              <View style={{ flex: 1 }}>
                <Field label="Clinic / Hospital" value={form.clinic} onChangeText={(t) => set('clinic', t)} placeholder="Radhe Clinic" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Specialization" value={form.specialization} onChangeText={(t) => set('specialization', t)} placeholder="Pathology" />
              </View>
            </View>
            <Field label="Degree" value={form.degree} onChangeText={(t) => set('degree', t)} placeholder="MBBS, MD" />
            <Field label="Address" value={form.address} onChangeText={(t) => set('address', t)} placeholder="Clinic address" multiline />
            <View style={styles.split}>
              <View style={{ flex: 1 }}>
                <Field label="Mobile" value={form.mobile} digits={10} onChangeText={(t) => set('mobile', t)} placeholder="10-digit" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="WhatsApp" value={form.whatsapp} digits={10} onChangeText={(t) => set('whatsapp', t)} placeholder="10-digit" />
              </View>
            </View>
            <View style={styles.split}>
              <View style={{ flex: 1 }}>
                <Field label="Commission %" value={form.commission} digits={3} onChangeText={(t) => set('commission', digitsOnly(t, 3))} placeholder="20" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="UPI ID" value={form.upi} onChangeText={(t) => set('upi', t)} placeholder="doctor@upi" />
              </View>
            </View>
            <Field label="Bank details" value={form.bank} onChangeText={(t) => set('bank', t)} placeholder="Bank name / account" />
            <Select
              label="Status"
              value={form.status}
              options={['Active', 'Inactive']}
              onChange={(v) => set('status', v)}
            />
            <Field label="Notes" value={form.notes} onChangeText={(t) => set('notes', t)} placeholder="Internal notes" multiline />
            <PrimaryButton title="Save doctor" onPress={onSave} loading={saving} />
          </Card>
        </FadeIn>
      )}

      <View style={{ marginBottom: 10 }}>
        <SearchBar value={q} onChangeText={setQ} placeholder="Search doctor, clinic or specialization" />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : filtered.length === 0 ? (
        <Card><EmptyState title="No doctors yet" subtitle="Add your first referring doctor with +." /></Card>
      ) : (
        filtered.map((d, i) => (
          <FadeIn key={d._id || d.id} delay={i * 30}>
            <Card style={styles.docCard}>
              <Pressable
                style={styles.docHead}
                onPress={() => router.push({ pathname: '/doctor/[id]', params: { id: d._id || d.id } } as any)}
              >
                <Avatar name={d.name} color="#DCFCE7" size={44} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>{d.name}</Text>
                    <Badge text={d.status || 'Active'} tone={d.status === 'Inactive' ? 'red' : 'green'} />
                  </View>
                  <Text style={styles.sub} numberOfLines={1}>
                    {d.specialization || d.degree || 'Doctor'}{d.clinic ? ` · ${d.clinic}` : ''}
                  </Text>
                  <Text style={styles.sub}>Commission {d.commission || 0}% · {d.totalReports || 0} referrals</Text>
                </View>
                <ChevronRight size={18} color={colors.mutedForeground} />
              </Pressable>

              <View style={styles.ledgerRow}>
                <Mini label="Business" value={inr(d.totalBusiness)} />
                <Mini label="Commission" value={inr(d.totalCommission)} />
                <Mini label="Paid" value={inr(d.paidCommission)} tone={colors.green} />
                <Mini label="Pending" value={inr(d.pendingCommission)} tone={d.pendingCommission ? colors.orange : colors.green} />
              </View>

              <View style={styles.actions}>
                <Action Icon={Phone} label="Call" onPress={() => openWhatsApp(d.mobile, '')} />
                <Action
                  Icon={MessageCircle}
                  label="WhatsApp"
                  onPress={() => openWhatsApp(d.whatsapp || d.mobile, `Hello ${d.name}, here is your latest commission statement from PathoNexa.`)}
                />
                <Action
                  Icon={Wallet}
                  label="Ledger"
                  onPress={() => router.push({ pathname: '/doctor/[id]', params: { id: d._id || d.id } } as any)}
                />
                <Action Icon={Trash2} label="Delete" danger onPress={() => onDelete(d)} />
              </View>
            </Card>
          </FadeIn>
        ))
      )}
    </AppScreen>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'primary' | 'green' | 'orange' }) {
  const fg = tone === 'green' ? colors.green : tone === 'orange' ? colors.orange : colors.primary;
  return (
    <View style={styles.stat}>
      <Text style={[styles.statV, { color: fg }]} numberOfLines={1}>{value}</Text>
      <Text style={styles.statL}>{label}</Text>
    </View>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.miniL}>{label}</Text>
      <Text style={[styles.miniV, tone ? { color: tone } : null]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function Action({ Icon, label, onPress, danger }: { Icon: any; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable style={styles.action} onPress={onPress}>
      <Icon size={14} color={danger ? colors.danger : colors.primary} />
      <Text style={[styles.actionTxt, danger && { color: colors.danger }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  addBtn: { width: 36, height: 36, borderRadius: radius.xs, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  statRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 12, alignItems: 'center', ...shadow },
  statV: { fontFamily: fonts.extrabold, fontSize: 15 },
  statL: { fontFamily: fonts.medium, fontSize: 10, color: colors.mutedForeground, marginTop: 3 },
  formTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground, marginBottom: 10 },
  split: { flexDirection: 'row', gap: 10 },
  docCard: { padding: 0, marginBottom: 10 },
  docHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground, flexShrink: 1 },
  sub: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  ledgerRow: {
    flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.primarySoft,
  },
  miniL: { fontFamily: fonts.regular, fontSize: 9.5, color: colors.mutedForeground },
  miniV: { fontFamily: fonts.bold, fontSize: 12, color: colors.foreground, marginTop: 2 },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border },
  action: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 4, flexDirection: 'row', justifyContent: 'center' },
  actionTxt: { fontFamily: fonts.semibold, fontSize: 11, color: colors.primary },
});
