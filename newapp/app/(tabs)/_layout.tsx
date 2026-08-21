// Bottom tab bar with centered FAB — per UI PDF
import React from 'react';
import { T } from '../../components/T';
import { Animated, View, StyleSheet, Keyboard, Platform } from 'react-native';
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

type AnimatedTabItemProps = {
  label: string;
  icon: { active: string; inactive: string };
  focused: boolean;
  onPress: () => void;
};

function AnimatedTabItem({ label, icon, focused, onPress }: AnimatedTabItemProps) {
  const progress = React.useRef(new Animated.Value(focused ? 1 : 0)).current;

  React.useEffect(() => {
    const animation = Animated.spring(progress, {
      toValue: focused ? 1 : 0,
      stiffness: 280,
      damping: 21,
      mass: 0.72,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [focused, progress]);

  const iconScale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  const iconLift = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
  const labelLift = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const labelOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0.76, 1] });
  const indicatorScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] });

  return (
    <Press
      accessibilityLabel={`${label} tab`}
      accessibilityState={{ selected: focused }}
      style={styles.tab}
      scaleTo={0.91}
      onPress={onPress}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.activeIndicator,
          { opacity: progress, transform: [{ scaleX: indicatorScale }] },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.iconStage,
          { transform: [{ translateY: iconLift }, { scale: iconScale }] },
        ]}
      >
        <Animated.View style={[styles.iconHalo, { opacity: progress }]} />
        <MaterialCommunityIcons
          name={(focused ? icon.active : icon.inactive) as any}
          size={21}
          color={focused ? C.primary : '#93A0B4'}
        />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={{ opacity: labelOpacity, transform: [{ translateY: labelLift }] }}
      >
        <T style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</T>
      </Animated.View>
    </Press>
  );
}

function Fab() {
  const router = useRouter();
  const entrance = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.spring(entrance, {
      toValue: 1,
      stiffness: 240,
      damping: 18,
      mass: 0.78,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [entrance]);

  const scale = entrance.interpolate({ inputRange: [0, 1], outputRange: [0.76, 1] });
  const rotate = entrance.interpolate({ inputRange: [0, 1], outputRange: ['-35deg', '0deg'] });

  return (
    <Press
      accessibilityLabel="Create report"
      style={styles.fabSlot}
      onPress={() => router.push('/create-report')}
      scaleTo={0.9}
    >
      <Animated.View style={[styles.fab, { transform: [{ scale }, { rotate }] }]}>
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </Animated.View>
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
      <AnimatedTabItem
        key={route.name}
        label={TAB_LABELS[route.name]}
        icon={ic}
        focused={focused}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        }}
      />,
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
  tab: {
    flex: 1,
    minHeight: 39,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  activeIndicator: {
    position: 'absolute',
    top: -7,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.primary,
  },
  iconStage: {
    width: 32,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHalo: {
    position: 'absolute',
    width: 32,
    height: 24,
    borderRadius: 4,
    backgroundColor: C.blueSoft,
  },
  tabLabel: { fontSize: 10.5, color: '#93A0B4', fontWeight: '600' },
  tabLabelActive: { color: C.primary, fontWeight: '700' },
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
