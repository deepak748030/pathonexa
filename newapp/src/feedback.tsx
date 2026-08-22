// Global feedback UI — replaces `Alert.alert` everywhere with a polished,
// animated bottom sheet (success / error / warning / info) plus a non-blocking
// toast. Works on web + native + Expo Go with zero extra native dependencies:
// the icons are animated with React Native's `Animated` spring + pulse (the
// same primitive already used across this codebase), so there is no reanimated
// v4 / worklets version-mismatch risk inside Expo Go.
import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { T } from '../components/T';
import { C, F } from './theme';

export type FeedbackKind = 'success' | 'error' | 'warning' | 'info';

export interface ToastInput {
  kind?: FeedbackKind;
  title: string;
  message?: string;
  /** Milliseconds before the toast dismisses itself. */
  durationMs?: number;
}

export interface ConfirmInput {
  kind?: FeedbackKind;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface ActionItem {
  label: string;
  icon?: string;
  destructive?: boolean;
  onPress?: () => void | Promise<void>;
}

export interface ActionSheetInput {
  title: string;
  message?: string;
  actions: ActionItem[];
}

export interface PromptInput {
  title: string;
  message?: string;
  placeholder?: string;
  initialValue?: string;
  /** Submit label (defaults to "Done"). */
  submitText?: string;
  onSubmit: (value: string) => void | Promise<void>;
}

export interface FeedbackApi {
  toast: (input: ToastInput) => void;
  confirm: (input: ConfirmInput) => void;
  actionSheet: (input: ActionSheetInput) => void;
  prompt: (input: PromptInput) => void;
}

const VARIANTS: Record<FeedbackKind, { icon: string; fg: string; bg: string; ring: string }> = {
  success: { icon: 'check-circle', fg: '#16A34A', bg: '#E6F6EC', ring: '#16A34A' },
  error: { icon: 'close-circle', fg: '#EF4444', bg: '#FDEBEC', ring: '#EF4444' },
  warning: { icon: 'alert', fg: '#F59E0B', bg: '#FEF3E0', ring: '#F59E0B' },
  info: { icon: 'information', fg: '#1467E8', bg: '#E8F0FE', ring: '#1467E8' },
};

const useNative = Platform.OS !== 'web';

/** Spring-pop icon with a soft expanding pulse ring — the "animated icon". */
function AnimatedFeedbackIcon({ kind, size = 58 }: { kind: FeedbackKind; size?: number }) {
  const scale = React.useRef(new Animated.Value(0)).current;
  const pulse = React.useRef(new Animated.Value(0)).current;
  const v = VARIANTS[kind];

  React.useEffect(() => {
    scale.setValue(0);
    pulse.setValue(0);
    Animated.spring(scale, { toValue: 1, useNativeDriver: useNative, friction: 5, tension: 130 }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: useNative }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: useNative }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [kind, scale, pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: v.ring,
          opacity: ringOpacity,
          transform: [{ scale: ringScale }],
        }}
      />
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: v.bg,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale }],
        }}
      >
        <MaterialCommunityIcons name={v.icon as any} size={Math.round(size * 0.5)} color={v.fg} />
      </Animated.View>
    </View>
  );
}

type SheetState =
  | { type: 'confirm'; kind: FeedbackKind; title: string; message?: string; confirmText: string; cancelText: string; destructive: boolean; onConfirm?: () => void | Promise<void>; onCancel?: () => void }
  | { type: 'sheet'; title: string; message?: string; actions: ActionItem[] }
  | { type: 'prompt'; title: string; message?: string; placeholder: string; initialValue: string; submitText: string; onSubmit: (value: string) => void | Promise<void> }
  | null;

