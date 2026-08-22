// Slide-in side drawer — layout & content per UI PDF (menu screen)
import React, { createContext, useContext, useState } from 'react';
import { T } from './T';
import { BrandIcon } from './Brand';
import { View, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { C, PAGE_GUTTER } from '../src/theme';
import { drawerSections } from '../src/navigation';
import { api, type LabSettings } from '../src/api';
import { useAuth } from '../src/auth';
import { useFeedback } from '../src/feedback';
import { Skeleton } from './kit';

const DrawerCtx = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({ open: false, setOpen: () => {} });
export const useDrawer = () => useContext(DrawerCtx);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <DrawerCtx.Provider value={{ open, setOpen }}>
      {children}
      <DrawerPanel />
    </DrawerCtx.Provider>
  );
}

function DrawerPanel() {
  const { open, setOpen } = useDrawer();
  const { logout, user } = useAuth();
  const { toast } = useFeedback();
  const router = useRouter();
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const W = Math.min(Dimensions.get('window').width * 0.86, 340);
  const anim = React.useRef(new Animated.Value(-1)).current;
  const last = React.useRef(false);
  const [lab, setLab] = React.useState<LabSettings | null>(null);
  const [loadingLab, setLoadingLab] = React.useState(false);

  React.useEffect(() => {
    setLab(null);
  }, [user?.id]);

  React.useEffect(() => {
    let active = true;
    if (!open || !user || lab) return () => { active = false; };
    setLoadingLab(true);
    api.settings()
      .then((settings) => { if (active) setLab(settings); })
      .catch(() => {})
      .finally(() => { if (active) setLoadingLab(false); });
    return () => { active = false; };
  }, [lab, open, user]);

  React.useEffect(() => {
    if (open !== last.current) {
      last.current = open;
      Animated.timing(anim, { toValue: open ? 1 : -1, duration: 220, useNativeDriver: Platform.OS !== 'web' ? true : false }).start();
    }
  }, [open]);

  const go = (route?: string, label?: string) => {
    setOpen(false);
    if (route) router.push(route as any);
    else if (label) toast({ kind: 'info', title: label, message: 'This feature is not available in this app version yet.' });
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  const translateX = anim.interpolate({ inputRange: [-1, 1], outputRange: [-W - 20, 0] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {open && <TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={() => setOpen(false)} />}
      <Animated.View style={[styles.panel, { width: W, transform: [{ translateX }] }]}>
        <LinearGradient
          colors={[C.headerTop, C.headerBottom]}
          start={[0, 0]}
          end={[1, 1]}
          style={[styles.panelHeader, { paddingTop: insets.top + 16, paddingBottom: 16 }]}
        >
          <View style={styles.logoCircle}>
            <BrandIcon size={52} circular />
          </View>
          <View style={{ flex: 1, marginLeft: 4 }}>
            {!lab || loadingLab ? (
              <>
                <Skeleton width="78%" height={14} style={styles.headerSkeleton} />
                <Skeleton width="42%" height={10} style={styles.headerSkeletonLine} />
                <Skeleton width="56%" height={10} style={styles.headerSkeletonLine} />
              </>
            ) : (
              <>
                <View style={styles.row}>
                  <T style={styles.labName} numberOfLines={1}>{lab.name}</T>
                  <View style={styles.activeBadge}>
                    <T style={styles.activeBadgeText}>Active</T>
                  </View>
                </View>
                <T style={styles.labSub}>{lab.city || 'City not configured'}</T>
                <T style={styles.labSub}>Lab ID: {lab.labId || '—'}</T>
              </>
            )}
          </View>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <T style={styles.userAvatarText}>{(user?.name || 'User').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</T>
            </View>
            <View style={{ flex: 1, marginLeft: 4 }}>
              <T style={styles.userName}>{user?.name || 'Account'}</T>
              <T style={styles.userRole}>{user?.role || 'Owner'} · +91 {user?.mobile || ''}</T>
              <View style={styles.row}>
                <View style={styles.onlineDot} />
                <T style={styles.onlineText}>Online</T>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={C.faint} />
          </View>

          {drawerSections.map((sec) => (
            <View key={sec.title}>
              <T style={styles.secTitle}>{sec.title}</T>
              {sec.items.map((it) => {
                const active = !!it.route && path === it.route;
                return (
                  <TouchableOpacity
                    key={it.label}
                    style={[styles.item, active && { backgroundColor: '#E9F1FE', borderRadius: 4 }]}
                    onPress={() => go(it.route, it.label)}
                  >
                    <MaterialCommunityIcons name={it.icon as any} size={19} color={C.primary} />
                    <T style={[styles.itemLabel, active && { color: C.primary, fontWeight: '700' }]}>{it.label}</T>
                    <MaterialCommunityIcons name="chevron-right" size={16} color={active ? C.primary : C.faint} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Logout from your account"
            activeOpacity={0.76}
            style={styles.logout}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout" size={19} color={C.red} />
            <View style={{ marginLeft: 4 }}>
              <T style={styles.logoutTitle}>Logout</T>
              <T style={styles.logoutSub}>Logout from your account</T>
            </View>
          </TouchableOpacity>

          <T style={styles.version}>App Version 1.0.0</T>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,20,40,0.45)' },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#fff',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    borderRightWidth: 1,
    borderRightColor: C.border,
    overflow: 'hidden',
  },
  panelHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: PAGE_GUTTER },
  logoCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  labName: { color: '#fff', fontWeight: '800', fontSize: 16, marginRight: 4 },
  activeBadge: { backgroundColor: '#22C55E', borderRadius: 3, paddingHorizontal: 7, paddingVertical: 2.5 },
  activeBadgeText: { color: '#fff', fontSize: 9.5, fontWeight: '700' },
  labSub: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 3 },
  headerSkeleton: { backgroundColor: 'rgba(255,255,255,0.7)' },
  headerSkeletonLine: { marginTop: 5, backgroundColor: 'rgba(255,255,255,0.55)' },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FD',
    marginHorizontal: PAGE_GUTTER,
    marginVertical: 8,
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  userAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#E4EDFD', alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { color: C.primary, fontWeight: '800', fontSize: 15 },
  userName: { fontSize: 14, fontWeight: '700', color: C.text },
  userRole: { fontSize: 11.5, color: C.sub, marginTop: 1 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E', marginRight: 4 },
  onlineText: { color: '#16A34A', fontSize: 10.5, fontWeight: '600', marginTop: 3 },
  secTitle: {
    fontSize: 10,
    color: C.faint,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginHorizontal: PAGE_GUTTER,
    marginTop: 8,
    marginBottom: 4,
  },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: PAGE_GUTTER, paddingVertical: 10 },
  itemLabel: { fontSize: 13, color: C.text, fontWeight: '600', marginLeft: 4, flex: 1 },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: PAGE_GUTTER,
    marginTop: 8,
    backgroundColor: '#FDEEEE',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F6D8D8',
  },
  logoutTitle: { color: C.red, fontWeight: '700', fontSize: 13 },
  logoutSub: { color: C.sub, fontSize: 10.5, marginTop: 1 },
  version: { color: C.faint, fontSize: 10.5, marginHorizontal: PAGE_GUTTER, marginTop: 8 },
});
