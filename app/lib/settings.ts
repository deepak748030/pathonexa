/**
 * Lab settings store — logo, address, GST, signature, stamp, report footer,
 * WhatsApp template, theme and language.
 *
 * The values are fetched from `GET /api/settings`, cached in AsyncStorage so
 * printing still works offline, and shared by every screen (report PDF,
 * headers, WhatsApp messages).
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { endpoints } from './api';
import { lab as fallbackLab } from './labData';

const CACHE_KEY = 'pathonexa.settings';

export type LabSettings = {
  name: string;
  shortName: string;
  city: string;
  labId: string;
  phone: string;
  altPhone?: string;
  email: string;
  website?: string;
  address: string;
  pathologist: string;
  gst?: string;
  logo?: string;
  signature?: string;
  stamp?: string;
  footer?: string;
  reportNote?: string;
  whatsappTemplate?: string;
  theme?: string;
  language?: string;
  autoPrint?: boolean;
  notifications?: boolean;
  ownerVerification?: boolean;
  autoBackup?: boolean;
  currency?: string;
};

export const DEFAULT_SETTINGS: LabSettings = {
  name: fallbackLab.name,
  shortName: fallbackLab.shortName,
  city: fallbackLab.city,
  labId: fallbackLab.labId,
  phone: fallbackLab.phone,
  email: fallbackLab.email,
  address: fallbackLab.address,
  pathologist: fallbackLab.pathologist,
  gst: '',
  footer: 'This is a computer generated report and does not require physical signature.',
  reportNote: 'Kindly correlate clinically. Results relate only to the sample tested.',
  whatsappTemplate:
    'Hello {patient},\n\nYour pathology report is ready.\nReport ID: {reportId}\nPlease find your report attached.\n\nThank You.\n{lab}',
  theme: 'Blue',
  language: 'English',
  autoPrint: true,
  notifications: true,
  ownerVerification: true,
  autoBackup: true,
  currency: '₹',
};

type SettingsState = {
  settings: LabSettings;
  loading: boolean;
  loaded: boolean;
  load: (force?: boolean) => Promise<LabSettings>;
  save: (patch: Partial<LabSettings>) => Promise<LabSettings>;
};

export const useSettings = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loading: false,
  loaded: false,

  load: async (force = false) => {
    if (get().loaded && !force) return get().settings;
    set({ loading: true });
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) set({ settings: { ...DEFAULT_SETTINGS, ...JSON.parse(cached) } });
    } catch {
      /* ignore cache errors */
    }
    try {
      const remote = await endpoints.settings.get();
      const merged = { ...DEFAULT_SETTINGS, ...(remote || {}) };
      set({ settings: merged, loaded: true, loading: false });
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(merged)).catch(() => {});
      return merged;
    } catch {
      set({ loading: false, loaded: true });
      return get().settings;
    }
  },

  save: async (patch) => {
    const optimistic = { ...get().settings, ...patch };
    set({ settings: optimistic });
    try {
      const saved = await endpoints.settings.update(patch);
      const merged = { ...DEFAULT_SETTINGS, ...(saved || optimistic) };
      set({ settings: merged });
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(merged)).catch(() => {});
      return merged;
    } catch (e) {
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(optimistic)).catch(() => {});
      throw e;
    }
  },
}));

/** Non-hook access for helpers that build HTML/messages. */
export const currentSettings = (): LabSettings => useSettings.getState().settings;
