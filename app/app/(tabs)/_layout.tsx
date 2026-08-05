import React from 'react';
import { Tabs, router } from 'expo-router';
import { View, Pressable, StyleSheet } from 'react-native';
import { Home, Users, FileText, MoreHorizontal, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '@/lib/theme';

function Fab() {
  return (
    <Pressable
      style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }]}
      onPress={() => router.push('/create-report' as any)}
    >
      <Plus size={24} color="#FFFFFF" strokeWidth={3} />
    </Pressable>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Flat bar: hairline top border, no elevation/shadow, no overlap.
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: { fontSize: 10, fontFamily: fonts.semibold, marginTop: 3 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <Home size={20} color={color} /> }} />
      <Tabs.Screen name="patients" options={{ title: 'Patients', tabBarIcon: ({ color }) => <Users size={20} color={color} /> }} />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: () => <Fab />,
          tabBarButton: (props) => <View style={styles.fabSlot}>{props.children}</View>,
        }}
      />
      <Tabs.Screen name="reports" options={{ title: 'Reports', tabBarIcon: ({ color }) => <FileText size={20} color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ color }) => <MoreHorizontal size={20} color={color} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabSlot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Sits inside the bar (no negative margin) so it can never overlap content.
  fab: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
