import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { endpoints } from './api';

const KEY = 'pathonexa.session';
const TOKEN_KEY = 'pathonexa.token';

/** Demo OTP accepted by the login flow. */
export const DEMO_OTP = '123456';

type AuthState = {
  mobile: string | null;
  ready: boolean;
  hydrate: () => Promise<void>;
  login: (mobile: string) => Promise<void>;
  verifyOtp: (mobile: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  mobile: null,
  ready: false,
  hydrate: async () => {
    try {
      const v = await AsyncStorage.getItem(KEY);
      set({ mobile: v, ready: true });
    } catch {
      set({ ready: true });
    }
  },
  login: async (mobile: string) => {
    // In prod, this calls backend to send OTP
    try {
      await endpoints.auth.login(mobile);
    } catch (e) {
      console.warn('API login failed, falling back to demo mode', e);
    }
  },
  verifyOtp: async (mobile: string, otp: string) => {
    try {
      const res = await endpoints.auth.verify(mobile, otp);
      await AsyncStorage.setItem(TOKEN_KEY, res.token);
      await AsyncStorage.setItem(KEY, mobile);
      set({ mobile });
    } catch (e) {
      // For testing without server
      if (otp === DEMO_OTP) {
        await AsyncStorage.setItem(KEY, mobile);
        set({ mobile });
      } else {
        throw e;
      }
    }
  },
  logout: async () => {
    await AsyncStorage.removeItem(KEY);
    await AsyncStorage.removeItem(TOKEN_KEY);
    set({ mobile: null });
  },
}));
