import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ChevronLeft, Shield, Check, X, UserPlus, Trash2 } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import Avatar from '@/components/Avatar';
import Field from '@/components/Field';
import Select from '@/components/Select';
import PrimaryButton from '@/components/PrimaryButton';
import { Card, FadeIn, ListRow, EmptyState, OfflineBanner, Badge } from '@/components/UI';
import { colors, fonts, radius } from '@/lib/theme';
import { endpoints } from '@/lib/api';
import { isIndianMobile } from '@/lib/format';
import { ROLES, ROLE_NAMES, useRole } from '@/lib/permissions';

/** Staff management + permission based access (Users & Roles). */
export default function RolesScreen() {
  const myRole = useRole();
  const [staff, setStaff] = React.useState<any[]>([]);
  const [matrix, setMatrix] = React.useState<{ roles: any[]; permissions: string[] }>({ roles: ROLES, permissions: [] });
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', role: 'Technician', mobile: '', status: 'Active' });
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const [list, m] = await Promise.all([
        endpoints.meta.list('employees'),
        endpoints.roles().catch(() => null),
      ]);
      setStaff(Array.isArray(list) ? list : []);
      if (m?.roles?.length) setMatrix({ roles: m.roles, permissions: m.permissions || [] });
    } catch (e: any) {
      console.warn(e?.message || e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  const save = async () => {
    if (!form.name.trim()) return Alert.alert('Name is required');
    if (!isIndianMobile(form.mobile)) return Alert.alert('Invalid mobile', 'Staff sign in with their mobile number + OTP.');
    setSaving(true);
    try {
      await endpoints.meta.create('employees', form);
      setForm({ name: '', role: 'Technician', mobile: '', status: 'Active' });
      setShowForm(false);
      await load();
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Server error');
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (member: any, role: string) => {
    try {
      await endpoints.meta.update('employees', member._id || member.id, { role });
      await load();
    } catch (e: any) {
      Alert.alert('Could not update', e?.message || 'Server error');
    }
  };

  const remove = (member: any) => {
    Alert.alert('Remove staff', `${member.name} will lose access at next sign in.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await endpoints.meta.remove('employees', member._id || member.id);
            await load();
          } catch (e: any) {
            Alert.alert('Could not remove', e?.message || 'Server error');
          }
        },
      },
    ]);
  };

  const permissions = matrix.permissions.length ? matrix.permissions : ROLES[0].permissions;

  return (
    <AppScreen
      keyboard
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
      header={
        <ScreenHeader
          title="Users & Roles"
          subtitle={`Signed in as ${myRole}`}
          left={<ChevronLeft size={24} color="#fff" />}
          onLeftPress={() => router.back()}
          right={
            <Pressable style={styles.addBtn} onPress={() => setShowForm((v) => !v)}>
              <UserPlus size={17} color="#fff" />
            </Pressable>
          }
        />
      }
    >
      <OfflineBanner />

      {showForm && (
        <FadeIn>
          <Card style={{ marginBottom: 12 }}>
            <Text style={styles.section}>Add staff member</Text>
            <Field label="Full name" required value={form.name} onChangeText={(t) => setForm((f) => ({ ...f, name: t }))} placeholder="Neha Singh" />
            <Field label="Mobile (login)" required value={form.mobile} digits={10} onChangeText={(t) => setForm((f) => ({ ...f, mobile: t }))} placeholder="10-digit number" hint="They sign in with this number + OTP" />
            <Select label="Role" value={form.role} options={ROLE_NAMES} onChange={(v) => setForm((f) => ({ ...f, role: v }))} />
            <Select label="Status" value={form.status} options={['Active', 'Inactive']} onChange={(v) => setForm((f) => ({ ...f, status: v }))} />
            <PrimaryButton title="Add staff" onPress={save} loading={saving} />
          </Card>
        </FadeIn>
      )}

      <Text style={styles.section}>Team ({staff.length})</Text>
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> : (
        <Card style={{ padding: 0 }}>
          {staff.length === 0 ? (
            <EmptyState title="No staff yet" subtitle="Add receptionists and technicians." />
          ) : staff.map((s, i) => (
            <ListRow key={s._id || i} last={i === staff.length - 1}>
              <View style={styles.row}>
                <Avatar name={s.name} color="#E0F2FE" size={40} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.title} numberOfLines={1}>{s.name}</Text>
                  <Text style={styles.meta}>{s.mobile}</Text>
                </View>
                <View style={{ width: 132 }}>
                  <Select value={s.role} options={ROLE_NAMES} onChange={(v) => changeRole(s, v)} />
                </View>
                <Pressable hitSlop={8} onPress={() => remove(s)}>
                  <Trash2 size={15} color={colors.danger} />
                </Pressable>
              </View>
            </ListRow>
          ))}
        </Card>
      )}

      <Text style={styles.section}>Permission matrix</Text>
      <Card style={{ padding: 0, marginBottom: 20 }}>
        {(matrix.roles || []).map((r: any, i: number) => (
          <View key={r.name} style={[styles.roleBlock, i === matrix.roles.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={styles.roleHead}>
              <Shield size={15} color={colors.primary} />
              <Text style={styles.roleName}>{r.name}</Text>
              <Badge text={`${(r.permissions || []).length} rights`} tone="primary" />
            </View>
            <Text style={styles.meta}>{r.description}</Text>
            <View style={styles.permWrap}>
              {permissions.map((p: string) => {
                const on = (r.permissions || []).includes(p);
                return (
                  <View key={p} style={[styles.perm, on ? styles.permOn : styles.permOff]}>
                    {on ? <Check size={10} color={colors.green} /> : <X size={10} color={colors.mutedForeground} />}
                    <Text style={[styles.permTxt, on && { color: colors.foreground }]}>{p}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  addBtn: { width: 36, height: 36, borderRadius: radius.xs, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  section: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground, marginTop: 12, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontFamily: fonts.semibold, fontSize: 13, color: colors.foreground },
  meta: { fontFamily: fonts.regular, fontSize: 10.5, color: colors.mutedForeground, marginTop: 2 },
  roleBlock: { padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  roleHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleName: { flex: 1, fontFamily: fonts.bold, fontSize: 13.5, color: colors.foreground },
  permWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  perm: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill },
  permOn: { backgroundColor: colors.greenLight },
  permOff: { backgroundColor: colors.muted },
  permTxt: { fontFamily: fonts.medium, fontSize: 9.5, color: colors.mutedForeground },
});
