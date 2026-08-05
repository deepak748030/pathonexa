import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { CheckCircle2, X, Smartphone, CreditCard, Building2, Wallet, ShieldCheck } from 'lucide-react-native';
import { colors, fonts, radius } from '@/lib/theme';

type Props = {
    visible: boolean;
    amount: number;
    description?: string;
    upiId: string;
    payeeName: string;
    onSuccess: (paymentId: string) => void;
    onClose: () => void;
};

type Method = 'upi' | 'card' | 'netbanking' | 'wallet';

const METHODS: { key: Method; label: string; Icon: any }[] = [
    { key: 'upi', label: 'UPI', Icon: Smartphone },
    { key: 'card', label: 'Card', Icon: CreditCard },
    { key: 'netbanking', label: 'Net Banking', Icon: Building2 },
    { key: 'wallet', label: 'Wallet', Icon: Wallet },
];

export default function RazorpayMockSheet({
    visible, amount, description, upiId, payeeName, onSuccess, onClose,
}: Props) {
    const [method, setMethod] = useState<Method>('upi');
    const [processing, setProcessing] = useState(false);
    const [paid, setPaid] = useState(false);

    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=Security%20Deposit`;

    const reset = () => { setProcessing(false); setPaid(false); setMethod('upi'); };

    const handleClose = () => { if (!processing) { reset(); onClose(); } };

    const pay = () => {
        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            setPaid(true);
            setTimeout(() => {
                const id = `pay_test_${Math.random().toString(36).slice(2, 12)}`;
                reset();
                onSuccess(id);
            }, 900);
        }, 1400);
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <Pressable style={styles.backdrop} onPress={handleClose} />
            <View style={styles.sheet}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.brandRow}>
                        <View style={styles.brandLogo}>
                            <Text style={styles.brandLogoText}>R</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.brandTitle}>Razorpay</Text>
                            <View style={styles.testBadge}>
                                <Text style={styles.testText}>TEST MODE</Text>
                            </View>
                        </View>
                        <Pressable onPress={handleClose} hitSlop={10} disabled={processing}>
                            <X size={18} color={colors.foreground} />
                        </Pressable>
                    </View>
                    <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>{payeeName}</Text>
                        <Text style={styles.amountValue}>₹ {amount.toLocaleString('en-IN')}</Text>
                    </View>
                    {description ? <Text style={styles.amountDesc}>{description}</Text> : null}
                </View>

                {paid ? (
                    <View style={styles.successWrap}>
                        <View style={styles.successIcon}>
                            <CheckCircle2 size={36} color="#FFFFFF" />
                        </View>
                        <Text style={styles.successTitle}>Payment Successful</Text>
                        <Text style={styles.successSub}>₹{amount.toLocaleString('en-IN')} received</Text>
                    </View>
                ) : (
                    <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ paddingBottom: 8 }}>
                        {/* Method tabs */}
                        <View style={styles.tabs}>
                            {METHODS.map((m) => {
                                const active = method === m.key;
                                const Icon = m.Icon;
                                return (
                                    <Pressable
                                        key={m.key}
                                        style={[styles.tab, active && styles.tabActive]}
                                        onPress={() => setMethod(m.key)}
                                        disabled={processing}
                                    >
                                        <Icon size={14} color={active ? '#FFFFFF' : colors.foreground} />
                                        <Text style={[styles.tabText, active && styles.tabTextActive]}>{m.label}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {method === 'upi' && (
                            <View style={styles.body}>
                                <Text style={styles.bodyTitle}>Scan & Pay with any UPI app</Text>
                                <View style={styles.qrWrap}>
                                    <View style={styles.qrInner}>
                                        <QRCode value={upiUri} size={150} color={colors.primaryDark} backgroundColor="#FFFFFF" />
                                    </View>
                                </View>
                                <View style={styles.upiRow}>
                                    <Text style={styles.upiLabel}>UPI ID</Text>
                                    <Text style={styles.upiValue}>{upiId}</Text>
                                </View>
                            </View>
                        )}

                        {method === 'card' && (
                            <View style={styles.body}>
                                <Text style={styles.bodyTitle}>Test card pre-filled</Text>
                                <View style={styles.testCard}>
                                    <Text style={styles.testCardNumber}>4111 1111 1111 1111</Text>
                                    <View style={styles.testCardRow}>
                                        <Text style={styles.testCardMeta}>12 / 30</Text>
                                        <Text style={styles.testCardMeta}>CVV ***</Text>
                                    </View>
                                </View>
                                <Text style={styles.hint}>This is a sandbox card. No real money will be charged.</Text>
                            </View>
                        )}

                        {method === 'netbanking' && (
                            <View style={styles.body}>
                                <Text style={styles.bodyTitle}>Select your bank</Text>
                                {['SBI', 'HDFC', 'ICICI', 'Axis'].map((b) => (
                                    <View key={b} style={styles.bankRow}>
                                        <Text style={styles.bankName}>{b} Bank</Text>
                                        <Text style={styles.bankTag}>TEST</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {method === 'wallet' && (
                            <View style={styles.body}>
                                <Text style={styles.bodyTitle}>Pay using wallet</Text>
                                {['Paytm', 'PhonePe', 'Amazon Pay', 'Mobikwik'].map((w) => (
                                    <View key={w} style={styles.bankRow}>
                                        <Text style={styles.bankName}>{w}</Text>
                                        <Text style={styles.bankTag}>TEST</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                )}

                {!paid && (
                    <Pressable style={[styles.payBtn, processing && { opacity: 0.85 }]} onPress={pay} disabled={processing}>
                        {processing
                            ? <ActivityIndicator color="#FFFFFF" />
                            : <Text style={styles.payBtnText}>Pay ₹{amount.toLocaleString('en-IN')}</Text>}
                    </Pressable>
                )}

                <View style={styles.footer}>
                    <ShieldCheck size={11} color={colors.mutedForeground} />
                    <Text style={styles.footerText}>Secured by Razorpay · 100% Safe Sandbox</Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
    sheet: { backgroundColor: colors.card, paddingHorizontal: 6, paddingTop: 8, paddingBottom: 16, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md, borderTopWidth: 1, borderColor: colors.border },

    header: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 6, marginBottom: 6 },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    brandLogo: { width: 30, height: 30, backgroundColor: '#072654', alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
    brandLogoText: { color: '#FFFFFF', fontFamily: fonts.extrabold, fontSize: 16 },
    brandTitle: { color: colors.foreground, fontFamily: fonts.extrabold, fontSize: 14 },
    testBadge: { alignSelf: 'flex-start', marginTop: 1, backgroundColor: colors.accentLight, borderWidth: 1, borderColor: colors.accent, paddingHorizontal: 4, paddingVertical: 0, borderRadius: radius.xs },
    testText: { color: colors.accentDark, fontFamily: fonts.extrabold, fontSize: 8, letterSpacing: 0.6 },
    amountRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6 },
    amountLabel: { color: colors.mutedForeground, fontFamily: fonts.semibold, fontSize: 12 },
    amountValue: { color: colors.foreground, fontFamily: fonts.extrabold, fontSize: 18 },
    amountDesc: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10, marginTop: 2 },

    tabs: { flexDirection: 'row', gap: 4, marginBottom: 6 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: colors.border, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: colors.background },
    tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 11 },
    tabTextActive: { color: '#FFFFFF' },

    body: { paddingVertical: 4 },
    bodyTitle: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 12, textAlign: 'center', marginBottom: 6 },
    qrWrap: { alignItems: 'center', marginVertical: 4 },
    qrInner: { padding: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFFFFF', borderRadius: radius.sm },
    upiRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: colors.background },
    upiLabel: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 10 },
    upiValue: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 12 },

    testCard: { borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.primaryLight, padding: 10, borderRadius: radius.sm },
    testCardNumber: { color: colors.primaryDark, fontFamily: fonts.extrabold, fontSize: 16, letterSpacing: 2 },
    testCardRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    testCardMeta: { color: colors.primaryDark, fontFamily: fonts.bold, fontSize: 11 },
    hint: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 10, marginTop: 6, textAlign: 'center' },

    bankRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 8, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, marginBottom: 4 },
    bankName: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 12 },
    bankTag: { color: colors.accentDark, backgroundColor: colors.accentLight, borderWidth: 1, borderColor: colors.accent, paddingHorizontal: 4, fontFamily: fonts.extrabold, fontSize: 9, borderRadius: radius.xs },

    payBtn: { backgroundColor: colors.primary, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, marginTop: 6 },
    payBtnText: { color: '#FFFFFF', fontFamily: fonts.extrabold, fontSize: 14 },

    successWrap: { alignItems: 'center', paddingVertical: 18 },
    successIcon: { width: 60, height: 60, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    successTitle: { color: colors.foreground, fontFamily: fonts.extrabold, fontSize: 16, marginTop: 8 },
    successSub: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },

    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8 },
    footerText: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 10 },
});
