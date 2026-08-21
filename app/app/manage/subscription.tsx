import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ChevronLeft, Crown, Check, Clock, ReceiptText } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import PrimaryButton from '@/components/PrimaryButton';
import { Card, FadeIn, ListRow, EmptyState, OfflineBanner, Badge } from '@/components/UI';
import { colors, fonts, radius } from '@/lib/theme';
import { endpoints } from '@/lib/api';
import { inr } from '@/lib/format';

/** Subscription system — 7 day free trial, monthly / yearly plans, reminders. */
export default function Subscription() {
  const [sub, setSub] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setSub(await endpoints.subscription.get());
    } catch (e: any) {
      console.warn(e?.message || e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  const subscribe = (plan: any) => {
    Alert.alert(
      `Activate ${plan.name}?`,
      plan.price ? `${inr(plan.price)} will be added to the ledger and ${plan.days} days added to your subscription.` : `${plan.days} days will be added.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: async () => {
            setBusy(plan.id);
            try {
              const next = await endpoints.subscription.subscribe(plan.id);
              setSub(next);
              Alert.alert('Subscription active', `${plan.name} is now active.`);
            } catch (e: any) {
              Alert.alert('Could not activate', e?.message || 'Server error');
            } finally {
              setBusy(null);
            }
          },
        },
      ]
    );
  };

  const expired = sub && sub.daysLeft <= 0;

  return (
    <AppScreen
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
      header={
        <ScreenHeader
          title="Subscription"
          subtitle="Plan, validity and invoices"
          left={<ChevronLeft size={24} color="#fff" />}
          onLeftPress={() => router.back()}
        />
      }
    >
      <OfflineBanner />
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : (
        <>
          <FadeIn>
            <Card style={[styles.current, expired && { borderColor: colors.red }]}>
              <View style={styles.currentHead}>
                <View style={styles.crown}><Crown size={18} color={colors.orange} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>{sub?.plan}</Text>
                  <Text style={styles.meta}>
                    {sub?.expiresAt ? `Valid till ${new Date(sub.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}` : '—'}
                  </Text>
                </View>
                <Badge text={expired ? 'Expired' : 'Active'} tone={expired ? 'red' : 'green'} />
              </View>

              <View style={styles.daysRow}>
                <Clock size={14} color={expired ? colors.danger : sub?.expiringSoon ? colors.orange : colors.green} />
                <Text style={[
                  styles.days,
                  { color: expired ? colors.danger : sub?.expiringSoon ? colors.orange : colors.green },
                ]}>
                  {expired ? 'Subscription expired — renew to continue' : `${sub?.daysLeft} day${sub?.daysLeft === 1 ? '' : 's'} remaining`}
                </Text>
              </View>

              {(expired || sub?.expiringSoon) && (
                <View style={styles.reminder}>
                  <Text style={styles.reminderTxt}>
                    Expiry reminder: renew now to keep cloud backup, WhatsApp sharing and multi-user access.
                  </Text>
                </View>
              )}
            </Card>
          </FadeIn>

          <Text style={styles.section}>Plans</Text>
          {(sub?.plans || []).map((plan: any, i: number) => {
            const active = sub?.plan === plan.name;
            return (
              <FadeIn key={plan.id} delay={i * 60}>
                <Card style={[styles.plan, active && styles.planActive]}>
                  <View style={styles.planHead}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planTitle}>{plan.name}</Text>
                      <Text style={styles.meta}>{plan.days} days validity</Text>
                    </View>
                    <Text style={styles.price}>{plan.price ? inr(plan.price) : 'Free'}</Text>
                  </View>
                  {plan.features?.map((f: string) => (
                    <View key={f} style={styles.featureRow}>
                      <Check size={13} color={colors.green} />
                      <Text style={styles.feature}>{f}</Text>
                    </View>
                  ))}
                  <View style={{ height: 10 }} />
                  <PrimaryButton
                    title={active ? 'Extend this plan' : `Activate ${plan.name}`}
                    ghost={active}
                    loading={busy === plan.id}
                    onPress={() => subscribe(plan)}
                  />
                </Card>
              </FadeIn>
            );
          })}

          <Text style={styles.section}>Billing history</Text>
          <Card style={{ padding: 0, marginBottom: 20 }}>
            {(sub?.history || []).length === 0 ? (
              <EmptyState title="No invoices yet" subtitle="Plan purchases appear here." />
            ) : sub.history.slice().reverse().map((h: any, i: number) => (
              <ListRow key={h.invoice || i} last={i === sub.history.length - 1}>
                <View style={styles.row}>
                  <ReceiptText size={15} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{h.plan}</Text>
                    <Text style={styles.meta}>{h.invoice} · {h.date}</Text>
                  </View>
                  <Text style={styles.title}>{inr(h.amount)}</Text>
                </View>
              </ListRow>
            ))}
          </Card>
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  current: { borderWidth: 1, borderColor: colors.border },
  currentHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  crown: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.orangeLight, alignItems: 'center', justifyContent: 'center' },
  planName: { fontFamily: fonts.bold, fontSize: 15, color: colors.foreground },
  meta: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  daysRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  days: { fontFamily: fonts.semibold, fontSize: 12.5 },
  reminder: { marginTop: 10, backgroundColor: '#FFFBEB', borderRadius: radius.sm, padding: 10, borderWidth: 1, borderColor: '#FDE68A' },
  reminderTxt: { fontFamily: fonts.medium, fontSize: 11, color: '#92400E', lineHeight: 16 },
  section: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground, marginTop: 18, marginBottom: 8 },
  plan: { marginBottom: 10 },
  planActive: { borderWidth: 1.5, borderColor: colors.primary },
  planHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  planTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground },
  price: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.primary },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 },
  feature: { fontFamily: fonts.regular, fontSize: 12, color: colors.mutedForeground },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.foreground },
});
