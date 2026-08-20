import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  ChevronLeft, IndianRupee, FileDown, MessageCircle, Wallet, CheckCircle2,
} from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import Avatar from '@/components/Avatar';
import Field from '@/components/Field';
import Select from '@/components/Select';
import PrimaryButton from '@/components/PrimaryButton';
import { Card, FadeIn, ListRow, EmptyState, OfflineBanner, Badge } from '@/components/UI';
import { colors, fonts, radius, shadow } from '@/lib/theme';
import { endpoints } from '@/lib/api';
import { inr, digitsOnly } from '@/lib/format';
import { buildLedgerHtml } from '@/lib/reportHtml';
import { pdfFromHtml, openWhatsApp } from '@/lib/share';
import { useSettings } from '@/lib/settings';

const MODES = ['Cash', 'UPI', 'Bank Transfer', 'Card'];

export default function DoctorLedger() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const settings = useSettings((s) => s.settings);
  const loadSettings = useSettings((s) => s.load);
  const [ledger, setLedger] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [payOpen, setPayOpen] = React.useState(false);
  const [amount, setAmount] = React.useState('');
  const [mode, setMode] = React.useState('UPI');
  const [note, setNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!id) return;
    try {
      const data = await endpoints.doctors.ledger(String(id));
      setLedger(data);
      setAmount(String(data?.pendingCommission || ''));
    } catch (e: any) {
      console.warn(e?.message || e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(React.useCallback(() => { loadSettings(); load(); }, [load, loadSettings]));

  const doctor = ledger?.doctor || {};

  const payCommission = async () => {
    const value = Number(amount || 0);
    if (!value) return Alert.alert('Enter an amount', 'Type the payout amount first.');
    setSaving(true);
    try {
      await endpoints.commissions.pay({ doctorId: String(id), amount: value, mode, note });
      setPayOpen(false);
      setNote('');
      await load();
      Alert.alert('Commission paid', `${inr(value)} recorded for ${doctor.name}.`);
    } catch (e: any) {
      Alert.alert('Could not save payout', e?.message || 'Server error');
    } finally {
      setSaving(false);
    }
  };

  const exportPdf = async () => {
    if (!ledger) return;
    await pdfFromHtml(buildLedgerHtml(ledger, settings), `Statement ${doctor.name}`);
  };

  if (loading) {
    return (
      <AppScreen header={<ScreenHeader title="Doctor Ledger" left={<ChevronLeft size={24} color="#fff" />} onLeftPress={() => router.back()} />}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
      </AppScreen>
    );
  }

  if (!ledger) {
    return (
      <AppScreen header={<ScreenHeader title="Doctor Ledger" left={<ChevronLeft size={24} color="#fff" />} onLeftPress={() => router.back()} />}>
        <EmptyState title="Doctor not found" subtitle="This doctor may have been removed." />
      </AppScreen>
    );
  }

  return (
    <AppScreen
      keyboard
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
      header={
        <ScreenHeader
          title={doctor.name}
          subtitle={`${doctor.specialization || doctor.degree || 'Doctor'} · ${doctor.commission || 0}% commission`}
          left={<ChevronLeft size={24} color="#fff" />}
          onLeftPress={() => router.back()}
        />
      }
    >
      <OfflineBanner />

      <FadeIn>
        <Card style={styles.hero}>
          <Avatar name={doctor.name} color="#DCFCE7" size={52} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{doctor.name}</Text>
            <Text style={styles.meta}>{doctor.clinic || '—'} · {doctor.mobile || '—'}</Text>
            <Text style={styles.meta}>{doctor.upi ? `UPI: ${doctor.upi}` : ''}{doctor.bank ? `  ·  ${doctor.bank}` : ''}</Text>
          </View>
          <Badge text={doctor.status || 'Active'} tone={doctor.status === 'Inactive' ? 'red' : 'green'} />
        </Card>
      </FadeIn>

      <FadeIn delay={60}>
        <View style={styles.grid}>
          <Tile label="Total Reports" value={String(ledger.totalReports)} />
          <Tile label="Total Business" value={inr(ledger.totalBusiness)} />
          <Tile label="Total Commission" value={inr(ledger.totalCommission)} tone={colors.primary} />
          <Tile label="Paid Commission" value={inr(ledger.paidCommission)} tone={colors.green} />
          <Tile label="Pending Commission" value={inr(ledger.pendingCommission)} tone={colors.orange} />
          <Tile label="Wallet Rate" value={`${doctor.commission || 0}%`} />
        </View>
      </FadeIn>

      <FadeIn delay={90}>
        <View style={styles.ctaRow}>
          <Pressable style={styles.cta} onPress={() => setPayOpen((v) => !v)}>
            <Wallet size={15} color="#fff" />
            <Text style={styles.ctaTxt}>Pay Commission</Text>
          </Pressable>
          <Pressable style={[styles.cta, styles.ctaGhost]} onPress={exportPdf}>
            <FileDown size={15} color={colors.primary} />
            <Text style={[styles.ctaTxt, { color: colors.primary }]}>PDF Statement</Text>
          </Pressable>
          <Pressable
            style={[styles.cta, styles.ctaGhost]}
            onPress={() => openWhatsApp(
              doctor.whatsapp || doctor.mobile,
              `Hello ${doctor.name},\n\nYour commission statement:\nReports: ${ledger.totalReports}\nCommission: ${inr(ledger.totalCommission)}\nPaid: ${inr(ledger.paidCommission)}\nPending: ${inr(ledger.pendingCommission)}\n\n${settings.shortName || settings.name}`
            )}
          >
            <MessageCircle size={15} color={colors.primary} />
            <Text style={[styles.ctaTxt, { color: colors.primary }]}>WhatsApp</Text>
          </Pressable>
        </View>
      </FadeIn>

      {payOpen && (
        <FadeIn>
          <Card style={{ marginTop: 12 }}>
            <Text style={styles.section}>Record commission payout</Text>
            <Field label="Amount (₹)" value={amount} onChangeText={(t) => setAmount(digitsOnly(t, 7))} keyboardType="number-pad" placeholder="0" />
            <Select label="Payment mode" value={mode} options={MODES} onChange={setMode} />
            <Field label="Note" value={note} onChangeText={setNote} placeholder="Cheque no. / reference" />
            <PrimaryButton title="Save payout" onPress={payCommission} loading={saving} />
          </Card>
        </FadeIn>
      )}

      <Text style={styles.section}>Monthly statement</Text>
      <Card style={{ padding: 0 }}>
        {(ledger.monthly || []).length === 0 ? (
          <EmptyState title="No referrals yet" />
        ) : (
          <>
            <View style={styles.thead}>
              <Text style={[styles.th, { flex: 1.3 }]}>Month</Text>
              <Text style={[styles.th, { width: 58, textAlign: 'right' }]}>Reports</Text>
              <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Business</Text>
              <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Commission</Text>
            </View>
            {ledger.monthly.map((m: any) => (
              <View key={m.key} style={styles.trow}>
                <Text style={[styles.td, { flex: 1.3 }]}>{m.label}</Text>
                <Text style={[styles.td, { width: 58, textAlign: 'right' }]}>{m.reports}</Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{inr(m.business)}</Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'right', color: colors.primary, fontFamily: fonts.bold }]}>{inr(m.commission)}</Text>
              </View>
            ))}
          </>
        )}
      </Card>

      <Text style={styles.section}>Payout history</Text>
      <Card style={{ padding: 0 }}>
        {(ledger.payouts || []).length === 0 ? (
          <EmptyState title="No payouts yet" subtitle="Commission payments appear here." />
        ) : ledger.payouts.map((p: any, i: number) => (
          <ListRow key={p._id || i} last={i === ledger.payouts.length - 1}>
            <View style={styles.payRow}>
              <CheckCircle2 size={16} color={colors.green} />
              <View style={{ flex: 1 }}>
                <Text style={styles.payTitle}>{inr(p.amount)} · {p.mode}</Text>
                <Text style={styles.meta}>{p.date} {p.time} {p.note ? `· ${p.note}` : ''}</Text>
              </View>
            </View>
          </ListRow>
        ))}
      </Card>

      <Text style={styles.section}>Referred reports</Text>
      <Card style={{ padding: 0, marginBottom: 20 }}>
        {(ledger.reports || []).length === 0 ? (
          <EmptyState title="No reports referred yet" />
        ) : ledger.reports.map((r: any, i: number) => (
          <ListRow
            key={r._id}
            last={i === ledger.reports.length - 1}
            onPress={() => router.push({ pathname: '/report-preview', params: { id: r._id } } as any)}
          >
            <View style={styles.payRow}>
              <IndianRupee size={15} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.payTitle}>{r.patient} · {r.test}</Text>
                <Text style={styles.meta}>{r.reportId} · {r.date}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.payTitle}>{inr(r.amount)}</Text>
                <Text style={[styles.meta, { color: colors.green }]}>+{inr(r.commission)}</Text>
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

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontFamily: fonts.bold, fontSize: 15, color: colors.foreground },
  meta: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tile: { width: '31.5%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 12, ...shadow },
  tileV: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.foreground },
  tileL: { fontFamily: fonts.medium, fontSize: 10, color: colors.mutedForeground, marginTop: 3 },
  ctaRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  cta: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 44, borderRadius: radius.md, backgroundColor: colors.primary,
  },
  ctaGhost: { backgroundColor: colors.primaryLight },
  ctaTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 11.5 },
  section: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground, marginTop: 18, marginBottom: 8 },
  thead: { flexDirection: 'row', backgroundColor: colors.muted, paddingHorizontal: 12, paddingVertical: 8 },
  th: { fontFamily: fonts.semibold, fontSize: 10, color: colors.mutedForeground },
  trow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  td: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.foreground },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  payTitle: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.foreground },
});
