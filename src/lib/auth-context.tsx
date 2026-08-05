import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type MockUser = {
  phone: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

type AuthCtx = {
  user: MockUser | null;
  loading: boolean;
  sendOtp: (phone: string) => Promise<{ otp: string }>;
  verifyOtp: (phone: string, otp: string, name?: string) => Promise<{ isNew: boolean }>;
  signOut: () => void;
  updateProfile: (patch: Partial<Pick<MockUser, "display_name" | "avatar_url">>) => void;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);
const STORAGE_KEY = "castlefeed:auth-user";
const OTP_KEY = "castlefeed:auth-otp";
const KNOWN_PHONES_KEY = "castlefeed:known-phones";

function readKnownPhones(): string[] {
  try {
    const raw = localStorage.getItem(KNOWN_PHONES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  const persist = (u: MockUser | null) => {
    setUser(u);
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const sendOtp = async (phone: string) => {
    await new Promise((r) => setTimeout(r, 600));
    const otp = "123456";
    sessionStorage.setItem(OTP_KEY, JSON.stringify({ phone, otp }));
    return { otp };
  };

  const verifyOtp = async (phone: string, otp: string, name?: string) => {
    await new Promise((r) => setTimeout(r, 500));
    const raw = sessionStorage.getItem(OTP_KEY);
    if (!raw) throw new Error("Please request a new OTP");
    const stored = JSON.parse(raw) as { phone: string; otp: string };
    if (stored.phone !== phone) throw new Error("Phone number changed, request a new OTP");
    if (stored.otp !== otp) throw new Error("Incorrect OTP");
    sessionStorage.removeItem(OTP_KEY);
    const known = readKnownPhones();
    const isNew = !known.includes(phone);
    if (isNew) {
      try {
        localStorage.setItem(KNOWN_PHONES_KEY, JSON.stringify([...known, phone]));
      } catch {}
    }
    persist({
      phone,
      display_name: name?.trim() || `Farmer ${phone.slice(-4)}`,
      avatar_url: null,
      created_at: new Date().toISOString(),
    });
    return { isNew };
  };

  const signOut = () => persist(null);

  const updateProfile: AuthCtx["updateProfile"] = (patch) => {
    if (!user) return;
    persist({ ...user, ...patch });
  };

  return (
    <Ctx.Provider value={{ user, loading, sendOtp, verifyOtp, signOut, updateProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
