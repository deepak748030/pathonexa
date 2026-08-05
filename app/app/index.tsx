import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';

export default function Index() {
  const { mobile, ready, hydrate } = useAuth();

  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <Redirect href={mobile ? '/(tabs)' : '/login'} />;
}
