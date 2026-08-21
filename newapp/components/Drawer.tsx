// Slide-in side drawer — layout & content per UI PDF (menu screen)
import React, { createContext, useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { C } from '../src/theme';
import { lab, user, drawerSections } from '../src/data';

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
  const router = useRouter();
  const path = usePathname();
  const W = Math.min(Dimensions.get('window').width * 0.86, 340);
  const anim = React.useRef(new Animated.Value(-1)).current;
  const last = React.useRef(false);

  React.useEffect(() => {
    if (open !== last.current) {
      last.current = open;
      Animated.timing(anim, { toValue: open ? 1 : -1, duration: 220, useNativeDriver: Platform.OS !== 'web' ? true : false }).start();
    }
  }, [open]);

  const go = (route?: string) => {
    setOpen(false);
    if (route) router.push(route as any);
  };

  const translateX = anim.interpolate({ inputRange: [-1, 1], outputRange: [-W - 20, 0] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {open && <TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={() => setOpen(false)} />}
      <Animated.View style={[styles.panel, { width: W, transform: [{ translateX }] }]}>
        <LinearGradient colors={[C.headerTop, C.headerBottom]} start={[0, 0]} end={[1, 1]} style={styles.panelHeader}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="flask" size={30} color={C.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.row}>
              <Text style={styles.labName} numberOfLines={1}>
                PathoNexa Diagnostics
              </Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            </View>
            <Text style={styles.labSub}>{lab.city}</Text>
            <Text style={styles.labSub}>Lab ID: {lab.labId}</Text>
          </View>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{user.initials}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userRole}>{user.role}</Text>
              <View style={styles.row}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={C.faint} />
          </View>

          {drawerSections.map((sec) => (
            <View key={sec.title}>
              <Text style={styles.secTitle}>{sec.title}</Text>
              {sec.items.map((it) => {
                const active = !!it.route && path === it.route;
                return (
                  <TouchableOpacity
                    key={it.label}
                    style={[styles.item, active && { backgroundColor: '#E9F1FE', borderRadius: 10 }]}
                    onPress={() => go(it.route)}
                  >
                    <MaterialCommunityIcons name={it.icon as any} size={19} color={C.primary} />
                    <Text style={[styles.itemLabel, active && { color: C.primary, fontWeight: '700' }]}>{it.label}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={16} color={active ? C.primary : C.faint} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          <TouchableOpacity style={styles.logout} onPress={() => setOpen(false)}>
            <MaterialCommunityIcons name="logout" size={19} color={C.red} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.logoutTitle}>Logout</Text>
              <Text style={styles.logoutSub}>Logout from your account</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.version}>App Version 1.0.0</Text>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,20,40,0.45)' },
  panel: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: '#fff', borderTopRightRadius: 18, borderBottomRightRadius: 18, elevation: 10, overflow: 'hidden' },
  panelHeader: { flexDirection: 'row', alignItems: 'center', padding: 18, paddingTop: 34 },
  logoCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  labName: { color: '#fff', fontWeight: '800', fontSize: 16, marginRight: 8 },
  activeBadge: { backgroundColor: '#22C55E', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2.5 },
  activeBadgeText: { color: '#fff', fontSize: 9.5, fontWeight: '700' },
  labSub: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 3 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F9FD', margin: 12, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border },
  userAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#E4EDFD', alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { color: C.primary, fontWeight: '800', fontSize: 15 },
  userName: { fontSize: 14, fontWeight: '700', color: C.text },
  userRole: { fontSize: 11.5, color: C.sub, marginTop: 1 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E', marginRight: 5 },
  onlineText: { color: '#16A34A', fontSize: 10.5, fontWeight: '600', marginTop: 3 },
  secTitle: { fontSize: 10, color: C.faint, fontWeight: '700', letterSpacing: 0.6, marginHorizontal: 18, marginTop: 14, marginBottom: 6 },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 11 },
  itemLabel: { fontSize: 13, color: C.text, fontWeight: '600', marginLeft: 12, flex: 1 },
  logout: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginTop: 16, backgroundColor: '#FDEEEE', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F6D8D8' },
  logoutTitle: { color: C.red, fontWeight: '700', fontSize: 13 },
  logoutSub: { color: C.sub, fontSize: 10.5, marginTop: 1 },
  version: { color: C.faint, fontSize: 10.5, marginHorizontal: 18, marginTop: 16 },
});
