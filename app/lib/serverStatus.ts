import { create } from 'zustand';
import { endpoints } from './api';

type ServerStatusState = {
  /** null = not checked yet, true = reachable, false = unreachable */
  online: boolean | null;
  /** 'mongodb' | 'memory' | null — reported by /api/health */
  dbMode: string | null;
  checking: boolean;
  check: () => Promise<boolean>;
};

export const useServerStatus = create<ServerStatusState>((set) => ({
  online: null,
  dbMode: null,
  checking: false,
  check: async () => {
    set({ checking: true });
    try {
      const res = await endpoints.health();
      set({ online: true, dbMode: res?.db || null, checking: false });
      return true;
    } catch {
      set({ online: false, dbMode: null, checking: false });
      return false;
    }
  },
}));
