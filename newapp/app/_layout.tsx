import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import { DrawerProvider } from '../components/Drawer';
import { C, F } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded] = useFonts({
    [F.regular]: PlusJakartaSans_400Regular,
    [F.medium]: PlusJakartaSans_500Medium,
    [F.semibold]: PlusJakartaSans_600SemiBold,
    [F.bold]: PlusJakartaSans_700Bold,
    [F.extrabold]: PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const st = document.createElement('style');
    st.textContent =
      `html,body,#root{font-family:'${F.regular}',system-ui,-apple-system,'Segoe UI',sans-serif}` +
      `html,body{margin:0;min-height:100%;background:${C.headerTop};overscroll-behavior-y:none}` +
      `#root{min-height:100%;background:${C.bg}}` +
      `input,textarea,select,button{font-family:inherit}` +
      `input,textarea{caret-color:${C.primary}}`;
    document.head.appendChild(st);
    return () => st.remove();
  }, []);

  if (!loaded) return null;

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
