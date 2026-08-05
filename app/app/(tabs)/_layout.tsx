import React from 'react';
import { Tabs, router } from 'expo-router';
import { View, Pressable, StyleSheet, Text, Animated, Easing } from 'react-native';
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

/** Animated tab: icon lifts + scales, pill fades in, label brightens. */
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
    <Pressable onPress={onPress} style={styles.item} hitSlop={4}>
      <Animated.View
        style={[
          styles.pill,
          {
            opacity: v,
            transform: [{ scaleX: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
          },
        ]}
      />
      <Animated.View
        style={{
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
          ],
        }}
      >
        <Icon
          size={20}
          color={color}
          strokeWidth={focused ? 2.3 : 1.9}
          fill={focused ? color : 'transparent'}
          fillOpacity={focused ? 0.2 : 0}
        />
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
      onPress={() => router.push('/create-report' as any)}
      style={styles.fabSlot}
    >
      <Animated.View
        style={[
          styles.fab,
          {
            transform: [
              { scale: s.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] }) },
              { rotate: s.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) },
            ],
          },
        ]}
      >
        <Plus size={24} color="#FFFFFF" strokeWidth={3} />
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
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  pill: {
    position: 'absolute',
    top: -7,
    width: 26,
    height: 2.5,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  label: { fontFamily: fonts.semibold, fontSize: 10 },
  fabSlot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fab: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
