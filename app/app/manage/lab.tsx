import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Building, Phone, Mail, MapPin } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import { Card, FadeIn } from '@/components/UI';
import { colors, fonts, spacing } from '@/lib/theme';
import { lab } from '@/lib/labData';

export default function LabProfile() {
  const rows = [
    { Icon: Building, label: 'Lab name', value: lab.name },
    { Icon: MapPin, label: 'Address', value: lab.address },
    { Icon: Phone, label: 'Phone', value: lab.phone },
    { Icon: Mail, label: 'Email', value: lab.email },
  ];
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Lab Profile" subtitle={lab.labId} left={<ChevronLeft size={24} color="#FFFFFF" />} onLeftPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body}>
        <FadeIn>
          <Card>
            {rows.map((r) => (
              <View key={r.label} style={styles.row}>
                <r.Icon size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{r.label}</Text>
                  <Text style={styles.value}>{r.value}</Text>
                </View>
              </View>
            ))}
          </Card>
        </FadeIn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: spacing.hPad, paddingTop: 8, paddingBottom: 32 },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { fontFamily: fonts.medium, fontSize: 10, color: colors.mutedForeground },
  value: { fontFamily: fonts.semibold, fontSize: 13, color: colors.foreground, marginTop: 2 },
});
