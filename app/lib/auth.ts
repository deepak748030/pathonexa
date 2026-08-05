import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'pathonexa.session';

/** Demo OTP accepted by the login flow. */
export const DEMO_OTP = '123456';

type AuthState = {
  mobile: string | null;
  ready: boolean;
  hydrate: () => Promise<void>;
  login: (mobile: string) => Promise<void>;
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
    await AsyncStorage.setItem(KEY, mobile);
    set({ mobile });
  },
  logout: async () => {
    await AsyncStorage.removeItem(KEY);
    set({ mobile: null });
  },
}));
