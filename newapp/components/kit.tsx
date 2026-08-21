// PathoNexa newapp — reusable UI kit (written fresh for this app)
import React from 'react';
import { T } from './T';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Platform,
  Keyboard,
  Dimensions,
  ActivityIndicator,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, PAGE_GUTTER, R, S } from '../src/theme';
import { toneColor, type Tone } from '../src/data';
import { fieldFocusProps, lastFieldRect, onFieldFocus } from '../src/focusBus';

export const MAXW = 520;

/* ---------- motion helpers ---------- */

export function Press({
  onPress,
  style,
  children,
  scaleTo = 0.96,
  accessibilityLabel,
  accessibilityState,
}: {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  scaleTo?: number;
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean; disabled?: boolean };
}) {
  const s = React.useRef(new Animated.Value(1)).current;
  const down = () => Animated.timing(s, { toValue: scaleTo, duration: 90, useNativeDriver: true }).start();
  const up = () => Animated.timing(s, { toValue: 1, duration: 160, useNativeDriver: true }).start();
  return (
    <Animated.View
      style={[style, { transform: [{ scale: s }] }]}
      onStartShouldSetResponder={() => true}
      onResponderGrant={down}
      onResponderRelease={() => {
        up();
        onPress?.();
      }}
      onResponderTerminate={up}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
    >
      {children}
    </Animated.View>
  );
}

export function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const v = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const t = Animated.timing(v, { toValue: 1, duration: 420, delay, useNativeDriver: true });
    t.start();
    return () => t.stop();
  }, []);
  const ty = v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  return <Animated.View style={{ opacity: v, transform: [{ translateY: ty }] }}>{children}</Animated.View>;
}

/* ---------- page scaffolding ---------- */

export function Page({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.pageOuter}>
      <View style={styles.pageInner}>{children}</View>
    </View>
  );
}

/**
 * Scrollable page that keeps the focused input above the keyboard.
 * Android uses system "pan" mode; iOS gets JS keyboard-aware scrolling;
 * the browser handles it on web. The floating tab bar never moves.
 */
export function ScrollPage({ children }: { children: React.ReactNode }) {
  const scrollRef = React.useRef<ScrollView>(null);
  const scrollY = React.useRef(0);
  const kb = React.useRef(0);

  const ensureVisible = () => {
    const r = lastFieldRect();
    if (!r || kb.current <= 0) return;
    const screenH = Dimensions.get('window').height;
    const visibleBottom = screenH - kb.current - 60;
    const need = r.y + r.h - visibleBottom;
    if (need > 0) scrollRef.current?.scrollTo({ y: scrollY.current + need + 10, animated: true });
  };

  React.useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      kb.current = e.endCoordinates.height;
      ensureVisible();
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      kb.current = 0;
    });
    onFieldFocus(ensureVisible);
    return () => {
      show.remove();
      hide.remove();
      onFieldFocus(null);
    };
  }, []);

  return (
    <View style={styles.pageOuter}>
      <View style={[styles.pageInner, { overflow: 'hidden' }]}>
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          onScroll={(e) => {
            scrollY.current = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <FadeIn>{children}</FadeIn>
        </ScrollView>
      </View>
    </View>
  );
}

/* ---------- blue header ---------- */

export function BlueHeader(props: {
  title: string;
  sub?: string;
  menu?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[C.headerTop, C.headerBottom]}
      start={[0, 0]}
      end={[1, 1]}
      style={[styles.header, { paddingTop: insets.top + 10 }]}
    >
      {props.menu ? (
        <Press onPress={props.onBack} style={styles.headerBtn} scaleTo={0.88}>
          <MaterialCommunityIcons name="menu" size={26} color="#fff" />
        </Press>
      ) : props.onBack ? (
        <Press onPress={props.onBack} style={styles.headerBtn} scaleTo={0.88}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </Press>
      ) : null}
      <View style={{ flex: 1 }}>
        <T style={styles.headerTitle} numberOfLines={1}>
          {props.title}
        </T>
        {!!props.sub && (
          <T style={styles.headerSub} numberOfLines={1}>
            {props.sub}
          </T>
        )}
      </View>
      <View style={styles.headerRight}>{props.right}</View>
    </LinearGradient>
  );
}

