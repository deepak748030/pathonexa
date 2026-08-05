import * as React from "react";

export type Address = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
};

const KEY = "castlefeed_address_v1";

type Ctx = {
  address: Address | null;
  saveAddress: (a: Address) => void;
  clearAddress: () => void;
  hasAddress: boolean;
};

const AddressCtx = React.createContext<Ctx | null>(null);

function read(): Address | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Address) : null;
  } catch {
    return null;
  }
}

export function AddressProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = React.useState<Address | null>(null);

  React.useEffect(() => {
    setAddress(read());
  }, []);

  const saveAddress = (a: Address) => {
    setAddress(a);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(a));
    } catch {
      /* ignore */
    }
  };

  const clearAddress = () => {
    setAddress(null);
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <AddressCtx.Provider value={{ address, saveAddress, clearAddress, hasAddress: !!address }}>
      {children}
    </AddressCtx.Provider>
  );
}

export function useAddress() {
  const ctx = React.useContext(AddressCtx);
  if (!ctx) throw new Error("useAddress must be used within AddressProvider");
  return ctx;
}
