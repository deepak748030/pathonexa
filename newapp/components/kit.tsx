// PathoNexa newapp — reusable UI kit (written fresh for this app)
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, R, S, shadow } from '../src/theme';
import { toneColor, type Tone } from '../src/data';

export const MAXW = 520;

/* ---------- page scaffolding ---------- */

export function Page({ children, scroll = false }: { children: React.ReactNode; scroll?: boolean }) {
  return (
    <View style={styles.pageOuter}>
      <View style={styles.pageInner}>{children}</View>
    </View>
  );
}

export function ScrollPage({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.pageOuter}>
      <View style={[styles.pageInner, { overflow: 'hidden' }]}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 110 }}
        >
          {children}
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
        <TouchableOpacity onPress={props.onBack} style={styles.headerBtn} accessibilityLabel="Open menu">
          <MaterialCommunityIcons name="menu" size={26} color="#fff" />
        </TouchableOpacity>
      ) : props.onBack ? (
        <TouchableOpacity onPress={props.onBack} style={styles.headerBtn} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 40 }} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {props.title}
        </Text>
        {!!props.sub && (
          <Text style={styles.headerSub} numberOfLines={1}>
            {props.sub}
          </Text>
        )}
      </View>
      <View style={styles.headerRight}>{props.right}</View>
    </LinearGradient>
  );
}

export function HeaderIconBtn({ icon, badge, onPress }: { icon: string; badge?: number; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.headerBtn}>
      <MaterialCommunityIcons name={icon as any} size={23} color="#fff" />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export function HeaderWhiteBtn({ label, icon, onPress }: { label: string; icon?: string; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.headerWhiteBtn}>
      {!!icon && <MaterialCommunityIcons name={icon as any} size={16} color={C.primary} />}
      <Text style={styles.headerWhiteBtnText}>{label}</Text>
    </TouchableOpacity>
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
        <Text style={styles.dashStatLabel} numberOfLines={2}>
          {label}
        </Text>
      </View>
      <View style={[styles.row, { justifyContent: 'space-between', marginTop: 8 }]}>
        <Text style={styles.dashStatValue} numberOfLines={1}>
          {value}
        </Text>
        <View style={[styles.miniChev, { backgroundColor: toneColor[tone].bg }]}>
          <MaterialCommunityIcons name="chevron-right" size={12} color={toneColor[tone].fg} />
        </View>
      </View>
      <Text style={styles.dashStatFoot} numberOfLines={1}>
        {foot}
      </Text>
    </View>
  );
}

