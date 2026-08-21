import React from 'react';

export const DEMO_OTP = '123456';

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
  pendingPhone: string | null;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<boolean>;
  clearPendingPhone: () => void;
  logout: () => void;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

const pause = (duration: number) => new Promise<void>((resolve) => setTimeout(resolve, duration));

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setAuthenticated] = React.useState(false);
  const [pendingPhone, setPendingPhone] = React.useState<string | null>(null);
  const requestVersion = React.useRef(0);

  const requestOtp = React.useCallback(async (phone: string) => {
    if (!isValidIndianMobile(phone)) throw new Error('Enter a valid mobile number.');
    requestVersion.current += 1;
    setAuthenticated(false);
    setPendingPhone(phone);
    await pause(350);
  }, []);

  const verifyOtp = React.useCallback(
    async (otp: string) => {
      const version = requestVersion.current;
      await pause(450);
      if (version !== requestVersion.current || !pendingPhone || otp !== DEMO_OTP) return false;
      setAuthenticated(true);
      return true;
    },
    [pendingPhone],
  );

  const clearPendingPhone = React.useCallback(() => {
    requestVersion.current += 1;
    setPendingPhone(null);
  }, []);

  const logout = React.useCallback(() => {
    requestVersion.current += 1;
    setAuthenticated(false);
    setPendingPhone(null);
  }, []);

  const value = React.useMemo(
    () => ({ isAuthenticated, pendingPhone, requestOtp, verifyOtp, clearPendingPhone, logout }),
    [isAuthenticated, pendingPhone, requestOtp, verifyOtp, clearPendingPhone, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