export function HeaderIconBtn({ icon, badge, onPress }: { icon: string; badge?: number; onPress?: () => void }) {
  return (
    <Press onPress={onPress} style={styles.headerBtn} scaleTo={0.86}>
      <MaterialCommunityIcons name={icon as any} size={23} color="#fff" />
      {badge ? (
        <View style={styles.badge}>
          <T style={styles.badgeText}>{badge}</T>
        </View>
      ) : null}
    </Press>
  );
}

export function HeaderWhiteBtn({ label, icon, onPress }: { label: string; icon?: string; onPress?: () => void }) {
  return (
    <Press onPress={onPress} style={styles.headerWhiteBtn}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {!!icon && <MaterialCommunityIcons name={icon as any} size={16} color={C.primary} />}
        <T style={styles.headerWhiteBtnText}>{label}</T>
      </View>
    </Press>
  );
}

/* ---------- cards & stats ---------- */

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function IconBubble({ icon, tone, size = 40, iconSize = 20 }: { icon: string; tone: Tone; size?: number; iconSize?: number }) {
  const t = toneColor[tone];
  return (
    <View style={[styles.bubble, { width: size, height: size, borderRadius: size / 2, backgroundColor: t.bg }]}>
      <MaterialCommunityIcons name={icon as any} size={iconSize} color={t.fg} />
    </View>
  );
}

export function DashStat({ icon, tone, label, value, foot }: { icon: string; tone: Tone; label: string; value: string; foot: string }) {
  return (
    <View style={styles.dashStat}>
      <View style={styles.row}>
        <IconBubble icon={icon} tone={tone} size={34} iconSize={17} />
        <T style={styles.dashStatLabel} numberOfLines={2}>
          {label}
        </T>
      </View>
      <View style={[styles.row, { justifyContent: 'space-between', marginTop: 8 }]}>
        <T style={styles.dashStatValue} numberOfLines={1}>
          {value}
        </T>
        <View style={[styles.miniChev, { backgroundColor: toneColor[tone].bg }]}>
          <MaterialCommunityIcons name="chevron-right" size={12} color={toneColor[tone].fg} />
        </View>
      </View>
      <T style={styles.dashStatFoot} numberOfLines={1}>
        {foot}
      </T>
    </View>
  );
}

export function MiniStat({ icon, tone, value, label }: { icon: string; tone: Tone; value: string; label: string }) {
  return (
    <View style={styles.miniStat}>
      <IconBubble icon={icon} tone={tone} size={28} iconSize={15} />
      <T style={styles.miniStatValue} numberOfLines={1}>
        {value}
      </T>
      <T style={styles.miniStatLabel} numberOfLines={2}>
        {label}
      </T>
    </View>
  );
}

export function Avatar({ initials, tone, size = 44 }: { initials: string; tone: Tone; size?: number }) {
  const t = toneColor[tone];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
      <T style={{ color: t.fg, fontWeight: '700', fontSize: size * 0.36 }}>{initials}</T>
    </View>
  );
}

export function SectionHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={[styles.row, { justifyContent: 'space-between', marginVertical: 10 }]}>
      <T style={styles.sectionTitle}>{title}</T>
      {!!action && (
        <Press onPress={onAction} style={{ paddingHorizontal: 4, paddingVertical: 2 }}>
          <T style={styles.linkText}>{action}</T>
        </Press>
      )}
    </View>
  );
}

/* ---------- inputs ---------- */

export function Field(props: {
  label: string;
  required?: boolean;
  placeholder: string;
  icon?: string;
  right?: React.ReactNode;
  disabled?: boolean;
  multiline?: boolean;
  value?: string;
  onChange?: (v: string) => void;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address' | 'number-pad';
}) {
  return (
    <View style={{ flexBasis: '46%', flexGrow: 1, minWidth: 0 }}>
      <T style={styles.fieldLabel}>
        {props.label}
        {props.required ? <T style={{ color: C.red }}> *</T> : null}
      </T>
      <View style={[styles.fieldBox, props.multiline && { minHeight: 74 }, props.disabled && { backgroundColor: '#F5F7FB' }]}>
        {!!props.icon && <MaterialCommunityIcons name={props.icon as any} size={15} color={C.faint} style={{ marginRight: 4 }} />}
        <TextInput
          style={[styles.fieldInput, props.multiline && { minHeight: 66, textAlignVertical: 'top' }]}
          placeholder={props.placeholder}
          placeholderTextColor={C.faint}
          selectionColor={C.primary}
          multiline={props.multiline}
          editable={!props.disabled}
          value={props.value}
          onChangeText={props.onChange}
          keyboardType={props.keyboardType}
          {...fieldFocusProps()}
        />
        {props.right}
      </View>
    </View>
  );
}

