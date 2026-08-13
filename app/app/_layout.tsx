import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  const [loaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-patient" />
        <Stack.Screen name="patient/[id]" />
        <Stack.Screen name="create-report" />
        <Stack.Screen name="report-preview" />
        <Stack.Screen name="manage/[slug]" />
        <Stack.Screen name="manage/lab" />
        <Stack.Screen name="manage/settings" />
        <Stack.Screen name="manage/help" />
        <Stack.Screen name="manage/about" />
        <Stack.Screen name="manage/backup" />
        <Stack.Screen name="menu" options={{ presentation: 'transparentModal', animation: 'fade' }} />
      </Stack>
      <StatusBar style="dark" backgroundColor={colors.background} translucent={true} />
    </SafeAreaProvider>
  );
}
