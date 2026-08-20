import React from 'react';
import { Tabs, router } from 'expo-router';
import { View, Pressable, StyleSheet, Text, Animated, Easing, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Home, UserRound, ClipboardList, Ellipsis, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, fonts, tabShadow } from '@/lib/theme';

const ICONS: Record<string, typeof Home> = {
  index: Home,
  patients: UserRound,
  reports: ClipboardList,
  more: Ellipsis,
};
const LABELS: Record<string, string> = {
  index: 'Dashboard',
  patients: 'Patients',
  reports: 'Reports',
  more: 'More',
};

function tap() {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    /* web */
  }
}

function TabItem({ name, focused, onPress }: { name: string; focused: boolean; onPress: () => void }) {
  const Icon = ICONS[name];
  const v = React.useRef(new Animated.Value(focused ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(v, { toValue: focused ? 1 : 0, useNativeDriver: true, friction: 7, tension: 140 }).start();
  }, [focused, v]);

  const color = focused ? colors.primary : colors.tabInactive;

  return (
    <Pressable onPress={() => { tap(); onPress(); }} style={styles.item} hitSlop={6}>
      <Animated.View style={{ transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }}>
        <Icon
          size={22}
          color={color}
          fill={focused ? color : 'transparent'}
          strokeWidth={focused ? 2.4 : 1.9}
        />
      </Animated.View>
      <Text style={[styles.label, { color }, focused && styles.labelActive]} numberOfLines={1}>
        {LABELS[name]}
      </Text>
    </Pressable>
  );
}

function Fab() {
  const s = React.useRef(new Animated.Value(0)).current;
  const press = (to: number) =>
    Animated.timing(s, { toValue: to, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();

  return (
    <Pressable
      onPressIn={() => press(1)}
      onPressOut={() => press(0)}
      onPress={() => { tap(); router.push('/create-report' as any); }}
      style={styles.fabSlot}
    >
      <Animated.View style={[styles.fabHalo, { transform: [{ scale: s.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] }) }] }]}>
        <View style={styles.fab}>
          <Plus size={28} color="#FFFFFF" strokeWidth={2.8} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

function TabBar({ state, navigation, insetBottom }: BottomTabBarProps & { insetBottom: number }) {
  const routes = state.routes.filter((r) => r.name !== 'create');
  const left = routes.slice(0, 2);
  const right = routes.slice(2);

  const render = (r: (typeof routes)[number]) => {
    const focused = state.routes[state.index].key === r.key;
    return (
      <TabItem
        key={r.key}
        name={r.name}
        focused={focused}
        onPress={() => { if (!focused) navigation.navigate(r.name as never); }}
      />
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insetBottom, 8) }]}>
      {left.map(render)}
      <Fab />
      {right.map(render)}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} insetBottom={insets.bottom} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="patients" />
      <Tabs.Screen name="create" />
      <Tabs.Screen name="reports" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 8,
    paddingHorizontal: 6,
    ...tabShadow,
    ...(Platform.OS === 'web' ? { boxShadow: '0 -6px 24px rgba(15,23,42,0.08)' } as any : null),
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 4, gap: 3 },
  label: { fontFamily: fonts.medium, fontSize: 10.5, marginTop: 2 },
  labelActive: { fontFamily: fonts.bold },
  fabSlot: { width: 72, alignItems: 'center', justifyContent: 'flex-start', marginTop: -26 },
  fabHalo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