export function SearchBar({
  placeholder,
  right,
  value,
  onChangeText,
  compact = false,
}: {
  placeholder: string;
  right?: React.ReactNode;
  value?: string;
  onChangeText?: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.searchBox, compact && styles.searchBoxCompact]}>
      <MaterialCommunityIcons name="magnify" size={compact ? 15 : 17} color={C.faint} />
      <TextInput
        style={[styles.searchInput, compact && styles.searchInputCompact]}
        placeholder={placeholder}
        placeholderTextColor={C.faint}
        selectionColor={C.primary}
        value={value}
        onChangeText={onChangeText}
        {...fieldFocusProps()}
      />
      {right}
    </View>
  );
}

export function SquareBtn({ icon, onPress }: { icon: string; onPress?: () => void }) {
  return (
    <Press style={styles.squareBtn} onPress={onPress} scaleTo={0.9}>
      <MaterialCommunityIcons name={icon as any} size={18} color={C.sub} />
    </Press>
  );
}

/* ---------- buttons ---------- */

export function PrimaryBtn({ label, icon, onPress, style }: { label: string; icon?: string; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Press style={[styles.primaryBtn, style]} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        {!!icon && <MaterialCommunityIcons name={icon as any} size={18} color="#fff" style={{ marginRight: 4 }} />}
        <T style={styles.primaryBtnText}>{label}</T>
      </View>
    </Press>
  );
}

export function OutlineBtn({ label, icon, onPress, style }: { label: string; icon?: string; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Press style={[styles.outlineBtn, style]} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        {!!icon && <MaterialCommunityIcons name={icon as any} size={17} color={C.primary} style={{ marginRight: 4 }} />}
        <T style={styles.outlineBtnText}>{label}</T>
      </View>
    </Press>
  );
}

export function SmallOutlineBtn({ label, icon, onPress }: { label: string; icon?: string; onPress?: () => void }) {
  return (
    <Press style={styles.smallOutlineBtn} onPress={onPress} scaleTo={0.93}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {!!icon && <MaterialCommunityIcons name={icon as any} size={14} color={C.primary} />}
        <T style={styles.smallOutlineBtnText}>{label}</T>
      </View>
    </Press>
  );
}

export function Chevron() {
  return <MaterialCommunityIcons name="chevron-right" size={18} color={C.faint} />;
}

/* ---------- misc ---------- */

export function SegTabs({ tabs, active, onChange }: { tabs: string[]; active: number; onChange?: (i: number) => void }) {
  return (
    <View style={styles.segRow}>
      {tabs.map((t, i) => (
        <Press key={t} style={[styles.segItem, i === active && { backgroundColor: C.primary, borderRadius: 4 }]} onPress={() => onChange?.(i)}>
          <T style={[styles.segText, i === active && { color: '#fff', fontWeight: '700' }]}>{t}</T>
        </Press>
      ))}
    </View>
  );
}

