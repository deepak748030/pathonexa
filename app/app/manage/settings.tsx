import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import { Card, FadeIn } from '@/components/UI';
import { colors, fonts } from '@/lib/theme';

export default function SettingsScreen() {
  const [print, setPrint] = React.useState(true);
  const [notify, setNotify] = React.useState(true);
  return (
    <AppScreen header={<ScreenHeader title="Settings" subtitle="General app preferences" left={<ChevronLeft size={24} color="#FFFFFF" />} onLeftPress={() => router.back()} />}>
        <FadeIn>
          <Card>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Auto-print reports</Text>
                <Text style={styles.sub}>Open print dialog after generating</Text>
              </View>
              <Switch value={print} onValueChange={setPrint} trackColor={{ true: colors.primary }} />
            </View>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Push notifications</Text>
                <Text style={styles.sub}>Pending reports and payments</Text>
              </View>
              <Switch value={notify} onValueChange={setNotify} trackColor={{ true: colors.primary }} />
            </View>
          </Card>
        </FadeIn>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontFamily: fonts.semibold, fontSize: 13, color: colors.foreground },
  sub: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
});