const FeedbackContext = React.createContext<FeedbackApi | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = React.useState<ToastInput | null>(null);
  const [sheet, setSheet] = React.useState<SheetState>(null);
  const [busy, setBusy] = React.useState(false);

  // ── toast animation + auto-dismiss ────────────────────────────────────────
  const toastY = React.useRef(new Animated.Value(40)).current;
  const toastOpacity = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (!toast) return;
    toastY.setValue(40);
    toastOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(toastY, { toValue: 0, useNativeDriver: useNative, friction: 7, tension: 90 }),
      Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver: useNative }),
    ]).start();
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastY, { toValue: 20, duration: 200, useNativeDriver: useNative }),
        Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: useNative }),
      ]).start(({ finished }) => {
        if (finished) setToast(null);
      });
    }, toast.durationMs ?? 2800);
    return () => clearTimeout(timer);
  }, [toast, toastOpacity, toastY]);

  const closeSheet = React.useCallback(() => {
    setBusy(false);
    setSheet(null);
  }, []);

  const run = React.useCallback(async (fn?: () => void | Promise<void>) => {
    if (!fn) {
      closeSheet();
      return;
    }
    setBusy(true);
    try {
      await fn();
    } catch {
      // Callers handle their own errors (usually by showing a toast).
    } finally {
      setBusy(false);
      setSheet(null);
    }
  }, [closeSheet]);

  const api = React.useMemo<FeedbackApi>(() => ({
    toast: (input) => setToast(input),
    confirm: (input) => setSheet({
      type: 'confirm',
      kind: input.kind ?? (input.destructive ? 'warning' : 'info'),
      title: input.title,
      message: input.message,
      confirmText: input.confirmText ?? 'Confirm',
      cancelText: input.cancelText ?? 'Cancel',
      destructive: !!input.destructive,
      onConfirm: input.onConfirm,
      onCancel: input.onCancel,
    }),
    actionSheet: (input) => setSheet({ type: 'sheet', title: input.title, message: input.message, actions: input.actions }),
    prompt: (input) => setSheet({
      type: 'prompt',
      title: input.title,
      message: input.message,
      placeholder: input.placeholder ?? 'Type here…',
      initialValue: input.initialValue ?? '',
      submitText: input.submitText ?? 'Done',
      onSubmit: input.onSubmit,
    }),
  }), []);

  const toastKind = toast?.kind ?? 'info';
  const toastVariant = VARIANTS[toastKind];

  const sheetKind = sheet?.type === 'confirm' ? sheet.kind : 'info';
  const sheetVariant = VARIANTS[sheetKind];

  return (
    <FeedbackContext.Provider value={api}>
      {children}

      {/* Non-blocking toast (bottom) */}
      {toast ? (
        <View pointerEvents="box-none" style={styles.toastHost}>
          <Animated.View
            style={[
              styles.toast,
              { opacity: toastOpacity, transform: [{ translateY: toastY }] },
            ]}
            accessibilityRole="alert"
          >
            <View style={[styles.toastDot, { backgroundColor: toastVariant.fg }]} />
            <View style={styles.toastCopy}>
              <T style={styles.toastTitle}>{toast.title}</T>
              {!!toast.message && <T style={styles.toastMessage}>{toast.message}</T>}
            </View>
            <MaterialCommunityIcons name={toastVariant.icon as any} size={22} color={toastVariant.fg} />
          </Animated.View>
        </View>
      ) : null}

      {/* Modal bottom sheet (confirm / action sheet / prompt) */}
      <Modal
        visible={!!sheet}
        transparent
        animationType="fade"
        onRequestClose={busy ? undefined : closeSheet}
      >
        <Pressable style={styles.overlay} onPress={busy ? undefined : closeSheet}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />

            {sheet?.type === 'confirm' && (
              <View style={styles.confirmBody}>
                <AnimatedFeedbackIcon kind={sheet.kind} />
                <T style={styles.title}>{sheet.title}</T>
                {!!sheet.message && <T style={styles.message}>{sheet.message}</T>}
                <View style={styles.actionRow}>
                  <Pressable
                    disabled={busy}
                    onPress={() => { sheet.onCancel?.(); closeSheet(); }}
                    style={[styles.button, styles.buttonGhost]}
                  >
                    <T style={styles.buttonGhostText}>{sheet.cancelText}</T>
                  </Pressable>
                  <Pressable
                    disabled={busy}
                    onPress={() => run(sheet.onConfirm)}
                    style={[styles.button, sheet.destructive ? styles.buttonDanger : styles.buttonPrimary, busy && styles.buttonBusy]}
                  >
                    {busy ? <ActivityIndicator size="small" color="#fff" /> : <T style={styles.buttonPrimaryText}>{sheet.confirmText}</T>}
                  </Pressable>
                </View>
              </View>
            )}

            {sheet?.type === 'sheet' && (
              <View style={styles.confirmBody}>
                <T style={[styles.title, { marginBottom: 2 }]}>{sheet.title}</T>
                {!!sheet.message && <T style={styles.message}>{sheet.message}</T>}
                <ScrollView style={styles.sheetScroll} bounces={false} showsVerticalScrollIndicator={false}>
                  {sheet.actions.map((action, index) => (
                    <Pressable
                      key={`${action.label}-${index}`}
                      disabled={busy}
                      onPress={() => run(action.onPress)}
                      style={[styles.sheetAction, index > 0 && { borderTopWidth: 1, borderTopColor: C.borderSoft }]}
                    >
                      {!!action.icon && (
                        <View style={styles.sheetActionIcon}>
                          <MaterialCommunityIcons name={action.icon as any} size={18} color={action.destructive ? C.red : C.primary} />
                        </View>
                      )}
                      <T style={[styles.sheetActionLabel, action.destructive && { color: C.red }]}>{action.label}</T>
                      <MaterialCommunityIcons name="chevron-right" size={18} color={C.faint} />
                    </Pressable>
                  ))}
                </ScrollView>
                <View style={styles.actionRow}>
                  <Pressable disabled={busy} onPress={closeSheet} style={[styles.button, styles.buttonGhost, { flex: 1 }]}>
                    <T style={styles.buttonGhostText}>Cancel</T>
                  </Pressable>
                </View>
              </View>
            )}

            {sheet?.type === 'prompt' && <PromptSheet sheet={sheet} busy={busy} onClose={closeSheet} onSubmit={(value) => run(() => sheet.onSubmit(value))} />}
          </Pressable>
        </Pressable>
      </Modal>
    </FeedbackContext.Provider>
  );
}

