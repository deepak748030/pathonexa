import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { endpoints, TOKEN_KEY } from './api';

const KEY = 'pathonexa.session';
const USER_KEY = 'pathonexa.user';

/** Demo OTP accepted by the backend (and offline mode). */
export const DEMO_OTP = '123456';

type AuthState = {
  mobile: string | null;
  user: { mobile: string; name: string; role: string } | null;
  ready: boolean;
  /** true when the last auth call could not reach the server */
  offline: boolean;
  hydrate: () => Promise<void>;
  login: (mobile: string) => Promise<void>;
  verifyOtp: (mobile: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  mobile: null,
  user: null,
  ready: false,
  offline: false,
  hydrate: async () => {
    try {
      const [mobile, rawUser] = await Promise.all([
        AsyncStorage.getItem(KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);
      set({
        mobile,
        user: rawUser ? JSON.parse(rawUser) : null,
        ready: true,
      });
    } catch {
      set({ ready: true });
    }
  },
  login: async (mobile: string) => {
    // Server-first: the backend acknowledges the mobile number.
    try {
      await endpoints.auth.login(mobile);
      set({ offline: false });
    } catch (e) {
      set({ offline: true });
      throw e;
    }
  },
  verifyOtp: async (mobile: string, otp: string) => {
    try {
      const res = await endpoints.auth.verify(mobile, otp);
      await AsyncStorage.setItem(TOKEN_KEY, res.token);
      await AsyncStorage.setItem(KEY, mobile);
      if (res.user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(res.user));
      set({ mobile, user: res.user || null, offline: false });
    } catch (e: any) {
      const unreachable = /cannot reach|timed out/i.test(e?.message || '');
      if (unreachable && otp === DEMO_OTP) {
        // Offline demo: only the demo OTP is accepted when the server is down.
        await AsyncStorage.setItem(KEY, mobile);
        set({ mobile, user: null, offline: true });
      } else {
        throw e;
      }
    }
  },
  logout: async () => {
    await AsyncStorage.multiRemove([KEY, TOKEN_KEY, USER_KEY]);
    set({ mobile: null, user: null, offline: false });
  },
}));
