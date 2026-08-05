import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/ScreenHeader';
import { colors, fonts } from '@/lib/theme';
import { Shield } from 'lucide-react-native';

const SECTIONS: { title: string; body: string }[] = [
    { title: '1. Introduction', body: 'Tractor Wala ("we", "our", "us") respects your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our tractor auction and bidding application.' },
    { title: '2. Information We Collect', body: 'We collect your mobile number (+91) for account creation and OTP verification, your name, email, and city from the profile section, KYC documents where required by law, bidding activity, order history, wallet transactions, and device information used to keep your account secure.' },
    { title: '3. How We Use Your Information', body: 'Your information is used to authenticate logins, place and track bids, process wallet deposits and payouts, deliver winning auction items, send important alerts about outbids, auction endings and orders, and to comply with Indian financial and tax regulations.' },
    { title: '4. Bidding & Auction Data', body: 'Bid amounts, timestamps, and auction outcomes are recorded to maintain a fair marketplace. Winning bids may be visible to the seller and to other participants of that auction. Your phone number is never shared publicly.' },
    { title: '5. Payments & Wallet', body: 'Wallet deposits, refunds, and settlements are processed through licensed Indian payment gateways. We do not store your full card or UPI credentials on our servers.' },
    { title: '6. Data Sharing', body: 'We do not sell your personal data. Information is shared only with verified sellers for order fulfilment, with payment partners for transactions, and with government authorities when legally required.' },
    { title: '7. Data Security', body: 'All traffic is encrypted in transit. OTP-based authentication, server-side validation, and access controls protect your account. You are responsible for keeping your device and OTP confidential.' },
    { title: '8. Data Retention', body: 'Account and transaction data is retained as long as your account is active and for the period required by Indian tax and consumer protection laws. You may request deletion of your account at any time through Help & Support.' },
    { title: '9. Your Rights', body: 'You may access, correct, or update your profile information from the Edit Profile screen. You can also withdraw consent or request account deletion by contacting our support team.' },
    { title: '10. Children', body: 'Tractor Wala is intended for users aged 18 and above. We do not knowingly collect data from minors.' },
    { title: '11. Changes to This Policy', body: 'We may update this policy from time to time. Significant changes will be notified via in-app notification.' },
    { title: '12. Contact Us', body: 'For any privacy related queries, reach us via the Help & Support section or email support@tractorwala.in.' },
];

export default function PrivacyPolicyScreen() {
    const insets = useSafeAreaInsets();
    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScreenHeader title="Privacy Policy" />
            <ScrollView contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}>
                <View style={styles.intro}>
                    <View style={styles.iconWrap}><Shield size={16} color={colors.primaryDark} /></View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.introText}>Your privacy matters to us</Text>
                        <Text style={styles.updated}>Last updated: January 2025</Text>
                    </View>
                </View>

                <View style={styles.sep} />

                {SECTIONS.map((s, i) => (
                    <View key={s.title}>
                        <View style={styles.section}>
                            <Text style={styles.title}>{s.title}</Text>
                            <Text style={styles.body}>{s.body}</Text>
                        </View>
                        {i < SECTIONS.length - 1 && <View style={styles.sep} />}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    intro: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, paddingHorizontal: 6, paddingVertical: 10 },
    iconWrap: { width: 32, height: 32, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 1, borderColor: colors.border },
    introText: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 13 },
    updated: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 10, marginTop: 2 },
    sep: { height: 1, backgroundColor: colors.border },
    section: { paddingHorizontal: 6, paddingVertical: 10, backgroundColor: colors.card },
    title: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 13, marginBottom: 4 },
    body: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 11, lineHeight: 16 },
});
