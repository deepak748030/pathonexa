import React from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import LabLogo from '@/components/LabLogo';
import { colors, fonts } from '@/lib/theme';

export default function HeaderUser({ badge = 3 }: { badge?: number }) {
  return (
    <View style={styles.row}>
      <Pressable onPress={() => router.push('/notifications' as any)} hitSlop={8} style={styles.bell}>
        <Bell size={20} color="#FFFFFF" strokeWidth={2.1} />
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </Pressable>
      <Pressable onPress={() => router.push('/manage/lab' as any)} hitSlop={4}>
        <LabLogo size={42} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bell: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  badgeTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 8.5, lineHeight: 11 },
});
