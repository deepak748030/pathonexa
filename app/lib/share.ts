/**
 * Print / PDF / WhatsApp / share helpers shared by the report, receipt and
 * ledger screens. Everything degrades gracefully on web where native sharing
 * or printing may not exist.
 */
import { Platform, Linking, Share as RNShare, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { currentSettings } from './settings';

export async function printHtml(html: string) {
  try {
    await Print.printAsync({ html });
    return true;
  } catch {
    Alert.alert('Printing unavailable', 'Use "Download PDF" and print the saved file instead.');
    return false;
  }
}

export async function pdfFromHtml(html: string, dialogTitle = 'Save PDF') {
  try {
    const { uri } = await Print.printToFileAsync({ html });
    if (Platform.OS === 'web') {
      // expo-print on web opens the browser print dialog directly.
      await Print.printAsync({ html });
      return uri;
    }
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle, UTI: 'com.adobe.pdf' });
    } else {
      Alert.alert('PDF saved', uri);
    }
    return uri;
  } catch {
    Alert.alert('Could not create the PDF', 'This device does not support PDF export.');
    return null;
  }
}

/** Fills {patient} / {reportId} / {lab} placeholders from lab settings. */
export function whatsappMessage(vars: { patient?: string; reportId?: string; extra?: string }) {
  const s = currentSettings();
  const template = s.whatsappTemplate
    || 'Hello {patient},\n\nYour pathology report is ready.\nReport ID: {reportId}\n\nThank You.\n{lab}';
  return template
    .replace(/\{patient\}/g, vars.patient || 'Patient')
    .replace(/\{reportId\}/g, vars.reportId || '')
    .replace(/\{lab\}/g, s.shortName || s.name || 'PathoNexa')
    + (vars.extra ? `\n${vars.extra}` : '');
}

export async function openWhatsApp(mobile: string | undefined, message: string) {
  const digits = String(mobile || '').replace(/\D/g, '').slice(-10);
  const to = digits.length === 10 ? `91${digits}` : '';
  const url = `https://wa.me/${to}?text=${encodeURIComponent(message)}`;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert('WhatsApp not available', 'Install WhatsApp or copy the message manually.');
    return false;
  }
}

export async function shareText(message: string, title = 'PathoNexa') {
  try {
    await RNShare.share({ message, title });
    return true;
  } catch {
    return false;
  }
}

/** CSV export used by Patients → Export and Analytics exports. */
export function toCsv(rows: Record<string, any>[], columns?: string[]): string {
  if (!rows.length) return '';
  const cols = columns || Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => escape(r[c])).join(','))].join('\n');
}

/** Parses a pasted CSV (header row required) into objects. */
export function fromCsv(text: string): Record<string, string>[] {
  const lines = String(text || '').trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const split = (line: string) => {
    const out: string[] = [];
    let cur = '';
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i += 1; }
        else if (ch === '"') quoted = false;
        else cur += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ',') { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const header = split(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = split(line);
    const row: Record<string, string> = {};
    header.forEach((h, i) => { row[h] = cells[i] ?? ''; });
    return row;
  });
}

/**
 * Writes a text file into the cache directory.
 * Supports expo-file-system v19 (File / Paths) and the legacy API.
 */
async function writeCacheFile(name: string, content: string): Promise<string | null> {
  try {
    const FS = require('expo-file-system');
    if (FS?.File && FS?.Paths) {
      const file = new FS.File(FS.Paths.cache, name);
      try { file.create({ overwrite: true }); } catch { /* already exists */ }
      file.write(content);
      return file.uri;
    }
    if (FS?.writeAsStringAsync && FS?.cacheDirectory) {
      const uri = `${FS.cacheDirectory}${name}`;
      await FS.writeAsStringAsync(uri, content);
      return uri;
    }
  } catch {
    /* fall through to the legacy module */
  }
  try {
    const Legacy = require('expo-file-system/legacy');
    const uri = `${Legacy.cacheDirectory}${name}`;
    await Legacy.writeAsStringAsync(uri, content);
    return uri;
  } catch {
    return null;
  }
}

/** Shares a text file (CSV / JSON backup) using the platform share sheet. */
export async function shareFile(name: string, content: string, mime = 'text/csv') {
  if (Platform.OS === 'web') {
    try {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      return true;
    } catch {
      return false;
    }
  }
  try {
    const uri = await writeCacheFile(name, content);
    if (uri && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(uri, { mimeType: mime, dialogTitle: name });
      return true;
    }
    if (uri) {
      Alert.alert('Saved', uri);
      return true;
    }
    throw new Error('no filesystem');
  } catch {
    // Last resort: share the raw text.
    return shareText(content.slice(0, 4000));
  }
}
