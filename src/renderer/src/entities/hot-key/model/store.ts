import { create } from "zustand";
import { MenuData } from "@/shared/types";

interface HotkeyState {
  menuData: MenuData;
  activeApp: string;
  error: string;
  isLoading: boolean;
  isCommandPressed: boolean;
  isOptionPressed: boolean;
  isControlPressed: boolean;
  isShiftPressed: boolean;
  isFnPressed: boolean;
  isKeyActive: boolean;
  keyboardKeys: Set<string>;
  showMenuData: boolean;
  isArmed: boolean;
  isActivated: boolean;
  longPressProgress: number;
}

interface HotkeyActions {
  setMenuData: (data: MenuData) => void;
  setActiveApp: (app: string) => void;
  setError: (error: string) => void;
  setIsLoading: (loading: boolean) => void;
  setIsCommandPressed: (pressed: boolean) => void;
  setIsOptionPressed: (pressed: boolean) => void;
  setIsControlPressed: (pressed: boolean) => void;
  setIsShiftPressed: (pressed: boolean) => void;
  setIsFnPressed: (pressed: boolean) => void;
  setIsKeyActive: (active: boolean) => void;
  addKeyboardKey: (key: string) => void;
  removeKeyboardKey: (key: string) => void;
  setIsArmed: (armed: boolean) => void;
  setIsActivated: (activated: boolean) => void;
  setLongPressProgress: (progress: number) => void;
  resetActivation: () => void;
}

type HotkeyStore = HotkeyState & HotkeyActions;

const useHotkeyStore = create<HotkeyStore>((set) => ({
  menuData: {},
  activeApp: "",
  error: "",
  isLoading: false,
  isCommandPressed: false,
  isOptionPressed: false,
  isControlPressed: false,
  isShiftPressed: false,
  isFnPressed: false,
  isKeyActive: false,
  keyboardKeys: new Set<string>(),
  showMenuData: true,
  isArmed: false,
  isActivated: false,
  longPressProgress: 0,

  setMenuData: (data: MenuData) => set({ menuData: data }),
  setActiveApp: (app: string) => set({ activeApp: app }),
  setError: (error: string) => set({ error }),
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  setIsCommandPressed: (pressed: boolean) => set({ isCommandPressed: pressed }),
  setIsOptionPressed: (pressed: boolean) => set({ isOptionPressed: pressed }),
  setIsControlPressed: (pressed: boolean) => set({ isControlPressed: pressed }),
  setIsShiftPressed: (pressed: boolean) => set({ isShiftPressed: pressed }),
  setIsFnPressed: (pressed: boolean) => set({ isFnPressed: pressed }),
  setIsKeyActive: (active: boolean) => set({ isKeyActive: active }),

  addKeyboardKey: (key: string) =>
    set((state) => {
      const upperKey = key.toUpperCase();
      if (state.keyboardKeys.has(upperKey)) return state;
      return { keyboardKeys: new Set(state.keyboardKeys).add(upperKey) };
    }),

  removeKeyboardKey: (key: string) =>
    set((state) => {
      const upperKey = key.toUpperCase();
      if (!state.keyboardKeys.has(upperKey)) return state;
      const newKeys = new Set(state.keyboardKeys);
      newKeys.delete(upperKey);
      return { keyboardKeys: newKeys };
    }),

  setIsArmed: (armed: boolean) => set({ isArmed: armed }),
  setIsActivated: (activated: boolean) => set({ isActivated: activated }),
  setLongPressProgress: (progress: number) =>
    set({ longPressProgress: progress }),
  resetActivation: () =>
    set({
      isArmed: false,
      isActivated: false,
      longPressProgress: 0,
      menuData: {},
      activeApp: "",
    }),
}));

export default useHotkeyStore;
