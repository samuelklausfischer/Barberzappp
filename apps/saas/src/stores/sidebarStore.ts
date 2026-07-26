import { create } from 'zustand';

const STORAGE_KEY = 'barberzap:sidebar-collapsed';

const getResponsiveDefault = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches;
};

const readInitialValue = () => {
  if (typeof window === 'undefined') return false;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    // localStorage can be unavailable in private browsing or restricted webviews.
  }
  return getResponsiveDefault();
};

const persistValue = (value: boolean) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // The visual preference remains available for the current session.
  }
};

export interface SidebarState {
  isCollapsed: boolean;
  toggle: () => void;
  setCollapsed: (value: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: readInitialValue(),
  toggle: () => {
    set((state) => {
      const nextValue = !state.isCollapsed;
      persistValue(nextValue);
      return { isCollapsed: nextValue };
    });
  },
  setCollapsed: (value) => {
    persistValue(value);
    set({ isCollapsed: value });
  },
}));
