import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { AuthProvider, useAuth } from '../src/auth';
import { NotificationProvider } from '../src/notifications';
import { FeedbackProvider, useFeedback } from '../src/feedback';
import { C, F } from '../src/theme';
import { checkForPlayUpdates, openPlayStore } from '../src/updates';

SplashScreen.preventAutoHideAsync().catch(() => {});

const STATUS_BAR_EXTENSION = 4;

function PersistentStatusBarBackground() {
  const insets = useSafeAreaInsets();
  if (insets.top <= 0) return null;

  return (
    <View
      pointerEvents="none"
      style={[styles.statusBarBackground, { height: insets.top + STATUS_BAR_EXTENSION }]}
    />
  );
}

function AppNavigator() {
  const { isAuthenticated, isReady, needsOnboarding } = useAuth();
  const { confirm } = useFeedback();

  // In-app Google Play Store update check — once per launch, Android only.
  // Silent unless a newer version is actually published on the Play Store.
  useEffect(() => {
    if (!isAuthenticated || !isReady) return;
    let mounted = true;
    checkForPlayUpdates().then((check) => {
      if (!mounted || !check?.updateAvailable) return;
      confirm({
        kind: 'info',
        title: 'Update available',
        message: `Version ${check.latestVersion} of PathoNexa is on Google Play. Update now to keep your lab running smoothly.`,
        confirmText: 'Update now',
        cancelText: 'Later',
        onConfirm: () => openPlayStore(),
      });
    });
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, isReady, confirm]);

  if (!isReady) return <View style={styles.sessionLoading} />;

  return (
    <DrawerProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.bg },
          animation: 'fade',
        }}
      >
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="login" />
          <Stack.Screen name="verify-otp" />
        </Stack.Protected>
        {/* First-time users complete their name + email before entering the app. */}
        <Stack.Protected guard={isAuthenticated && needsOnboarding}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={isAuthenticated && !needsOnboarding}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="add-patient" />
          <Stack.Screen name="create-report" />
          <Stack.Screen name="report-preview" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="manage/[module]" />
          <Stack.Screen name="tests-packages" />
          <Stack.Screen name="data-backup" />
          <Stack.Screen name="deleted-records" />
          <Stack.Screen name="lab-profile" />
          <Stack.Screen name="help-support" />
          <Stack.Screen name="about-app" />
        </Stack.Protected>
      </Stack>
    </DrawerProvider>
  );
}

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

    let themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const createdThemeColor = !themeColor;
    const previousThemeColor = themeColor?.content;
    if (!themeColor) {
      themeColor = document.createElement('meta');
      themeColor.name = 'theme-color';
      document.head.appendChild(themeColor);
    }
    themeColor.content = C.headerTop;

    return () => {
      st.remove();
      if (createdThemeColor) themeColor.remove();
      else if (previousThemeColor) themeColor.content = previousThemeColor;
    };
  }, []);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={C.headerTop} translucent />
      <FeedbackProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppNavigator />
          </NotificationProvider>
        </AuthProvider>
      </FeedbackProvider>
      <PersistentStatusBarBackground />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  sessionLoading: { flex: 1, backgroundColor: C.bg },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: C.headerTop,
  },
});
