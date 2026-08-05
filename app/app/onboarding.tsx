import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    Pressable,
    NativeSyntheticEvent,
    NativeScrollEvent,
    Image,
    ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowRight, Sparkles, ShieldCheck, Trophy } from 'lucide-react-native';
import { colors, radius, fonts, spacing } from '@/lib/theme';

const { width, height } = Dimensions.get('window');
const ONBOARDING_KEY = 'tractorwala_onboarded_v1';

type Slide = {
    key: string;
    image: ImageSourcePropType;
    kicker: string;
    KickerIcon: any;
    title: string;
    highlight: string;
    sub: string;
};

const slides: Slide[] = [
    {
        key: '1',
        image: require('../assets/images/onb-auction.png'),
        kicker: 'LIVE AUCTIONS',
        KickerIcon: Sparkles,
        title: 'Bid Live On',
        highlight: 'Verified Tractors',
        sub: 'Join real-time auctions on 200+ tractors every day, straight from trusted dealers across India.',
    },
    {
        key: '2',
        image: require('../assets/images/onb-verified.png'),
        kicker: '100% SECURE',
        KickerIcon: ShieldCheck,
        title: 'RC Verified.',
        highlight: 'Bid With Trust',
        sub: 'Every listing is RC checked, inspection passed and dealer authenticated before going live.',
    },
    {
        key: '3',
        image: require('../assets/images/onb-win.png'),
        kicker: 'WIN & DELIVER',
        KickerIcon: Trophy,
        title: 'Win Big.',
        highlight: 'Door Delivery',
        sub: 'Lowest winning bids, insured transport and full paperwork — handled end to end, pan India.',
    },
];

export default function OnboardingScreen() {
    const insets = useSafeAreaInsets();
    const [index, setIndex] = useState(0);
    const listRef = useRef<FlatList<Slide>>(null);

    const finish = async () => {
        try { await AsyncStorage.setItem(ONBOARDING_KEY, '1'); } catch { }
        router.replace('/login');
    };

    const next = () => {
        if (index < slides.length - 1) {
            listRef.current?.scrollToIndex({ index: index + 1, animated: true });
        } else {
            finish();
        }
    };

    const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const i = Math.round(e.nativeEvent.contentOffset.x / width);
        if (i !== index) setIndex(i);
    };

    const isLast = index === slides.length - 1;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={[styles.topRow, { paddingTop: insets.top + 12 }]}>
                <View style={styles.brandRow}>
                    <Text style={styles.brand}>Tractor Wala</Text>
                </View>
                {!isLast && (
                    <Pressable onPress={finish} hitSlop={10} style={styles.skipBtn}>
                        <Text style={styles.skip}>Skip</Text>
                    </Pressable>
                )}
            </View>

            <FlatList
                ref={listRef}
                data={slides}
                keyExtractor={(s) => s.key}
                renderItem={({ item }) => <SlideView item={item} />}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                style={{ flex: 1 }}
            />

            <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
                <View style={styles.dots}>
                    {slides.map((_, i) => (
                        <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
                    ))}
                </View>

                <Pressable style={styles.cta} onPress={next}>
                    <LinearGradient
                        colors={[colors.primary, colors.primaryGradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.ctaInner}
                    >
                        <Text style={styles.ctaText}>{isLast ? 'Get Started' : 'Continue'}</Text>
                        <View style={styles.ctaIcon}>
                            <ArrowRight size={18} color={colors.primaryDark} strokeWidth={2.8} />
                        </View>
                    </LinearGradient>
                </Pressable>

                {isLast && (
                    <Text style={styles.loginHint}>
                        Already have an account?{' '}
                        <Text style={styles.loginLink} onPress={finish}>Log in</Text>
                    </Text>
                )}
            </View>
        </View>
    );
}

