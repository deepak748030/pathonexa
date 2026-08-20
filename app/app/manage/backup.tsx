import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, TextInput } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  ChevronLeft, CloudUpload, Download, Upload, Database, RefreshCw, ShieldCheck,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import ScreenHeader from '@/components/ScreenHeader';
import AppScreen from '@/components/AppScreen';
import PrimaryButton from '@/components/PrimaryButton';
import { Card, FadeIn, OfflineBanner, Badge } from '@/components/UI';
import { colors, fonts, radius } from '@/lib/theme';
import { endpoints } from '@/lib/api';
import { shareFile } from '@/lib/share';

/** Data backup — automatic cloud backup, manual export and restore. */
export default function Backup() {
  const [status, setStatus] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [paste, setPaste] = React.useState('');
  const [showPaste, setShowPaste] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setStatus(await endpoints.backup.status());
    } catch (e: any) {
      console.warn(e?.message || e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  const runBackup = async () => {
    setBusy('run');
    try {
      await endpoints.backup.run();
      await load();
      Alert.alert('Backup complete', 'A fresh snapshot of your lab data was created.');
    } catch (e: any) {
      Alert.alert('Backup failed', e?.message || 'Server error');
    } finally {
      setBusy(null);
    }
  };

  const exportBackup = async () => {
    setBusy('export');
    try {
      const data = await endpoints.backup.export();
      const name = `pathonexa-backup-${new Date().toISOString().slice(0, 10)}.json`;
      await shareFile(name, JSON.stringify(data, null, 2), 'application/json');
    } catch (e: any) {
      Alert.alert('Export failed', e?.message || 'Server error');
    } finally {
      setBusy(null);
    }
  };

  const restoreJson = async (json: string) => {
    let payload: any;
    try {
      payload = JSON.parse(json);
    } catch {
      Alert.alert('Invalid backup file', 'The selected file is not valid PathoNexa JSON.');
      return;
    }
    Alert.alert('Restore backup?', 'Current data will be replaced by the backup contents.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        style: 'destructive',
        onPress: async () => {
          setBusy('restore');
          try {
            const res = await endpoints.backup.restore(payload);
            await load();
            const counts = Object.entries(res?.restored || {}).map(([k, v]) => `${k}: ${v}`).join(', ');
            Alert.alert('Restore complete', counts || 'Data restored.');
            setPaste('');
            setShowPaste(false);
          } catch (e: any) {
            Alert.alert('Restore failed', e?.message || 'Server error');
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  const pickBackupFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (res.canceled || !res.assets?.length) return;
      const asset = res.assets[0];
      let text = '';
      if ((asset as any).file?.text) {
        text = await (asset as any).file.text();
      } else {
        try {
          const FS = require('expo-file-system');
          text = FS?.File ? new FS.File(asset.uri).text() : await FS.readAsStringAsync(asset.uri);
        } catch {
          const Legacy = require('expo-file-system/legacy');
          text = await Legacy.readAsStringAsync(asset.uri);
        }
      }
      await restoreJson(text);
    } catch (e: any) {
      Alert.alert('Could not read the file', e?.message || 'Try pasting the JSON instead.');
      setShowPaste(true);
    }
  };

  return (
    <AppScreen
      keyboard
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
      header={
        <ScreenHeader
          title="Data Backup"
          subtitle="Automatic cloud backup, export and restore"
          left={<ChevronLeft size={24} color="#fff" />}
          onLeftPress={() => router.back()}
        />
      }
    >
      <OfflineBanner />
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : (
        <>
          <FadeIn>
            <Card>
              <View style={styles.head}>
                <View style={styles.icon}><Database size={18} color={colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{status?.storage}</Text>
                  <Text style={styles.meta}>
                    {status?.totalRecords} records · Last backup {status?.lastBackupAt ? new Date(status.lastBackupAt).toLocaleString('en-IN') : 'never'}
                  </Text>
                </View>
                <Badge text={status?.autoBackup ? 'Auto ON' : 'Auto OFF'} tone={status?.autoBackup ? 'green' : 'orange'} />
              </View>

              <View style={styles.records}>
                {Object.entries(status?.records || {}).map(([k, v]) => (
                  <View key={k} style={styles.record}>
                    <Text style={styles.recordV}>{String(v)}</Text>
                    <Text style={styles.recordL}>{k}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </FadeIn>

          <FadeIn delay={60}>
            <Card style={{ marginTop: 12 }}>
              <Text style={styles.section}>Manual backup</Text>
              <Text style={styles.meta}>
                Creates a snapshot on the server and lets you download a JSON copy you can store anywhere.
              </Text>
              <View style={{ height: 12 }} />
              <PrimaryButton
                title="Back up now"
                onPress={runBackup}
                loading={busy === 'run'}
                icon={<CloudUpload size={16} color="#fff" />}
              />
              <View style={{ height: 10 }} />
              <PrimaryButton
                title="Download backup file"
                ghost
                onPress={exportBackup}
                loading={busy === 'export'}
                icon={<Download size={16} color={colors.primary} />}
              />
            </Card>
          </FadeIn>

          <FadeIn delay={100}>
            <Card style={{ marginTop: 12, marginBottom: 20 }}>
              <Text style={styles.section}>Restore</Text>
              <Text style={styles.meta}>
                Restoring replaces the current data with the backup contents. Keep a fresh export before you restore.
              </Text>
              <View style={{ height: 12 }} />
              <PrimaryButton
                title="Choose backup file"
                onPress={pickBackupFile}
                loading={busy === 'restore'}
                icon={<Upload size={16} color="#fff" />}
              />
              <Pressable style={styles.link} onPress={() => setShowPaste((v) => !v)}>
                <Text style={styles.linkTxt}>{showPaste ? 'Hide paste option' : 'Or paste backup JSON'}</Text>
              </Pressable>
              {showPaste && (
                <>
                  <TextInput
                    style={styles.paste}
                    value={paste}
                    onChangeText={setPaste}
                    multiline
                    placeholder='{"patients": [...], "reports": [...]}'
                    placeholderTextColor={colors.placeholder}
                  />
                  <PrimaryButton
                    title="Restore from pasted JSON"
                    ghost
                    onPress={() => restoreJson(paste)}
                    loading={busy === 'restore'}
                    icon={<RefreshCw size={16} color={colors.primary} />}
                  />
                </>
              )}
              <View style={styles.safe}>
                <ShieldCheck size={14} color={colors.green} />
                <Text style={styles.safeTxt}>
                  Deleted patients and reports stay recoverable in Deleted Records until you clear them.
                </Text>
              </View>
            </Card>
          </FadeIn>
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground },
  meta: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedForeground, marginTop: 3, lineHeight: 17 },
  records: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  record: { flexGrow: 1, minWidth: 70, backgroundColor: colors.primarySoft, borderRadius: radius.sm, padding: 8, alignItems: 'center' },
  recordV: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.primary },
  recordL: { fontFamily: fonts.medium, fontSize: 9.5, color: colors.mutedForeground, marginTop: 2, textTransform: 'capitalize' },
  section: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground, marginBottom: 6 },
  link: { alignSelf: 'center', paddingVertical: 10 },
  linkTxt: { fontFamily: fonts.semibold, fontSize: 12, color: colors.primary },
  paste: {
    minHeight: 96, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm,
    padding: 10, fontFamily: fonts.regular, fontSize: 11, color: colors.foreground,
    textAlignVertical: 'top', marginBottom: 10,
  },
  safe: { flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'flex-start' },
  safeTxt: { flex: 1, fontFamily: fonts.regular, fontSize: 10.5, color: colors.mutedForeground, lineHeight: 15 },
});
