import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://pathonexa-server.vercel.app/api';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem('pathonexa.token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'Something went wrong';
    try {
      const error = await response.json();
      errorMessage = error.message || errorMessage;
    } catch (e) {
      // If it's not JSON, try text
      try {
        const text = await response.text();
        errorMessage = text || errorMessage;
      } catch (t) {}
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const endpoints = {
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
    create: (data: any) => apiFetch('/patients', { method: 'POST', body: JSON.stringify(data) }),
  },
  reports: {
    getAll: () => apiFetch('/reports'),
    create: (data: any) => apiFetch('/reports', { method: 'POST', body: JSON.stringify(data) }),
  },
};