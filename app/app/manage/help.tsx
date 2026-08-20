import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import { Card, FadeIn } from '@/components/UI';
import { colors, fonts } from '@/lib/theme';

export default function HelpScreen() {
  return (
    <AppScreen header={<ScreenHeader title="Help & Support" left={<ChevronLeft size={24} color="#FFFFFF" />} onLeftPress={() => router.back()} />}>
      <FadeIn>
        <Card>
          <Text style={styles.h}>Need help?</Text>
          <Text style={styles.p}>Email care@pathonexa.in or call +91 98765 43210. Demo OTP for login is 123456.</Text>
        </Card>
      </FadeIn>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  h: { fontFamily: fonts.bold, fontSize: 15, color: colors.foreground, marginBottom: 6 },
  p: { fontFamily: fonts.regular, fontSize: 13, color: colors.mutedForeground, lineHeight: 20 },
});
