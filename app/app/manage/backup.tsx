import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, DatabaseBackup } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import { Card, FadeIn } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';

export default function BackupScreen() {
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Data Backup" left={<ChevronLeft size={24} color="#FFFFFF" />} onLeftPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body}>
        <FadeIn>
          <Card>
            <Text style={styles.p}>Server data is stored in MongoDB when connected, otherwise in the API memory store. Restarting the API without Mongo clears in-memory records.</Text>
            <Pressable style={styles.btn}>
              <DatabaseBackup size={16} color="#fff" />
              <Text style={styles.btnText}>Backup is automatic on server</Text>
            </Pressable>
          </Card>
        </FadeIn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: spacing.hPad, paddingTop: 8 },
  p: { fontFamily: fonts.regular, fontSize: 13, color: colors.mutedForeground, lineHeight: 20 },
  btn: { marginTop: 14, height: 46, backgroundColor: colors.primary, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { color: '#fff', fontFamily: fonts.bold, fontSize: 13 },
});