export function StepIndicator({ current }: { current: number }) {
  const steps = ['Patient & Test', 'Report Values', 'Preview & Save'];
  return (
    <View style={[styles.row, { paddingHorizontal: PAGE_GUTTER, paddingVertical: 10, justifyContent: 'center' }]}>
      {steps.map((s, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <React.Fragment key={s}>
            <View style={styles.row}>
              <View style={[styles.stepCircle, (done || active) && { backgroundColor: C.primary }]}>
                {done ? (
                  <MaterialCommunityIcons name="check" size={13} color="#fff" />
                ) : (
                  <T style={{ color: active ? '#fff' : C.sub, fontWeight: '700', fontSize: 12 }}>{n}</T>
                )}
              </View>
              <T style={[styles.stepLabel, (done || active) && { color: C.primary, fontWeight: '700' }]} numberOfLines={1}>
                {s}
              </T>
            </View>
            {n < 3 && <View style={styles.stepLine} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

export function InfiniteListFooter({
  loading,
  hasMore,
  count,
}: {
  loading: boolean;
  hasMore: boolean;
  count: number;
}) {
  if (loading) {
    return (
      <View style={styles.listFooter}>
        <ActivityIndicator size="small" color={C.primary} />
        <T style={styles.listFooterText}>Loading more…</T>
      </View>
    );
  }

  if (count > 0 && !hasMore) {
    return (
      <View style={styles.listFooter}>
        <MaterialCommunityIcons name="check-circle-outline" size={15} color={C.green} />
        <T style={styles.listFooterText}>All records loaded</T>
      </View>
    );
  }

  return <View style={styles.listFooterSpacer} />;
}

export function StatusPill({ status }: { status: string }) {
  const paid = status === 'Completed' || status === 'Paid';
  return <T style={{ color: paid ? C.green : status === 'Cancelled' ? C.red : '#F59E0B', fontSize: 11, fontWeight: '600' }}>{status}</T>;
}

const styles = StyleSheet.create({
  pageOuter: { flex: 1, backgroundColor: C.bg },
  pageInner: {
    flex: 1,
    width: '100%',
    maxWidth: MAXW,
    alignSelf: 'center',
    backgroundColor: C.bg,
  },
  scrollView: { flex: 1, backgroundColor: C.headerTop },
  scrollContent: { paddingBottom: 110, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAGE_GUTTER,
    paddingBottom: 12,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: S.h2, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.82)', fontSize: S.small, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: C.red,
    borderRadius: 4,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  headerWhiteBtn: {
    backgroundColor: '#fff',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerWhiteBtnText: { color: C.primary, fontWeight: '700', fontSize: 12.5 },
  card: {
    backgroundColor: C.card,
    borderRadius: R.card,
    borderWidth: 1,
    borderColor: C.border,
    padding: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  bubble: { alignItems: 'center', justifyContent: 'center' },
  dashStat: {
    backgroundColor: C.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    padding: 8,
    flexBasis: '30%',
    flexGrow: 1,
  },
  dashStatLabel: { fontSize: 11, color: C.text, fontWeight: '600', marginLeft: 4, flex: 1 },
  dashStatValue: { fontSize: 17, fontWeight: '800', color: C.text },
  dashStatFoot: { fontSize: 10.5, color: C.faint, marginTop: 6 },
  miniChev: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  miniStat: {
    flexBasis: '22%',
    flexGrow: 1,
    backgroundColor: C.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 5,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  miniStatValue: { fontSize: 14, fontWeight: '800', color: C.text, marginTop: 4 },
  miniStatLabel: { fontSize: 9, lineHeight: 11, color: C.faint, marginTop: 1, textAlign: 'center' },
  sectionTitle: { fontSize: S.h3, fontWeight: '700', color: C.text },
  linkText: { fontSize: 12, color: C.primary, fontWeight: '600' },
  fieldLabel: { fontSize: 11.5, fontWeight: '600', color: C.text, marginBottom: 6 },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.field,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  fieldInput: { flex: 1, fontSize: 12.5, color: C.text, paddingVertical: 10, fontFamily: F.regular },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    paddingHorizontal: 8,
  },
  searchInput: { flex: 1, fontSize: 12.5, color: C.text, paddingVertical: 12, marginLeft: 4, fontFamily: F.regular },
  searchBoxCompact: { flex: 0, width: '100%', height: 28, paddingHorizontal: 6 },
  searchInputCompact: { height: 26, fontSize: 11, paddingVertical: 0 },
  squareBtn: {
    width: 44,
    height: 44,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  primaryBtn: {
    backgroundColor: C.primary,
    borderRadius: 4,
    paddingVertical: 13,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  outlineBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.primary,
    borderRadius: 4,
    paddingVertical: 13,
  },
  outlineBtnText: { color: C.primary, fontWeight: '700', fontSize: 13.5 },
  smallOutlineBtn: {
    borderWidth: 1,
    borderColor: '#CFE0FB',
    backgroundColor: '#F7FAFF',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  smallOutlineBtnText: { color: C.primary, fontSize: 11.5, fontWeight: '700' },
  segRow: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  segItem: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  segText: { fontSize: 12, color: C.sub, fontWeight: '600' },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E5E9F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: { fontSize: 11.5, color: C.sub, marginLeft: 4, maxWidth: 92 },
  stepLine: { flex: 1, height: 2, backgroundColor: '#E2E7F0', marginHorizontal: 4, minWidth: 12 },
  listFooter: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
  },
  listFooterText: { color: C.sub, fontSize: 11, fontWeight: '600' },
  listFooterSpacer: { height: 12 },
});
