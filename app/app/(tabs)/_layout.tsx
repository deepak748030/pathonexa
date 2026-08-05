import React from 'react';
import { Tabs, router } from 'expo-router';
import { View, Pressable, StyleSheet } from 'react-native';
import { Home, Users, FileText, MoreHorizontal, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '@/lib/theme';

function Fab() {
  return (
    <Pressable style={styles.fab} onPress={() => router.push('/create-report' as any)}>
      <Plus size={26} color="#FFFFFF" strokeWidth={3} />
    </Pressable>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
          elevation: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: { fontSize: 10, fontFamily: fonts.semibold, marginTop: 2 },
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
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
});
