import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const TOKEN_KEY = 'pathonexa.auth.token';
const REQUEST_TIMEOUT_MS = 15_000;
let memoryToken: string | null = null;
let desiredToken: string | null | undefined;
let tokenRevision = 0;
// Preserve invocation order across SecureStore/localStorage so an old async
// save or removal cannot overwrite the credential for a newer account.
let tokenStorageQueue: Promise<void> = Promise.resolve();
let unauthorizedHandler: (() => void | Promise<void>) | null = null;

function queueTokenStorage<T>(operation: () => T | Promise<T>) {
  const result = tokenStorageQueue.then(operation, operation);
  tokenStorageQueue = result.then(() => undefined, () => undefined);
  return result;
}

function normalizeApiUrl(value: string) {
  const clean = value.trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
}

function resolveApiUrl() {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return normalizeApiUrl(explicit);

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    if (hostname.match(/^\d+-.*\.e2b\.app$/)) {
      return normalizeApiUrl(origin.replace(/^https:\/\/\d+-/, 'https://5000-'));
    }
    if (['localhost', '127.0.0.1'].includes(hostname)) return 'http://localhost:5000/api';
    // Production web deployments may reverse-proxy `/api` on the same origin.
    return normalizeApiUrl(origin);
  }

  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
    const host = hostUri?.split(':')[0];
    if (host && !['localhost', '127.0.0.1'].includes(host)) return `http://${host}:5000/api`;
    if (Platform.OS === 'android') return 'http://10.0.2.2:5000/api';
    return 'http://localhost:5000/api';
  }

  // Native release builds must never silently target the device itself.
  return '';
}

export const API_URL = resolveApiUrl();

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 0, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function webStorage() {
  return Platform.OS === 'web' && typeof window !== 'undefined' ? window.localStorage : null;
}

export async function loadToken() {
  if (desiredToken !== undefined) return desiredToken;
  if (memoryToken) return memoryToken;
  const revision = tokenRevision;
  return queueTokenStorage(async () => {
    if (memoryToken) return memoryToken;
    try {
      const storage = webStorage();
      const loaded = storage ? storage.getItem(TOKEN_KEY) : await SecureStore.getItemAsync(TOKEN_KEY);
      if (revision === tokenRevision) {
        memoryToken = loaded;
        desiredToken = loaded;
      }
    } catch {
      if (revision === tokenRevision) {
        memoryToken = null;
        desiredToken = null;
      }
    }
    return memoryToken;
  });
}

export async function saveToken(token: string) {
  const revision = ++tokenRevision;
  desiredToken = token;
  memoryToken = null;
  try {
    await queueTokenStorage(async () => {
      const storage = webStorage();
      if (storage) storage.setItem(TOKEN_KEY, token);
      else await SecureStore.setItemAsync(TOKEN_KEY, token, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      if (revision === tokenRevision) memoryToken = token;
    });
  } catch (error) {
    if (revision === tokenRevision) desiredToken = null;
    throw error;
  }
}

export async function removeToken(expectedToken?: string) {
  const logicalToken = desiredToken === undefined ? memoryToken : desiredToken;
  if (expectedToken && logicalToken !== expectedToken) return;
  tokenRevision += 1;
  desiredToken = null;
  memoryToken = null;
  await queueTokenStorage(async () => {
    const storage = webStorage();
    if (storage) storage.removeItem(TOKEN_KEY);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  });
}

export function onUnauthorized(handler: (() => void | Promise<void>) | null) {
  unauthorizedHandler = handler;
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  authenticated?: boolean;
  timeoutMs?: number;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, authenticated = true, timeoutMs = REQUEST_TIMEOUT_MS, ...fetchOptions } = options;
  if (!API_URL) throw new ApiError('PathoNexa server URL is not configured for this app build.');
  const token = authenticated ? await loadToken() : null;
  if (authenticated && !token) throw new ApiError('Authentication required', 401);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(fetchOptions.headers ?? {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();
    let payload: any = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }

    if (!response.ok) {
      // A delayed response made with an older account token must never clear a
      // newer session that has since been established on this device.
      const currentToken = desiredToken === undefined ? memoryToken : desiredToken;
      if (response.status === 401 && authenticated && token === currentToken) await unauthorizedHandler?.();
      throw new ApiError(payload?.message ?? `Request failed (${response.status})`, response.status, payload);
    }
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if ((error as Error)?.name === 'AbortError') {
      throw new ApiError('The server took too long to respond. Please try again.');
    }
    throw new ApiError('Unable to connect to the PathoNexa server. Check your internet connection and try again.');
  } finally {
    clearTimeout(timeout);
  }
}

function queryString(values: Record<string, string | number | boolean | undefined>) {
  const query = Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return query ? `?${query}` : '';
}

