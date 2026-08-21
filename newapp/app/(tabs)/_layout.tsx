// Bottom tab bar with centered FAB — per UI PDF
import React from 'react';
import { T } from '../../components/T';
import { View, StyleSheet, Keyboard, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { C } from '../../src/theme';
import { MAXW, Press } from '../../components/kit';

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  index: { active: 'home', inactive: 'home-outline' },
  patients: { active: 'account', inactive: 'account-outline' },
  reports: { active: 'clipboard-text', inactive: 'clipboard-text-outline' },
  more: { active: 'dots-horizontal', inactive: 'dots-horizontal' },
};
const TAB_LABELS: Record<string, string> = {
  index: 'Dashboard',
  patients: 'Patients',
  reports: 'Reports',
  more: 'More',
};

function Fab() {
  const router = useRouter();
  return (
    <Press style={styles.fabSlot} onPress={() => router.push('/create-report')} scaleTo={0.9}>
      <View style={styles.fab}>
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </View>
    </Press>
  );
}

function useKeyboardVisibility() {
  const [visible, setVisible] = React.useState(() => Platform.OS !== 'web' && Keyboard.isVisible());

  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const viewport = window.visualViewport;
      let baselineHeight = viewport?.height ?? window.innerHeight;

      const hasFocusedInput = () => {
        const active = document.activeElement as HTMLElement | null;
        return active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA' || active?.isContentEditable === true;
      };

      const update = () => {
        const currentHeight = viewport?.height ?? window.innerHeight;
        if (!hasFocusedInput()) {
          baselineHeight = currentHeight;
          setVisible(false);
          return;
        }

        const viewportOverlap = Math.max(0, window.innerHeight - currentHeight - (viewport?.offsetTop ?? 0));
        setVisible(Math.max(viewportOverlap, baselineHeight - currentHeight) > 100);
      };

      window.addEventListener('resize', update);
      document.addEventListener('focusin', update);
      document.addEventListener('focusout', update);
      viewport?.addEventListener('resize', update);
      viewport?.addEventListener('scroll', update);
      update();

      return () => {
        window.removeEventListener('resize', update);
        document.removeEventListener('focusin', update);
        document.removeEventListener('focusout', update);
        viewport?.removeEventListener('resize', update);
        viewport?.removeEventListener('scroll', update);
      };
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return visible;
}

function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisibility();

  if (keyboardVisible) return null;

  const items: React.ReactNode[] = [];
  state.routes.forEach((route, i) => {
    const focused = state.index === i;
    const ic = TAB_ICONS[route.name] ?? TAB_ICONS.index;
    items.push(
      <Press
        key={route.name}
        style={styles.tab}
        scaleTo={0.9}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        }}
      >
        <MaterialCommunityIcons name={(focused ? ic.active : ic.inactive) as any} size={21} color={focused ? C.primary : '#93A0B4'} />
        <T style={[styles.tabLabel, focused && { color: C.primary, fontWeight: '700' }]}>{TAB_LABELS[route.name]}</T>
      </Press>,
    );
    if (route.name === 'patients') items.push(<Fab key="fab" />);
  });
  return (
    <View style={[styles.barWrap, { paddingBottom: insets.bottom }]} pointerEvents="box-none">
      <View style={styles.bar}>{items}</View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="patients" />
      <Tabs.Screen name="reports" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  bar: {
    width: '100%',
    maxWidth: MAXW,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 7,
    paddingBottom: 7,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  tabLabel: { fontSize: 10.5, color: '#93A0B4', fontWeight: '600' },
  fabSlot: { flex: 1, alignItems: 'center', marginTop: -34 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
});