export function MiniStat({ icon, tone, value, label }: { icon: string; tone: Tone; value: string; label: string }) {
  return (
    <View style={styles.miniStat}>
      <IconBubble icon={icon} tone={tone} size={38} iconSize={19} />
      <Text style={styles.miniStatValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.miniStatLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

export function Avatar({ initials, tone, size = 44 }: { initials: string; tone: Tone; size?: number }) {
  const t = toneColor[tone];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: t.fg, fontWeight: '700', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

export function SectionHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={[styles.row, { justifyContent: 'space-between', marginVertical: 10 }]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.linkText}>{action}</Text>
        </TouchableOpacity>
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
}) {
  return (
    <View style={{ flexBasis: '46%', flexGrow: 1, minWidth: 0 }}>
      <Text style={styles.fieldLabel}>
        {props.label}
        {props.required ? <Text style={{ color: C.red }}> *</Text> : null}
      </Text>
      <View style={[styles.fieldBox, props.multiline && { minHeight: 74 }, props.disabled && { backgroundColor: '#F5F7FB' }]}>
        {!!props.icon && <MaterialCommunityIcons name={props.icon as any} size={15} color={C.faint} style={{ marginRight: 6 }} />}
        <TextInput
          style={[styles.fieldInput, props.multiline && { minHeight: 66, textAlignVertical: 'top' }]}
          placeholder={props.placeholder}
          placeholderTextColor={C.faint}
          multiline={props.multiline}
          editable={!props.disabled}
          value={props.value}
          onChangeText={props.onChange}
        />
        {props.right}
      </View>
    </View>
  );
}

export function SearchBar({ placeholder, right }: { placeholder: string; right?: React.ReactNode }) {
  return (
    <View style={styles.searchBox}>
      <MaterialCommunityIcons name="magnify" size={17} color={C.faint} />
      <TextInput style={styles.searchInput} placeholder={placeholder} placeholderTextColor={C.faint} />
      {right}
    </View>
  );
}

export function SquareBtn({ icon, onPress }: { icon: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.squareBtn} onPress={onPress}>
      <MaterialCommunityIcons name={icon as any} size={18} color={C.sub} />
    </TouchableOpacity>
  );
}

/* ---------- buttons ---------- */

export function PrimaryBtn({ label, icon, onPress, style }: { label: string; icon?: string; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <TouchableOpacity style={[styles.primaryBtn, style]} onPress={onPress}>
      {!!icon && <MaterialCommunityIcons name={icon as any} size={18} color="#fff" style={{ marginRight: 8 }} />}
      <Text style={styles.primaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function OutlineBtn({ label, icon, onPress, style }: { label: string; icon?: string; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <TouchableOpacity style={[styles.outlineBtn, style]} onPress={onPress}>
      {!!icon && <MaterialCommunityIcons name={icon as any} size={17} color={C.primary} style={{ marginRight: 8 }} />}
      <Text style={styles.outlineBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function SmallOutlineBtn({ label, icon, onPress }: { label: string; icon?: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.smallOutlineBtn} onPress={onPress}>
      {!!icon && <MaterialCommunityIcons name={icon as any} size={14} color={C.primary} />}
      <Text style={styles.smallOutlineBtnText}>{label}</Text>
    </TouchableOpacity>
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
        <TouchableOpacity key={t} style={[styles.segItem, i === active && { backgroundColor: C.primary, borderTopLeftRadius: 10, borderBottomLeftRadius: i === 0 ? 10 : 0, borderRadius: i === active ? 10 : 0 }]} onPress={() => onChange?.(i)}>
          <Text style={[styles.segText, i === active && { color: '#fff', fontWeight: '700' }]}>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function StepIndicator({ current }: { current: number }) {
  const steps = ['Patient & Test', 'Report Values', 'Preview & Save'];
  return (
    <View style={[styles.row, { paddingHorizontal: 18, paddingVertical: 14, justifyContent: 'center' }]}>
      {steps.map((s, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <React.Fragment key={s}>
            <View style={styles.row}>
              <View
                style={[
                  styles.stepCircle,
                  (done || active) && { backgroundColor: C.primary },
                ]}
              >
                {done ? (
                  <MaterialCommunityIcons name="check" size={13} color="#fff" />
                ) : (
                  <Text style={{ color: active ? '#fff' : C.sub, fontWeight: '700', fontSize: 12 }}>{n}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, (done || active) && { color: C.primary, fontWeight: '700' }]} numberOfLines={1}>
                {s}
              </Text>
            </View>
            {n < 3 && <View style={styles.stepLine} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

export function StatusPill({ status }: { status: string }) {
  const paid = status === 'Completed' || status === 'Paid';
  return <Text style={{ color: paid ? C.green : status === 'Cancelled' ? C.red : '#F59E0B', fontSize: 11, fontWeight: '600' }}>{status}</Text>;
}

const styles = StyleSheet.create({
  pageOuter: { flex: 1, backgroundColor: C.bg },
  pageInner: {
    flex: 1,
    width: '100%',
    maxWidth: MAXW,
    alignSelf: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E4E9F2',
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 16,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    ...shadow,
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
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  headerWhiteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    ...shadow,
  },
  headerWhiteBtnText: { color: C.primary, fontWeight: '700', fontSize: 12.5 },
  card: {
    backgroundColor: C.card,
    borderRadius: R.card,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    ...shadow,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  bubble: { alignItems: 'center', justifyContent: 'center' },
  dashStat: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 10,
    flexBasis: '30%',
    flexGrow: 1,
    ...shadow,
  },
  dashStatLabel: { fontSize: 11, color: C.text, fontWeight: '600', marginLeft: 7, flex: 1 },
  dashStatValue: { fontSize: 17, fontWeight: '800', color: C.text },
  dashStatFoot: { fontSize: 10.5, color: C.faint, marginTop: 6 },
  miniChev: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  miniStat: {
    flexBasis: '22%',
    flexGrow: 1,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    ...shadow,
  },
  miniStatValue: { fontSize: 16, fontWeight: '800', color: C.text, marginTop: 8 },
  miniStatLabel: { fontSize: 10, color: C.faint, marginTop: 3, textAlign: 'center' },
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
  fieldInput: { flex: 1, fontSize: 12.5, color: C.text, paddingVertical: 10 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    ...shadow,
  },
  searchInput: { flex: 1, fontSize: 12.5, color: C.text, paddingVertical: 12, marginLeft: 8 },
  squareBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    ...shadow,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.primary,
    borderRadius: 12,
    paddingVertical: 13,
  },
  outlineBtnText: { color: C.primary, fontWeight: '700', fontSize: 13.5 },
  smallOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#CFE0FB',
    backgroundColor: '#F7FAFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  smallOutlineBtnText: { color: C.primary, fontSize: 11.5, fontWeight: '700' },
  segRow: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F9',
    borderRadius: 10,
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
  stepLabel: { fontSize: 11.5, color: C.sub, marginLeft: 6, maxWidth: 92 },
  stepLine: { flex: 1, height: 2, backgroundColor: '#E2E7F0', marginHorizontal: 8, minWidth: 16 },
});
