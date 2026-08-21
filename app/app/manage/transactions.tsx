import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  ChevronLeft, Printer, Plus, Banknote, Smartphone, CreditCard,
  Building2, Wallet,
} from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import Field from '@/components/Field';
import Select, { ChipSelect } from '@/components/Select';
import PrimaryButton from '@/components/PrimaryButton';
import SearchBar from '@/components/SearchBar';
import { Card, FadeIn, ListRow, EmptyState, OfflineBanner, Badge } from '@/components/UI';
import { colors, fonts, radius, shadow } from '@/lib/theme';
import { endpoints } from '@/lib/api';
import { inr, digitsOnly } from '@/lib/format';
import { buildReceiptHtml } from '@/lib/reportHtml';
import { printHtml } from '@/lib/share';
import { useSettings } from '@/lib/settings';

const MODE_ICON: Record<string, any> = {
  Cash: Banknote, UPI: Smartphone, Card: CreditCard, 'Bank Transfer': Building2,
};

export default function Transactions() {
  const settings = useSettings((s) => s.settings);
  const loadSettings = useSettings((s) => s.load);
  const [list, setList] = React.useState<any[]>([]);
  const [summary, setSummary] = React.useState<any>(null);
  const [pending, setPending] = React.useState<any[]>([]);
  const [modes, setModes] = React.useState<string[]>(['Cash', 'UPI', 'Card', 'Bank Transfer']);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [filter, setFilter] = React.useState('All');
  const [q, setQ] = React.useState('');
  const [target, setTarget] = React.useState<any>(null);
  const [amount, setAmount] = React.useState('');
  const [mode, setMode] = React.useState('Cash');
  const [txnId, setTxnId] = React.useState('');
  const [note, setNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const [txns, sum, reports, methods] = await Promise.all([
        endpoints.transactions.list(),
        endpoints.transactions.summary(),
        endpoints.reports.getAll(),
        endpoints.meta.list('payments').catch(() => []),
      ]);
      setList(Array.isArray(txns) ? txns : []);
      setSummary(sum);
      setPending((Array.isArray(reports) ? reports : []).filter((r: any) => Number(r.pendingAmount ?? (r.paid ? 0 : r.amount)) > 0));
      if (Array.isArray(methods) && methods.length) setModes(methods.map((m: any) => m.name));
    } catch (e: any) {
      console.warn(e?.message || e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(React.useCallback(() => { loadSettings(); load(); }, [load, loadSettings]));

  const openCollect = (report: any) => {
    setTarget(report);
    setAmount(String(Number(report.pendingAmount ?? report.amount) || ''));
    setMode(report.paymentMode || 'Cash');
    setTxnId('');
    setNote('');
  };

  const collect = async () => {
    if (!target) return;
    setSaving(true);
    try {
      const res = await endpoints.transactions.collect({
        reportId: target._id || target.id,
        amount: Number(amount || 0),
        mode,
        txnId: txnId || undefined,
        note: note || undefined,
      });
      setTarget(null);
      await load();
      Alert.alert(
        'Payment recorded',
        `${inr(res?.transaction?.amount)} collected from ${res?.transaction?.patient || 'patient'}.`,
        [
          { text: 'Close', style: 'cancel' },
          { text: 'Print receipt', onPress: () => printHtml(buildReceiptHtml(res.transaction, settings)) },
        ]
      );
    } catch (e: any) {
      Alert.alert('Could not record payment', e?.message || 'Server error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = list.filter((t) => {
    if (filter !== 'All' && t.mode !== filter && t.type !== filter) return false;
    const s = q.toLowerCase().trim();
    if (!s) return true;
    return `${t.txnId} ${t.patient} ${t.reportId} ${t.note} ${t.mode}`.toLowerCase().includes(s);
  });

  return (
    <AppScreen
      keyboard
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
      header={
        <ScreenHeader
          title="Payments & Ledger"
          subtitle="Collections, payouts and receipts"
          left={<ChevronLeft size={24} color="#fff" />}
          onLeftPress={() => router.back()}
          right={
            <Pressable style={styles.addBtn} onPress={() => router.push('/manage/payments' as any)}>
              <CreditCard size={17} color="#fff" />
            </Pressable>
          }
        />
      }
    >
      <OfflineBanner />

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : (
        <>
          <FadeIn>
            <View style={styles.grid}>
              <Tile label="Today's Collection" value={inr(summary?.todayCollection)} tone={colors.green} />
              <Tile label="Total Collection" value={inr(summary?.totalCollection)} tone={colors.primary} />
              <Tile label="Pending Amount" value={inr(summary?.pendingAmount)} tone={colors.orange} />
              <Tile label="Transactions" value={String(summary?.transactions || 0)} />
            </View>
          </FadeIn>

          {!!summary?.byMode?.length && (
            <FadeIn delay={50}>
              <Card style={{ marginTop: 12 }}>
                <Text style={styles.section}>Collection by mode</Text>
                {summary.byMode.map((m: any) => {
                  const Icon = MODE_ICON[m.mode] || Wallet;
                  const pct = summary.totalCollection ? Math.round((m.amount / summary.totalCollection) * 100) : 0;
                  return (
                    <View key={m.mode} style={styles.modeRow}>
                      <Icon size={15} color={colors.primary} />
                      <Text style={styles.modeName}>{m.mode}</Text>
                      <View style={styles.bar}><View style={[styles.barFill, { width: `${pct}%` }]} /></View>
                      <Text style={styles.modeVal}>{inr(m.amount)}</Text>
                    </View>
                  );
                })}
              </Card>
            </FadeIn>
          )}

          {pending.length > 0 && (
            <>
              <Text style={styles.section}>Pending payments ({pending.length})</Text>
              <Card style={{ padding: 0 }}>
                {pending.slice(0, 8).map((r, i) => (
                  <ListRow key={r._id || r.id} last={i === Math.min(pending.length, 8) - 1}>
                    <View style={styles.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.title}>{r.patient?.name || 'Patient'} · {r.test}</Text>
                        <Text style={styles.meta}>{r.reportId} · {r.date} · Paid {inr(r.paidAmount)}</Text>
                      </View>
                      <Text style={[styles.amount, { color: colors.orange }]}>{inr(r.pendingAmount ?? r.amount)}</Text>
                      <Pressable style={styles.collectBtn} onPress={() => openCollect(r)}>
                        <Plus size={13} color="#fff" />
                        <Text style={styles.collectTxt}>Collect</Text>
                      </Pressable>
                    </View>
                  </ListRow>
                ))}
              </Card>
            </>
          )}

          {target && (
            <FadeIn>
              <Card style={{ marginTop: 12 }}>
                <Text style={styles.section}>Collect payment · {target.reportId}</Text>
                <Text style={styles.meta}>
                  {target.patient?.name} · Invoice {inr(target.amount)} · Pending {inr(target.pendingAmount ?? target.amount)}
                </Text>
                <View style={{ height: 10 }} />
                <Field label="Amount (₹)" value={amount} keyboardType="number-pad" onChangeText={(t) => setAmount(digitsOnly(t, 7))} />
                <Select label="Payment mode" value={mode} options={modes} onChange={setMode} />
                <Field label="Transaction ID" value={txnId} onChangeText={setTxnId} placeholder="UPI / card reference (optional)" />
                <Field label="Note" value={note} onChangeText={setNote} placeholder="Optional note" />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}><PrimaryButton title="Cancel" ghost onPress={() => setTarget(null)} /></View>
                  <View style={{ flex: 1.4 }}><PrimaryButton title="Save payment" onPress={collect} loading={saving} /></View>
                </View>
              </Card>
            </FadeIn>
          )}

          <Text style={styles.section}>Ledger</Text>
          <View style={{ marginBottom: 8 }}>
            <SearchBar value={q} onChangeText={setQ} placeholder="Search receipt no, patient or report" />
          </View>
          <ChipSelect
            small
            value={filter}
            onChange={setFilter}
            options={['All', ...modes, 'Commission Payout', 'Subscription']}
          />

          <Card style={{ padding: 0, marginTop: 10, marginBottom: 20 }}>
            {filtered.length === 0 ? (
              <EmptyState title="No transactions" subtitle="Collections and payouts appear here." />
            ) : filtered.map((t, i) => {
              const Icon = MODE_ICON[t.mode] || Wallet;
              const outgoing = t.type !== 'Collection';
              return (
                <ListRow key={t._id || i} last={i === filtered.length - 1}>
                  <View style={styles.row}>
                    <View style={[styles.icon, outgoing && { backgroundColor: colors.redLight }]}>
                      <Icon size={15} color={outgoing ? colors.danger : colors.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.title} numberOfLines={1}>
                        {t.patient || t.note || t.type} {t.reportId ? `· ${t.reportId}` : ''}
                      </Text>
                      <Text style={styles.meta} numberOfLines={1}>
                        {t.txnId} · {t.date} {t.time || ''} · {t.mode}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.amount, { color: outgoing ? colors.danger : colors.green }]}>
                        {outgoing ? '−' : '+'}{inr(t.amount)}
                      </Text>
                      <Badge text={t.type || 'Collection'} tone={outgoing ? 'red' : 'green'} />
                    </View>
                    <Pressable
                      hitSlop={8}
                      style={styles.printBtn}
                      onPress={() => printHtml(buildReceiptHtml(t, settings))}
                    >
                      <Printer size={15} color={colors.primary} />
                    </Pressable>
                  </View>
                </ListRow>
              );
            })}
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
  addBtn: { width: 36, height: 36, borderRadius: radius.xs, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '48%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 12, ...shadow },
  tileV: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.foreground },
  tileL: { fontFamily: fonts.medium, fontSize: 10.5, color: colors.mutedForeground, marginTop: 3 },
  section: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground, marginTop: 16, marginBottom: 8 },
  modeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  modeName: { fontFamily: fonts.semibold, fontSize: 12, color: colors.foreground, width: 84 },
  bar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.muted, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: colors.primary },
  modeVal: { fontFamily: fonts.bold, fontSize: 12, color: colors.foreground, width: 74, textAlign: 'right' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.foreground },
  meta: { fontFamily: fonts.regular, fontSize: 10.5, color: colors.mutedForeground, marginTop: 2 },
  amount: { fontFamily: fonts.bold, fontSize: 13 },
  collectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.pill,
  },
  collectTxt: { color: '#fff', fontFamily: fonts.semibold, fontSize: 11 },
  printBtn: { padding: 6 },
});