function SlideView({ item }: { item: Slide }) {
    const { KickerIcon } = item;
    return (
        <View style={{ width }}>
            <View style={styles.heroWrap}>
                <LinearGradient
                    colors={[colors.primaryLight, colors.background, colors.background]}
                    style={styles.heroBg}
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 0.8, y: 1 }}
                />
                <View style={styles.heroBlob} />
                <View style={styles.heroBlobSm} />
                <Image source={item.image} style={styles.heroImg} resizeMode="contain" />
            </View>

            <View style={styles.content}>
                <View style={styles.kicker}>
                    <KickerIcon size={13} color={colors.primaryDark} strokeWidth={2.5} />
                    <Text style={styles.kickerText}>{item.kicker}</Text>
                </View>

                <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.86}>
                    {item.title}{' '}
                    <Text style={styles.titleHighlight}>{item.highlight}</Text>
                </Text>

                <Text style={styles.sub} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.9}>{item.sub}</Text>
            </View>
        </View>
    );
}

const isShortScreen = height < 760;
const HERO_H = isShortScreen ? Math.min(height * 0.34, 270) : Math.min(height * 0.38, 330);
const TITLE_SIZE = isShortScreen ? 26 : 30;
const TITLE_LINE_HEIGHT = isShortScreen ? 31 : 36;
const SUB_SIZE = isShortScreen ? 13 : 14;
const SUB_LINE_HEIGHT = isShortScreen ? 20 : 22;

const styles = StyleSheet.create({
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.hPad,
        paddingBottom: 4,
        zIndex: 5,
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    brandDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
    brand: {
        color: colors.primaryDark,
        fontFamily: fonts.extrabold,
        fontSize: 17,
        letterSpacing: 0.3,
    },
    skipBtn: {
        paddingHorizontal: spacing.hPad,
        paddingVertical: 5,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
    },
    skip: { color: colors.primaryDark, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.3 },

    heroWrap: {
        height: HERO_H,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 0,
        overflow: 'hidden',
    },
    heroBg: { ...StyleSheet.absoluteFillObject },
    heroBlob: {
        position: 'absolute',
        width: HERO_H * 0.85,
        height: HERO_H * 0.85,
        borderRadius: (HERO_H * 0.85) / 2,
        backgroundColor: colors.primaryGlow,
        opacity: 0.35,
        top: HERO_H * 0.08,
    },
    heroBlobSm: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.accentLight,
        bottom: 40,
        right: 40,
        opacity: 0.7,
    },
    heroImg: {
        width: '82%',
        height: '84%',
    },

    content: { paddingHorizontal: spacing.hPad, marginTop: 12 },
    kicker: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: spacing.hPad,
        paddingVertical: 4,
        backgroundColor: colors.primaryLight,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: radius.pill,
    },
    kickerText: {
        color: colors.primaryDark,
        fontFamily: fonts.extrabold,
        fontSize: 10,
        letterSpacing: 1.2,
    },
    title: {
        color: colors.foreground,
        fontFamily: fonts.extrabold,
        fontSize: TITLE_SIZE,
        marginTop: 10,
        lineHeight: TITLE_LINE_HEIGHT,
        letterSpacing: 0,
    },
    titleHighlight: {
        color: colors.primary,
        fontFamily: fonts.extrabold,
        fontStyle: 'italic',
    },
    sub: {
        color: colors.mutedForeground,
        fontFamily: fonts.medium,
        fontSize: SUB_SIZE,
        marginTop: 8,
        lineHeight: SUB_LINE_HEIGHT,
    },

    footer: { paddingHorizontal: spacing.hPad, paddingTop: 8 },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginBottom: 8 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
    dotActive: { width: 22, backgroundColor: colors.primary },

    cta: { alignSelf: 'center', minWidth: 190, maxWidth: 280, borderRadius: radius.lg, overflow: 'hidden' },
    ctaInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 9,
        paddingHorizontal: spacing.hPad,
    },
    ctaText: {
        color: colors.primaryForeground,
        fontFamily: fonts.extrabold,
        fontSize: 15,
        letterSpacing: 0,
    },
    ctaIcon: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: colors.primaryForeground,
        alignItems: 'center',
        justifyContent: 'center',
    },

    loginHint: {
        color: colors.mutedForeground,
        fontFamily: fonts.medium,
        fontSize: 13,
        textAlign: 'center',
        marginTop: 8,
    },
    loginLink: { color: colors.primary, fontFamily: fonts.extrabold },
});
