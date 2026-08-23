import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TOKEN_KEY = 'pathonexa.token';

/**
 * Resolves the backend base URL for wherever the app is running:
 *  1. EXPO_PUBLIC_API_URL  → explicit override (see app/.env.example)
 *  2. Metro host URI       → physical device on the same Wi-Fi (Expo Go)
 *  3. Platform defaults    → Android emulator uses 10.0.2.2, everything
 *                            else (web / iOS simulator) uses localhost.
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  // Web running on a remote host (cloud preview / deployment): assume the API
  // is served on the same host with port 5000 (previews proxy every port).
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const h = window.location.hostname;
    if (h && !['localhost', '127.0.0.1'].includes(h)) {
      const portMatch = h.match(/^(\d+)-/);
      if (portMatch) {
        // e.g. https://8080-sandbox.e2b.app → https://5000-sandbox.e2b.app/api
        return `${window.location.protocol}//${h.replace(/^\d+-/, '5000-')}/api`;
      }
      return `${window.location.protocol}//${h}:5000/api`;
    }
  }

  const hostUri: string | undefined =
    Constants.expoConfig?.hostUri || (Constants as any).expoGoConfig?.debuggerHost;
  // hostUri may be `192.168.x.x:8081` (LAN) or `localhost:8081`. Strip any
  // protocol prefix and the port to get the bare host.
  const host = hostUri ? String(hostUri).replace(/^[a-z]+:\/\//i, '').split(':')[0] : undefined;
  if (host && !['localhost', '127.0.0.1'].includes(host)) {
    // Phone on LAN → the PC running Metro also runs the API on port 5000.
    return `http://${host}:5000/api`;
  }
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000/api';
  return 'http://localhost:5000/api';
}

export const API_URL = resolveBaseUrl();
export const REQUEST_TIMEOUT_MS = 12000;

if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log(`[api] PathoNexa server URL: ${API_URL}`);
}

/**
 * Central fetch wrapper: attaches the JWT, enforces a timeout and throws
 * readable errors so every screen gets consistent behaviour.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const body = await response.json();
        message = body.message || message;
      } catch {
        try {
          const text = await response.text();
          if (text) message = text;
        } catch {
          /* ignore */
        }
      }
      throw new Error(message);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new Error(`Server request timed out (${API_URL}). Check that the backend is running.`);
    }
    if (/Network request failed|Failed to fetch|Load failed/i.test(e?.message || '')) {
      throw new Error(
        `Cannot reach the PathoNexa server at ${API_URL}. Start it with "npm run dev" inside the server/ folder.`
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export const endpoints = {
  health: () => apiFetch('/health'),
  auth: {
    login: (mobile: string) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ mobile }) }),
    verify: (mobile: string, otp: string) => apiFetch('/auth/verify', { method: 'POST', body: JSON.stringify({ mobile, otp }) }),
  },
  dashboard: {
    getStats: () => apiFetch('/dashboard/stats'),
    getChart: () => apiFetch('/dashboard/chart'),
  },
  patients: {
    getAll: () => apiFetch('/patients'),
    getStats: () => apiFetch('/patients/stats'),
    getById: (id: string) => apiFetch(`/patients/${id}`),
    create: (data: any) => apiFetch('/patients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch(`/patients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => apiFetch(`/patients/${id}`, { method: 'DELETE' }),
    duplicates: () => apiFetch('/patients/duplicates'),
    importMany: (patients: any[]) => apiFetch('/patients/import', { method: 'POST', body: JSON.stringify({ patients }) }),
  },
  reports: {
    getAll: () => apiFetch('/reports'),
    getStats: () => apiFetch('/reports/stats'),
    getById: (id: string) => apiFetch(`/reports/${id}`),
    nextId: () => apiFetch('/reports/next-id'),
    create: (data: any) => apiFetch('/reports', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch(`/reports/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => apiFetch(`/reports/${id}`, { method: 'DELETE' }),
    duplicate: (id: string) => apiFetch(`/reports/${id}/duplicate`, { method: 'POST' }),
    verify: (id: string, by?: string) => apiFetch(`/reports/${id}/verify`, { method: 'POST', body: JSON.stringify({ by }) }),
  },
  meta: {
    list: (key: string) => apiFetch(`/${key}`),
    get: (key: string, id: string) => apiFetch(`/${key}/${id}`),
    create: (key: string, data: any) => apiFetch(`/${key}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (key: string, id: string, data: any) => apiFetch(`/${key}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (key: string, id: string) => apiFetch(`/${key}/${id}`, { method: 'DELETE' }),
    tests: () => apiFetch('/tests'),
    doctors: () => apiFetch('/doctors'),
    packages: () => apiFetch('/packages'),
    lab: () => apiFetch('/lab'),
    updateLab: (data: any) => apiFetch('/lab', { method: 'PATCH', body: JSON.stringify(data) }),
    deleted: () => apiFetch('/deleted'),
    restore: (id: string) => apiFetch(`/deleted/${id}/restore`, { method: 'POST' }),
  },
  doctors: {
    summary: () => apiFetch('/doctors/summary'),
    ledger: (id: string) => apiFetch(`/doctors/${id}/ledger`),
  },
  /** Business config driven by the server's .env (commission, discount cap, plans). */
  config: {
    get: (): Promise<{
      defaultCommissionPercent: number;
      maxDiscountPercent: number;
      currencySymbol: string;
      trialDays: number;
      plans: { monthly: { price: number; days: number }; yearly: { price: number; days: number } };
    }> => apiFetch('/config'),
  },
  commissions: {
    list: () => apiFetch('/commissions'),
    summary: () => apiFetch('/commissions/summary'),
    pay: (data: { doctorId?: string; doctor?: string; amount: number; mode?: string; note?: string }) =>
      apiFetch('/commissions/pay', { method: 'POST', body: JSON.stringify(data) }),
  },
  transactions: {
    list: () => apiFetch('/transactions'),
    summary: () => apiFetch('/transactions/summary'),
    create: (data: any) => apiFetch('/transactions', { method: 'POST', body: JSON.stringify(data) }),
    collect: (data: { reportId: string; amount?: number; mode?: string; txnId?: string; note?: string }) =>
      apiFetch('/transactions/collect', { method: 'POST', body: JSON.stringify(data) }),
  },
  expenses: {
    list: () => apiFetch('/expenses'),
    summary: () => apiFetch('/expenses/summary'),
    categories: () => apiFetch('/expense-categories'),
    create: (data: any) => apiFetch('/expenses', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id: string) => apiFetch(`/expenses/${id}`, { method: 'DELETE' }),
  },
  analytics: () => apiFetch('/analytics'),
  settings: {
    get: () => apiFetch('/settings'),
    update: (data: any) => apiFetch('/settings', { method: 'PATCH', body: JSON.stringify(data) }),
  },
  subscription: {
    get: () => apiFetch('/subscription'),
    plans: () => apiFetch('/subscription/plans'),
    subscribe: (planId: string) => apiFetch('/subscription/subscribe', { method: 'POST', body: JSON.stringify({ planId }) }),
  },
  notifications: {
    list: () => apiFetch('/notifications'),
    count: () => apiFetch('/notifications/count'),
    markRead: (id: string) => apiFetch(`/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () => apiFetch('/notifications/read-all', { method: 'POST' }),
  },
  backup: {
    status: () => apiFetch('/backup/status'),
    export: () => apiFetch('/backup/export'),
    run: () => apiFetch('/backup/run', { method: 'POST' }),
    restore: (payload: any) => apiFetch('/backup/restore', { method: 'POST', body: JSON.stringify(payload) }),
  },
  roles: () => apiFetch('/roles-matrix'),
};
