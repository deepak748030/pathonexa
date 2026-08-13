import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/lib/auth';
import { lab } from '@/lib/labData';

/** Bell + circular user avatar — used on the right of every main header. */
export default function HeaderUser({ showBell = true }: { showBell?: boolean }) {
  const user = useAuth((s) => s.user);
  const name = user?.name || lab.admin || 'Admin';

  return (
    <View style={styles.row}>
      {showBell ? (
        <Pressable onPress={() => router.push('/notifications' as any)} hitSlop={8} style={styles.bell}>
          <Bell size={18} color="#FFFFFF" />
        </Pressable>
      ) : null}
      <Pressable onPress={() => router.push('/manage/lab' as any)} hitSlop={4} style={styles.avatarRing}>
        <Avatar name={name} size={28} circle color="#DBEAFE" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bell: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
});
