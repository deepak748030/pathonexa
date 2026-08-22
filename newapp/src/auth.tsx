import React from 'react';
import { api, AuthUser, loadToken, onUnauthorized, removeToken, saveToken } from './api';

export function normalizeIndianMobile(value: string) {
  const digits = value.replace(/\D/g, '');
  const nationalNumber = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return nationalNumber.slice(0, 10);
}

export function isValidIndianMobile(value: string) {
  return /^[6-9]\d{9}$/.test(value);
}

export function formatIndianMobile(value: string) {
  if (value.length !== 10) return `+91 ${value}`.trim();
  return `+91 ${value.slice(0, 5)} ${value.slice(5)}`;
}

type AuthContextValue = {
  isAuthenticated: boolean;
  isReady: boolean;
  /** True for a signed-in account that has not completed name + email setup. */
  needsOnboarding: boolean;
  pendingPhone: string | null;
  user: AuthUser | null;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<boolean>;
  clearPendingPhone: () => void;
  completeProfile: (name: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setReady] = React.useState(false);
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [pendingPhone, setPendingPhone] = React.useState<string | null>(null);
  const requestVersion = React.useRef(0);

  const clearSession = React.useCallback(async () => {
    requestVersion.current += 1;
    setUser(null);
    setPendingPhone(null);
    try {
      await removeToken();
    } catch {
      // removeToken clears the in-memory credential before touching device
      // storage, so the active session still closes safely if storage fails.
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    onUnauthorized(clearSession);
    (async () => {
      try {
        if (!(await loadToken())) return;
        const response = await api.auth.me();
        if (active) setUser(response.user);
      } catch {
        try {
          await removeToken();
        } catch {
          // The in-memory credential is already cleared even if storage fails.
        }
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
      onUnauthorized(null);
    };
  }, [clearSession]);

  const requestOtp = React.useCallback(async (phone: string) => {
    const normalized = normalizeIndianMobile(phone);
    if (!isValidIndianMobile(normalized)) throw new Error('Enter a valid mobile number.');
    const version = ++requestVersion.current;
    await api.auth.requestOtp(normalized);
    if (version === requestVersion.current) {
      setUser(null);
      setPendingPhone(normalized);
    }
  }, []);

  const verifyOtp = React.useCallback(async (otp: string) => {
    if (!pendingPhone) throw new Error('Request a new OTP to continue.');
    const version = requestVersion.current;
    try {
      const response = await api.auth.verifyOtp(pendingPhone, otp);
      if (version !== requestVersion.current) return false;
      await saveToken(response.token);
      if (version !== requestVersion.current) {
        try {
          await removeToken(response.token);
        } catch {
          // The stale token is still cleared from active memory.
        }
        return false;
      }
      setUser(response.user);
      setPendingPhone(null);
      return true;
    } catch (error: any) {
      if (error?.status === 400 || error?.status === 429) return false;
      throw error;
    }
  }, [pendingPhone]);

  const clearPendingPhone = React.useCallback(() => {
    requestVersion.current += 1;
    setPendingPhone(null);
  }, []);

  const completeProfile = React.useCallback(async (name: string, email: string) => {
    const response = await api.auth.updateProfile({ name, email });
    setUser(response.user);
  }, []);

  // A fresh account is created with the default name and no email; treat that
  // as "needs onboarding" so the user is prompted to complete their profile.
  const needsOnboarding = !!user && (!user.email || user.name === 'Lab Owner');

  const value = React.useMemo<AuthContextValue>(() => ({
    isAuthenticated: !!user,
    isReady,
    needsOnboarding,
    pendingPhone,
    user,
    requestOtp,
    verifyOtp,
    clearPendingPhone,
    completeProfile,
    logout: clearSession,
  }), [clearPendingPhone, clearSession, completeProfile, isReady, needsOnboarding, pendingPhone, requestOtp, user, verifyOtp]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
