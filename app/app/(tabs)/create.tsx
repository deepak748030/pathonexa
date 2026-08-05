import React, { useEffect } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { colors } from '@/lib/theme';

export default function CreateTab() {
  useFocusEffect(
    React.useCallback(() => {
      router.replace('/create-report' as any);
    }, [])
  );
  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}
