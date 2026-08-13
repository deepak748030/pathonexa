import React from 'react';
import { Tabs, router } from 'expo-router';
import { View, Pressable, StyleSheet, Text, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { LayoutDashboard, Users, FileBarChart, Ellipsis, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, fonts, radius } from '@/lib/theme';

const ICONS: Record<string, typeof LayoutDashboard> = {
  index: LayoutDashboard,
  patients: Users,
  reports: FileBarChart,
  more: Ellipsis,
};
const LABELS: Record<string, string> = {
  index: 'Home',
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
    Animated.spring(v, { toValue: focused ? 1 : 0, useNativeDriver: true, friction: 7, tension: 120 }).start();
  }, [focused, v]);

  const color = focused ? colors.primary : '#94A3B8';

  return (
    <Pressable onPress={() => { tap(); onPress(); }} style={styles.item} hitSlop={4}>
      <Animated.View
        style={[
          styles.iconWrap,
          focused && styles.iconWrapActive,
          { transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) }] },
        ]}
      >
        <Icon size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} />
      </Animated.View>
      <Text style={[styles.label, { color }, focused && { fontFamily: fonts.bold }]} numberOfLines={1}>
        {LABELS[name]}
      </Text>
    </Pressable>
  );
}

function Fab() {
  const s = React.useRef(new Animated.Value(0)).current;
  const press = (to: number) =>
    Animated.timing(s, { toValue: to, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();

  return (
    <Pressable
      onPressIn={() => press(1)}
      onPressOut={() => press(0)}
      onPress={() => { tap(); router.push('/create-report' as any); }}
      style={styles.fabSlot}
    >
      <Animated.View style={{ transform: [{ scale: s.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] }) }] }}>
        <LinearGradient
          colors={[colors.primary, colors.primaryGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={2.8} />
        </LinearGradient>
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
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} insetBottom={insets.bottom} />}>
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
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
    paddingHorizontal: 4,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 2 },
  iconWrap: { width: 36, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  iconWrapActive: { backgroundColor: colors.primaryLight },
  label: { fontFamily: fonts.semibold, fontSize: 10, marginTop: 2 },
  fabSlot: { width: 64, alignItems: 'center', justifyContent: 'flex-start', marginTop: -18 },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
});
