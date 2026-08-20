import React from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import LabLogo from '@/components/LabLogo';
import { colors, fonts } from '@/lib/theme';
import { endpoints } from '@/lib/api';

/**
 * Header bell + lab logo. The bell shows the live unread notification count
 * (report ready, payment pending, commission due, subscription expiry).
 */
export default function HeaderUser({ badge }: { badge?: number }) {
  const [count, setCount] = React.useState(badge ?? 0);

  React.useEffect(() => {
    if (typeof badge === 'number') { setCount(badge); return; }
    let alive = true;
    endpoints.notifications.count()
      .then((r) => { if (alive) setCount(r?.unread || 0); })
      .catch(() => { if (alive) setCount(0); });
    return () => { alive = false; };
  }, [badge]);

  return (
    <View style={styles.row}>
      <Pressable onPress={() => router.push('/notifications' as any)} hitSlop={8} style={styles.bell}>
        <Bell size={20} color="#FFFFFF" strokeWidth={2.1} />
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>{count > 9 ? '9+' : count}</Text>
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
