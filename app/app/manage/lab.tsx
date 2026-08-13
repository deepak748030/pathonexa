import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Building, Phone, Mail, MapPin, UserRound } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import Field from '@/components/Field';
import { Card, FadeIn } from '@/components/UI';
import { colors, spacing } from '@/lib/theme';
import { lab } from '@/lib/labData';

export default function LabProfile() {
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Lab Profile" subtitle={lab.labId} left={<ChevronLeft size={24} color="#FFFFFF" />} onLeftPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body}>
        <FadeIn>
          <Card>
            <Field label="Lab name" value={lab.name} editable={false} icon={<Building size={16} color={colors.primary} />} />
            <Field label="Address" value={lab.address} editable={false} multiline icon={<MapPin size={16} color={colors.primary} />} />
            <Field label="Phone" value={lab.phone} editable={false} icon={<Phone size={16} color={colors.primary} />} />
            <Field label="Email" value={lab.email} editable={false} icon={<Mail size={16} color={colors.primary} />} />
            <Field label="Pathologist" value={lab.pathologist} editable={false} icon={<UserRound size={16} color={colors.primary} />} />
          </Card>
        </FadeIn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: spacing.hPad, paddingTop: 10, paddingBottom: 32 },
});
