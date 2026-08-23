import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { T } from '../components/T';
import { BlueHeader, Card, Press, Skeleton } from '../components/kit';
import { api, type BackupDocument, type BackupStatus } from '../src/api';
import { C, PAGE_GUTTER } from '../src/theme';
import { useFeedback } from '../src/feedback';

type PendingBackup = { name: string; document: BackupDocument };

const RECORD_LABELS: Record<string, string> = {
  patients: 'Patients',
  reports: 'Reports',
  tests: 'Tests',
  doctors: 'Doctors',
  transactions: 'Payments',
  expenses: 'Expenses',
};

function dateTime(value?: string) {
  if (!value) return 'No backup created yet';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function DataBackupScreen() {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const [status, setStatus] = React.useState<BackupStatus | null>(null);
  const [pending, setPending] = React.useState<PendingBackup | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [working, setWorking] = React.useState<'run' | 'export' | 'restore' | 'toggle' | ''>('');
  const [error, setError] = React.useState('');
  const mounted = React.useRef(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const next = await api.backup.status();
      if (!mounted.current) return;
      setStatus(next);
      setError('');
    } catch (loadError) {
      if (!mounted.current) return;
      setError(loadError instanceof Error ? loadError.message : 'Unable to load backup status.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    mounted.current = true;
    load().catch(() => {});
    return () => { mounted.current = false; };
  }, [load]);

  const runBackup = async () => {
    setWorking('run');
    try {
      await api.backup.run();
      await load();
      toast({ kind: 'success', title: 'Backup ready', message: 'A secure server backup point was created successfully.' });
    } catch (runError) {
      toast({ kind: 'error', title: 'Backup failed', message: runError instanceof Error ? runError.message : 'Please try again.' });
    } finally {
      if (mounted.current) setWorking('');
    }
  };

  const exportBackup = async () => {
    setWorking('export');
    try {
      const document = await api.backup.export();
      const json = JSON.stringify(document, null, 2);
      const fileName = `PathoNexa-backup-${new Date().toISOString().slice(0, 10)}.json`;
      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = window.document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        const uri = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(uri, json, { encoding: FileSystem.EncodingType.UTF8 });
        if (!(await Sharing.isAvailableAsync())) throw new Error('File sharing is not available on this device.');
        await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Save PathoNexa backup', UTI: 'public.json' });
      }
    } catch (exportError) {
      toast({ kind: 'error', title: 'Export failed', message: exportError instanceof Error ? exportError.message : 'Please try again.' });
    } finally {
      if (mounted.current) setWorking('');
    }
  };

  const chooseBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/json', 'text/plain'], copyToCacheDirectory: true, multiple: false });
      if (result.canceled) return;
      const asset = result.assets[0];
      const text = Platform.OS === 'web' && asset.file
        ? await asset.file.text()
        : await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
      const document = JSON.parse(text) as BackupDocument;
      if (!document || typeof document !== 'object' || document.meta?.app !== 'PathoNexa') {
        throw new Error('Select a valid PathoNexa JSON backup file.');
      }
      setPending({ name: asset.name, document });
    } catch (pickError) {
      toast({ kind: 'error', title: 'Unable to open backup', message: pickError instanceof Error ? pickError.message : 'The selected file could not be read.' });
    }
  };

  const restore = () => {
    if (!pending) return;
    confirm({
      kind: 'warning',
      title: 'Restore this backup?',
      message: 'Current lab records will be replaced by the selected backup. This action cannot be undone.',
      confirmText: 'Restore',
      destructive: true,
      onConfirm: async () => {
        setWorking('restore');
        try {
          const result = await api.backup.restore(pending.document);
          setPending(null);
          await load();
          const count = Object.values(result.restored || {}).reduce((sum, value) => sum + Number(value || 0), 0);
          toast({ kind: 'success', title: 'Restore complete', message: `${count.toLocaleString('en-IN')} records were restored securely.` });
        } catch (restoreError) {
          toast({ kind: 'error', title: 'Restore failed', message: restoreError instanceof Error ? restoreError.message : 'Please try again.' });
        } finally {
          if (mounted.current) setWorking('');
        }
      },
    });
  };

  const toggleAutoBackup = async (enabled: boolean) => {
    if (!status || working) return;
    const previous = status;
    setStatus({ ...status, autoBackup: enabled });
    setWorking('toggle');
    try {
      await api.lab.update({ autoBackup: enabled });
    } catch (toggleError) {
      setStatus(previous);
      toast({ kind: 'error', title: 'Unable to update', message: toggleError instanceof Error ? toggleError.message : 'Please try again.' });
    } finally {
      if (mounted.current) setWorking('');
    }
  };

  const busy = !!working;
  return (
    <View style={styles.screen}>
      <BlueHeader title="Data Backup" sub="Protect and restore your lab records" onBack={() => router.back()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!!error && (
          <TouchableOpacity onPress={load} activeOpacity={0.75} style={styles.error}>
            <MaterialCommunityIcons name="alert-circle-outline" color={C.red} size={17} />
            <T style={styles.errorText}>{error} Tap to retry.</T>
          </TouchableOpacity>
        )}

        <Card style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <MaterialCommunityIcons name="cloud-lock-outline" color={C.primary} size={27} />
          </View>
          <View style={styles.statusCopy}>
            <T style={styles.eyebrow}>LATEST SERVER BACKUP</T>
            {loading ? (
              <>
                <Skeleton width="68%" height={14} style={styles.skeletonLine} />
                <Skeleton width="42%" height={10} style={styles.skeletonLine} />
              </>
            ) : (
              <>
                <T style={styles.statusTitle}>{dateTime(status?.lastBackupAt)}</T>
                <T style={styles.statusSub}>{status?.storage || 'Secure storage'} · {status?.totalRecords || 0} records</T>
              </>
            )}
          </View>
          <TouchableOpacity disabled={loading || busy} onPress={load} style={styles.iconButton} accessibilityLabel="Refresh backup status">
            <MaterialCommunityIcons name="refresh" size={19} color={C.primary} />
          </TouchableOpacity>
        </Card>

        <View style={styles.actionRow}>
          <Press disabled={busy} onPress={runBackup} style={[styles.primaryAction, busy && styles.disabled]}>
            <MaterialCommunityIcons name={working === 'run' ? 'clock-outline' : 'cloud-upload-outline'} size={19} color="#fff" />
            <T style={styles.primaryActionText}>{working === 'run' ? 'Backing up…' : 'Back up now'}</T>
          </Press>
          <Press disabled={busy} onPress={exportBackup} style={[styles.secondaryAction, busy && styles.disabled]}>
            <MaterialCommunityIcons name={working === 'export' ? 'clock-outline' : 'download-outline'} size={19} color={C.primary} />
            <T style={styles.secondaryActionText}>{working === 'export' ? 'Exporting…' : 'Export file'}</T>
          </Press>
        </View>

        <T style={styles.sectionTitle}>RECORDS INCLUDED</T>
        <Card style={styles.listCard}>
          {loading ? Array.from({ length: 5 }).map((_, index) => (
            <View key={index} style={[styles.recordRow, index > 0 && styles.borderTop]}>
              <Skeleton width={28} height={28} radius={4} />
              <Skeleton width="38%" height={11} style={styles.recordSkeleton} />
            </View>
          )) : Object.entries(status?.records || {}).map(([key, count], index) => (
            <View key={key} style={[styles.recordRow, index > 0 && styles.borderTop]}>
              <View style={styles.recordIcon}><MaterialCommunityIcons name="database-outline" size={16} color={C.primary} /></View>
              <T style={styles.recordLabel}>{RECORD_LABELS[key] || key}</T>
              <T style={styles.recordCount}>{Number(count).toLocaleString('en-IN')}</T>
            </View>
          ))}
        </Card>

        <T style={styles.sectionTitle}>AUTOMATIC BACKUP</T>
        <Card style={styles.settingRow}>
          <View style={styles.settingIcon}><MaterialCommunityIcons name="calendar-sync-outline" size={20} color={C.primary} /></View>
          <View style={styles.settingCopy}>
            <T style={styles.settingTitle}>Automatic server backup</T>
            <T style={styles.settingSub}>Keep lab data protected with automatic backups.</T>
          </View>
          {loading ? <Skeleton width={42} height={24} radius={12} /> : (
            <Switch
              value={!!status?.autoBackup}
              onValueChange={toggleAutoBackup}
              disabled={busy}
              trackColor={{ false: C.borderStrong, true: '#8AB4F8' }}
              thumbColor={status?.autoBackup ? C.primary : '#fff'}
            />
          )}
        </Card>

        <T style={styles.sectionTitle}>RESTORE FROM FILE</T>
        <Card style={styles.restoreCard}>
          <View style={styles.restoreHead}>
            <View style={styles.restoreIcon}><MaterialCommunityIcons name="file-restore-outline" size={22} color={C.orange} /></View>
            <View style={styles.settingCopy}>
              <T style={styles.settingTitle}>Restore an exported backup</T>
              <T style={styles.settingSub}>Only signed backups from this mobile account can be restored.</T>
            </View>
          </View>
          {!!pending && (
            <View style={styles.selectedFile}>
              <MaterialCommunityIcons name="file-check-outline" size={18} color={C.green} />
              <T style={styles.selectedName} numberOfLines={1}>{pending.name}</T>
              <TouchableOpacity onPress={() => setPending(null)} style={styles.removeFile}><MaterialCommunityIcons name="close" size={17} color={C.sub} /></TouchableOpacity>
            </View>
          )}
          <View style={styles.restoreActions}>
            <Press disabled={busy} onPress={chooseBackup} style={styles.chooseButton}>
              <MaterialCommunityIcons name="folder-open-outline" size={17} color={C.primary} />
              <T style={styles.chooseText}>{pending ? 'Choose another' : 'Choose JSON file'}</T>
            </Press>
            <Press disabled={!pending || busy} onPress={restore} style={[styles.restoreButton, (!pending || busy) && styles.disabled]}>
              <MaterialCommunityIcons name={working === 'restore' ? 'clock-outline' : 'restore'} size={17} color="#fff" />
              <T style={styles.restoreText}>{working === 'restore' ? 'Restoring…' : 'Restore'}</T>
            </Press>
          </View>
        </Card>
        <T style={styles.securityNote}>Backups are signed, account-bound, and checked before any data is changed.</T>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: PAGE_GUTTER, paddingTop: 4, paddingBottom: 28 },
  error: { flexDirection: 'row', alignItems: 'center', padding: 8, borderWidth: 1, borderColor: '#F8CACA', borderRadius: 4, backgroundColor: C.redSoft, marginBottom: 4 },
  errorText: { flex: 1, color: C.red, fontSize: 10.5, marginLeft: 4 },
  statusCard: { minHeight: 88, padding: 10, flexDirection: 'row', alignItems: 'center' },
  statusIcon: { width: 48, height: 48, borderRadius: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blueSoft },
  statusCopy: { flex: 1, marginLeft: 6 },
  eyebrow: { color: C.faint, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  statusTitle: { color: C.text, fontSize: 13, fontWeight: '800', marginTop: 3 },
  statusSub: { color: C.sub, fontSize: 10.5, marginTop: 3 },
  iconButton: { width: 36, height: 36, borderWidth: 1, borderColor: C.border, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  skeletonLine: { marginTop: 6 },
  actionRow: { flexDirection: 'row', marginTop: 4 },
  primaryAction: { flex: 1, height: 42, borderRadius: 4, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginRight: 2 },
  primaryActionText: { color: '#fff', fontSize: 11.5, fontWeight: '700', marginLeft: 4 },
  secondaryAction: { flex: 1, height: 42, borderRadius: 4, borderWidth: 1, borderColor: C.primary, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginLeft: 2 },
  secondaryActionText: { color: C.primary, fontSize: 11.5, fontWeight: '700', marginLeft: 4 },
  sectionTitle: { color: C.faint, fontSize: 9.5, fontWeight: '700', letterSpacing: 0.5, marginTop: 8, marginBottom: 4, marginLeft: 4 },
  listCard: { padding: 0, overflow: 'hidden' },
  recordRow: { height: 45, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' },
  borderTop: { borderTopWidth: 1, borderTopColor: C.borderSoft },
  recordIcon: { width: 28, height: 28, borderRadius: 4, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  recordLabel: { flex: 1, color: C.text, fontSize: 11.5, fontWeight: '600', marginLeft: 6, textTransform: 'capitalize' },
  recordCount: { color: C.primary, fontSize: 12, fontWeight: '800' },
  recordSkeleton: { marginLeft: 6 },
  settingRow: { minHeight: 66, padding: 8, flexDirection: 'row', alignItems: 'center' },
  settingIcon: { width: 38, height: 38, borderRadius: 4, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  settingCopy: { flex: 1, marginLeft: 6 },
  settingTitle: { color: C.text, fontSize: 11.5, fontWeight: '700' },
  settingSub: { color: C.sub, fontSize: 10, lineHeight: 14, marginTop: 2 },
  restoreCard: { padding: 8 },
  restoreHead: { flexDirection: 'row', alignItems: 'center' },
  restoreIcon: { width: 40, height: 40, borderRadius: 4, backgroundColor: C.orangeSoft, alignItems: 'center', justifyContent: 'center' },
  selectedFile: { minHeight: 38, marginTop: 6, paddingHorizontal: 8, borderWidth: 1, borderColor: '#CDEBD7', backgroundColor: C.greenSoft, borderRadius: 4, flexDirection: 'row', alignItems: 'center' },
  selectedName: { flex: 1, color: C.green, fontSize: 10.5, fontWeight: '600', marginLeft: 4 },
  removeFile: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  restoreActions: { flexDirection: 'row', marginTop: 6 },
  chooseButton: { flex: 1, height: 39, borderWidth: 1, borderColor: C.borderStrong, borderRadius: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginRight: 2 },
  chooseText: { color: C.primary, fontSize: 10.5, fontWeight: '700', marginLeft: 4 },
  restoreButton: { flex: 1, height: 39, borderRadius: 4, backgroundColor: C.orange, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  restoreText: { color: '#fff', fontSize: 10.5, fontWeight: '700', marginLeft: 4 },
  securityNote: { color: C.faint, fontSize: 9.5, textAlign: 'center', marginTop: 7, paddingHorizontal: 8 },
  disabled: { opacity: 0.52 },
});
