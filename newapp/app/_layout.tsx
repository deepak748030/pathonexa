import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DrawerProvider } from '../components/Drawer';
import { C } from '../src/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DrawerProvider>
        <StatusBar style="light" backgroundColor={C.headerTop} translucent={false} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: C.bg },
          }}
        />
      </DrawerProvider>
    </SafeAreaProvider>
  );
}
