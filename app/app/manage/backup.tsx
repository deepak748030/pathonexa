import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, CloudUpload } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import { Card, FadeIn } from '@/components/UI';
import { colors, fonts, radius } from '@/lib/theme';

export default function BackupScreen() {
  return (
    <AppScreen header={<ScreenHeader title="Data Backup" left={<ChevronLeft size={24} color="#FFFFFF" />} onLeftPress={() => router.back()} />}>
      <FadeIn>
        <Card>
          <Text style={styles.p}>Automatic cloud backup when MongoDB is connected. Manual restore is available from the lab admin panel. In-memory demo data resets when the API restarts.</Text>
          <Pressable style={styles.btn}>
            <CloudUpload size={16} color="#fff" />
            <Text style={styles.btnText}>Backup is automatic on server</Text>
          </Pressable>
        </Card>
      </FadeIn>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  p: { fontFamily: fonts.regular, fontSize: 13, color: colors.mutedForeground, lineHeight: 20 },
  btn: { marginTop: 14, height: 46, backgroundColor: colors.primary, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { color: '#fff', fontFamily: fonts.bold, fontSize: 13 },
});
