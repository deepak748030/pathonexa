import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import { Card, FadeIn } from '@/components/UI';
import { colors, fonts } from '@/lib/theme';

export default function AboutScreen() {
  return (
    <AppScreen header={<ScreenHeader title="About App" left={<ChevronLeft size={24} color="#FFFFFF" />} onLeftPress={() => router.back()} />}>
      <FadeIn>
        <Card>
          <Text style={styles.h}>PathoNexa</Text>
          <Text style={styles.p}>Version 1.0.0{'\n'}Pathology lab management — patients, reports, billing and referring doctors.</Text>
        </Card>
      </FadeIn>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  h: { fontFamily: fonts.bold, fontSize: 16, color: colors.foreground, marginBottom: 6 },
  p: { fontFamily: fonts.regular, fontSize: 13, color: colors.mutedForeground, lineHeight: 20 },
});
