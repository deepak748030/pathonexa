import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router, useSegments } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';

const OPEN = new Set(['login', 'index']);

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { mobile, ready, hydrate } = useAuth();
  const segments = useSegments();

  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  React.useEffect(() => {
    if (!ready) return;
    const root = segments[0] as string | undefined;
    const open = !root || OPEN.has(root);
    if (!mobile && !open) router.replace('/login');
    if (mobile && root === 'login') router.replace('/(tabs)');
  }, [mobile, ready, segments]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}