export type AuthUser = { id: string; mobile: string; name: string; role: string };
export type LabSettings = {
  name: string;
  shortName?: string;
  city?: string;
  labId?: string;
  phone?: string;
  altPhone?: string;
  email?: string;
  website?: string;
  address?: string;
  pathologist?: string;
  gst?: string;
  logo?: string;
  signature?: string;
  stamp?: string;
  footer?: string;
  reportNote?: string;
  theme?: string;
  language?: string;
  autoPrint?: boolean;
  notifications?: boolean;
  ownerVerification?: boolean;
  autoBackup?: boolean;
  currency?: string;
};
export type Patient = {
  _id: string;
  id?: string;
  pid: string;
  name: string;
  age: number;
  gender: string;
  mobile?: string;
  blood?: string;
  city?: string;
  address?: string;
  totalReports?: number;
  lastVisit?: string;
  lastTest?: string;
  lastTestDate?: string;
  createdAt?: string;
};
export type ReportValue = {
  testId?: string;
  test?: string;
  group?: string;
  name: string;
  short?: string;
  unit?: string;
  range?: string;
  value: string;
};
export type ReportTest = { id?: string; name: string; short?: string; category?: string; price?: number };
export type Report = {
  _id: string;
  id?: string;
  reportId: string;
  patient: Patient;
  test: string;
  doctor?: string;
  amount: number;
  paidAmount?: number;
  pendingAmount?: number;
  paid?: boolean;
  paymentMode?: string;
  status: string;
  date?: string;
  createdAt?: string;
  sampleDate?: string;
  reportDate?: string;
  remarks?: string;
  verified?: boolean;
  verifiedBy?: string;
  tests?: ReportTest[];
  values?: ReportValue[];
  parameters?: ReportValue[];
};
export type Pagination = { page: number; limit: number; total: number; pages: number; hasMore: boolean };
export type Paged<T> = { items: T[]; pagination: Pagination };

export const api = {
  auth: {
    requestOtp: (mobile: string) => apiRequest<{ message: string; expiresInSeconds: number }>('/auth/login', {
      method: 'POST', body: { mobile }, authenticated: false,
    }),
    verifyOtp: (mobile: string, otp: string) => apiRequest<{ token: string; user: AuthUser }>('/auth/verify', {
      method: 'POST', body: { mobile, otp }, authenticated: false,
    }),
    me: () => apiRequest<{ user: AuthUser }>('/auth/me'),
  },
  dashboard: {
    stats: () => apiRequest<Array<{ key: string; label: string; value: string; sub: string; tone: string }>>('/dashboard/stats'),
    chart: () => apiRequest<{ labels: string[]; values: number[]; totalReports: string; totalRevenue: string; avgPerDay: string }>('/dashboard/chart'),
  },
  patients: {
    list: (params: { page?: number; limit?: number; search?: string; gender?: string } = {}) =>
      apiRequest<Paged<Patient>>(`/patients${queryString(params)}`),
    stats: () => apiRequest<Array<{ label: string; value: string; tone: string }>>('/patients/stats'),
    get: (id: string) => apiRequest<Patient>(`/patients/${encodeURIComponent(id)}`),
    create: (data: Partial<Patient>) => apiRequest<Patient>('/patients', { method: 'POST', body: data }),
    update: (id: string, data: Partial<Patient>) => apiRequest<Patient>(`/patients/${encodeURIComponent(id)}`, { method: 'PATCH', body: data }),
    remove: (id: string) => apiRequest<{ message: string }>(`/patients/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  },
  reports: {
    list: (params: { page?: number; limit?: number; search?: string; status?: string; from?: string; to?: string } = {}) =>
      apiRequest<Paged<Report>>(`/reports${queryString(params)}`),
    stats: () => apiRequest<Array<{ label: string; value: string; tone: string }>>('/reports/stats'),
    nextId: () => apiRequest<{ reportId: string }>('/reports/next-id'),
    get: (id: string) => apiRequest<Report>(`/reports/${encodeURIComponent(id)}`),
    create: (data: Record<string, unknown>) => apiRequest<Report>('/reports', { method: 'POST', body: data }),
    update: (id: string, data: Partial<Report>) => apiRequest<Report>(`/reports/${encodeURIComponent(id)}`, { method: 'PATCH', body: data }),
    remove: (id: string) => apiRequest<{ message: string }>(`/reports/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  },
  meta: {
    list: <T = Record<string, any>>(key: string) => apiRequest<T[]>(`/${encodeURIComponent(key)}`),
    create: <T = Record<string, any>>(key: string, data: Record<string, unknown>) =>
      apiRequest<T>(`/${encodeURIComponent(key)}`, { method: 'POST', body: data }),
  },
  notifications: {
    list: (params: { page?: number; limit?: number; unread?: boolean } = {}) =>
      apiRequest<Paged<ApiNotification>>(`/notifications${queryString(params)}`),
    count: () => apiRequest<{ unread: number }>('/notifications/count'),
    markRead: (id: string) => apiRequest<{ id: string; read: boolean }>(`/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' }),
    markAllRead: () => apiRequest<{ read: number }>('/notifications/read-all', { method: 'POST' }),
  },
  settings: () => apiRequest<LabSettings>('/settings'),
  updateSettings: (data: Partial<LabSettings>) => apiRequest<LabSettings>('/settings', { method: 'PATCH', body: data }),
  subscription: () => apiRequest<Record<string, any>>('/subscription'),
};

export type ApiNotification = {
  id: string;
  type: string;
  tone?: string;
  title: string;
  subtitle?: string;
  at?: string;
  read: boolean;
  reportId?: string;
  patientId?: string;
};
