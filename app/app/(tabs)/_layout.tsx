import React from 'react';
import { Tabs, router } from 'expo-router';
import { View, Pressable, StyleSheet, Text, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { House, UsersRound, FileText, LayoutGrid, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, fonts, radius } from '@/lib/theme';

const ICONS: Record<string, typeof House> = {
  index: House,
  patients: UsersRound,
  reports: FileText,
  more: LayoutGrid,
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
    /* haptics not available (web) */
  }
}

/** Animated tab: icon + label lift, soft pill fills in behind the icon. */
function TabItem({ name, focused, onPress }: { name: string; focused: boolean; onPress: () => void }) {
  const Icon = ICONS[name];
  const v = React.useRef(new Animated.Value(focused ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(v, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 120,
    }).start();
  }, [focused, v]);

  const color = focused ? colors.primary : '#94A3B8';

  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={styles.item}
      hitSlop={4}
    >
      <Animated.View
        style={[
          styles.iconPill,
          {
            opacity: v,
            transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
          },
        ]}
      />
      <Animated.View
        style={{
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -1] }) },
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) },
          ],
        }}
      >
        <Icon
          size={21}
          color={color}
          strokeWidth={focused ? 2.4 : 1.9}
          fill={focused ? color : 'transparent'}
          fillOpacity={focused ? 0.18 : 0}
        />
      </Animated.View>
      <Text style={[styles.label, { color }, focused && { fontFamily: fonts.bold }]} numberOfLines={1}>
        {LABELS[name]}
      </Text>
    </Pressable>
  );
}

/** Center gradient FAB — rotates 90° and scales on press. */
function Fab() {
  const s = React.useRef(new Animated.Value(0)).current;
  const press = (to: number) =>
    Animated.timing(s, { toValue: to, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();

  return (
    <Pressable
      onPressIn={() => press(1)}
      onPressOut={() => press(0)}
      onPress={() => {
        tap();
        router.push('/create-report' as any);
      }}
      style={styles.fabSlot}
    >
      <Animated.View
        style={{
          transform: [
            { scale: s.interpolate({ inputRange: [0, 1], outputRange: [1, 0.88] }) },
            { rotate: s.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) },
          ],
        }}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Plus size={25} color="#FFFFFF" strokeWidth={3} />
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
        onPress={() => {
          if (!focused) navigation.navigate(r.name as never);
        }}
      />
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: insetBottom + 6 }]}>
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
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 7,
    // gap: 0 — items sit flush, separated only by the center FAB.
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  iconPill: {
    position: 'absolute',
    top: -1,
    width: 34,
    height: 26,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },
  label: { fontFamily: fonts.semibold, fontSize: 10, marginTop: 3 },
  fabSlot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fab: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
});
