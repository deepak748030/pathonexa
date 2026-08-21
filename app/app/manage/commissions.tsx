import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ChevronLeft, Wallet, ChevronRight, CheckCircle2, Percent } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import Avatar from '@/components/Avatar';
import Field from '@/components/Field';
import Select from '@/components/Select';
import PrimaryButton from '@/components/PrimaryButton';
import { Card, FadeIn, ListRow, EmptyState, OfflineBanner } from '@/components/UI';
import { colors, fonts, radius, shadow } from '@/lib/theme';
import { endpoints } from '@/lib/api';
import { inr, digitsOnly } from '@/lib/format';

/**
 * Doctor commission module — wallet per doctor, payout entry and history.
 * Example from the spec: report ₹500 × 20% → doctor wallet ₹100, lab ₹400.
 */
export default function Commissions() {
  const [summary, setSummary] = React.useState<any>(null);
  const [payouts, setPayouts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [target, setTarget] = React.useState<any>(null);
  const [amount, setAmount] = React.useState('');
  const [mode, setMode] = React.useState('UPI');
  const [note, setNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const [s, list] = await Promise.all([endpoints.commissions.summary(), endpoints.commissions.list()]);
      setSummary(s);
      setPayouts(Array.isArray(list) ? list : []);
    } catch (e: any) {
      console.warn(e?.message || e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  const pay = async () => {
    if (!target) return;
    const value = Number(amount || 0);
    if (!value) return Alert.alert('Enter an amount');
    setSaving(true);
    try {
      await endpoints.commissions.pay({ doctorId: target._id || target.id, amount: value, mode, note });
      setTarget(null);
      setNote('');
      await load();
    } catch (e: any) {
      Alert.alert('Could not save payout', e?.message || 'Server error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen
      keyboard
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
      header={
        <ScreenHeader
          title="Doctor Commission"
          subtitle="Wallets, payouts and history"
          left={<ChevronLeft size={24} color="#fff" />}
          onLeftPress={() => router.back()}
        />
      }
    >
      <OfflineBanner />
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : (
        <>
          <FadeIn>
            <View style={styles.grid}>
              <Tile label="Total Commission" value={inr(summary?.totalCommission)} tone={colors.primary} />
              <Tile label="Paid" value={inr(summary?.paidCommission)} tone={colors.green} />
              <Tile label="Pending Payout" value={inr(summary?.pendingCommission)} tone={colors.orange} />
            </View>
          </FadeIn>

          <Text style={styles.section}>Doctor wallets</Text>
          <Card style={{ padding: 0 }}>
            {(summary?.doctors || []).length === 0 ? (
              <EmptyState title="No doctors yet" subtitle="Add referring doctors to track commission." />
            ) : summary.doctors.map((d: any, i: number) => (
              <ListRow key={d._id || i} last={i === summary.doctors.length - 1}>
                <View style={styles.row}>
                  <Avatar name={d.name} color="#DCFCE7" size={40} />
                  <Pressable
                    style={{ flex: 1, minWidth: 0 }}
                    onPress={() => router.push({ pathname: '/doctor/[id]', params: { id: d._id || d.id } } as any)}
                  >
                    <Text style={styles.title} numberOfLines={1}>{d.name}</Text>
                    <Text style={styles.meta}>
                      <Percent size={9} color={colors.mutedForeground} /> {d.commission || 0}% · {d.totalReports} reports · {inr(d.totalBusiness)}
                    </Text>
                    <Text style={styles.meta}>
                      Earned {inr(d.totalCommission)} · Paid {inr(d.paidCommission)}
                    </Text>
                  </Pressable>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text style={[styles.amount, { color: d.pendingCommission ? colors.orange : colors.green }]}>
                      {inr(d.pendingCommission)}
                    </Text>
                    <Pressable
                      style={[styles.payBtn, !d.pendingCommission && { backgroundColor: colors.muted }]}
                      onPress={() => {
                        setTarget(d);
                        setAmount(String(d.pendingCommission || ''));
                      }}
                    >
                      <Wallet size={12} color={d.pendingCommission ? '#fff' : colors.mutedForeground} />
                      <Text style={[styles.payTxt, !d.pendingCommission && { color: colors.mutedForeground }]}>Pay</Text>
                    </Pressable>
                  </View>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </View>
              </ListRow>
            ))}
          </Card>

          {target && (
            <FadeIn>
              <Card style={{ marginTop: 12 }}>
                <Text style={styles.section}>Pay {target.name}</Text>
                <Text style={styles.meta}>Pending {inr(target.pendingCommission)} · UPI {target.upi || '—'}</Text>
                <View style={{ height: 10 }} />
                <Field label="Amount (₹)" value={amount} keyboardType="number-pad" onChangeText={(t) => setAmount(digitsOnly(t, 7))} />
                <Select label="Mode" value={mode} options={['Cash', 'UPI', 'Bank Transfer', 'Card']} onChange={setMode} />
                <Field label="Note" value={note} onChangeText={setNote} placeholder="Reference / month" />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}><PrimaryButton title="Cancel" ghost onPress={() => setTarget(null)} /></View>
                  <View style={{ flex: 1.4 }}><PrimaryButton title="Save payout" onPress={pay} loading={saving} /></View>
                </View>
              </Card>
            </FadeIn>
          )}

          <Text style={styles.section}>Payout history</Text>
          <Card style={{ padding: 0, marginBottom: 20 }}>
            {payouts.length === 0 ? (
              <EmptyState title="No payouts yet" subtitle="Commission payments will be listed here." />
            ) : payouts.map((p, i) => (
              <ListRow key={p._id || i} last={i === payouts.length - 1}>
                <View style={styles.row}>
                  <CheckCircle2 size={16} color={colors.green} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{p.doctor}</Text>
                    <Text style={styles.meta}>{p.date} {p.time} · {p.mode}{p.note ? ` · ${p.note}` : ''}</Text>
                  </View>
                  <Text style={[styles.amount, { color: colors.danger }]}>−{inr(p.amount)}</Text>
                </View>
              </ListRow>
            ))}
          </Card>
        </>
      )}
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
  grid: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 12, ...shadow },
  tileV: { fontFamily: fonts.extrabold, fontSize: 14.5, color: colors.foreground },
  tileL: { fontFamily: fonts.medium, fontSize: 10, color: colors.mutedForeground, marginTop: 3 },
  section: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground, marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontFamily: fonts.semibold, fontSize: 13, color: colors.foreground },
  meta: { fontFamily: fonts.regular, fontSize: 10.5, color: colors.mutedForeground, marginTop: 2 },
  amount: { fontFamily: fonts.bold, fontSize: 13 },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill,
  },
  payTxt: { color: '#fff', fontFamily: fonts.semibold, fontSize: 10.5 },
});