function PromptSheet({
  sheet,
  busy,
  onClose,
  onSubmit,
}: {
  sheet: { title: string; message?: string; placeholder: string; initialValue: string; submitText: string };
  busy: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = React.useState(sheet.initialValue);
  return (
    <View style={styles.confirmBody}>
      <View style={styles.promptIcon}>
        <MaterialCommunityIcons name="magnify" size={22} color={C.primary} />
      </View>
      <T style={styles.title}>{sheet.title}</T>
      {!!sheet.message && <T style={styles.message}>{sheet.message}</T>}
      <TextInput
        autoFocus
        value={value}
        onChangeText={setValue}
        placeholder={sheet.placeholder}
        placeholderTextColor={C.faint}
        selectionColor={C.primary}
        onSubmitEditing={() => onSubmit(value)}
        style={styles.promptInput}
      />
      <View style={styles.actionRow}>
        <Pressable disabled={busy} onPress={onClose} style={[styles.button, styles.buttonGhost]}>
          <T style={styles.buttonGhostText}>Cancel</T>
        </Pressable>
        <Pressable disabled={busy} onPress={() => onSubmit(value)} style={[styles.button, styles.buttonPrimary, busy && styles.buttonBusy]}>
          {busy ? <ActivityIndicator size="small" color="#fff" /> : <T style={styles.buttonPrimaryText}>{sheet.submitText}</T>}
        </Pressable>
      </View>
    </View>
  );
}

export function useFeedback(): FeedbackApi {
  const context = React.useContext(FeedbackContext);
  if (!context) throw new Error('useFeedback must be used inside FeedbackProvider.');
  return context;
}

const styles = StyleSheet.create({
  toastHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 28,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    width: '92%',
    maxWidth: 480,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111B2E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  toastDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  toastCopy: { flex: 1, minWidth: 0 },
  toastTitle: { color: '#fff', fontSize: 13.5, fontWeight: '700' },
  toastMessage: { color: 'rgba(255,255,255,0.82)', fontSize: 12, marginTop: 2, lineHeight: 16 },

  overlay: { flex: 1, backgroundColor: 'rgba(9,20,40,0.55)', justifyContent: 'flex-end' },
  sheet: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: C.borderStrong, marginBottom: 8 },
  confirmBody: { alignItems: 'center', paddingTop: 6 },
  title: { color: C.text, fontSize: 17, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  message: { color: C.sub, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6, paddingHorizontal: 4 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 18, width: '100%' },
  button: { flex: 1, minHeight: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  buttonPrimary: { backgroundColor: C.primary },
  buttonDanger: { backgroundColor: C.red },
  buttonGhost: { backgroundColor: '#EEF2F9' },
  buttonBusy: { opacity: 0.75 },
  buttonPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  buttonGhostText: { color: C.sub, fontSize: 14, fontWeight: '700' },
  sheetScroll: { maxHeight: 340, width: '100%', marginTop: 12 },
  sheetAction: { minHeight: 52, flexDirection: 'row', alignItems: 'center' },
  sheetActionIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.primaryPale, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  sheetActionLabel: { flex: 1, color: C.text, fontSize: 14, fontWeight: '600' },
  promptIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.primaryPale, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  promptInput: {
    width: '100%',
    minHeight: 48,
    marginTop: 14,
    borderWidth: 1,
    borderColor: C.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: C.text,
    fontFamily: F.medium,
    fontSize: 14,
  },
});
