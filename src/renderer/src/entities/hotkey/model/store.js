import { create } from "zustand";

const useHotkeyStore = create(set => ({
  menuData: {},
  activeApp: "Figma",
  error: "",
  isLoading: false,
  isCommandPressed: false,
  isOptionPressed: false,
  isControlPressed: false,
  isShiftPressed: false,
  isFnPressed: false,
  isKeyActive: false,
  keyboardKeys: new Set(),
  showMenuData: true,

  setMenuData: data => set({ menuData: data }),
  setActiveApp: app => set({ activeApp: app }),
  setError: error => set({ error }),
  setIsLoading: loading => set({ isLoading: loading }),
  setIsCommandPressed: pressed => set({ isCommandPressed: pressed }),
  setIsOptionPressed: pressed => set({ isOptionPressed: pressed }),
  setIsControlPressed: pressed => set({ isControlPressed: pressed }),
  setIsShiftPressed: pressed => set({ isShiftPressed: pressed }),
  setIsFnPressed: pressed => set({ isFnPressed: pressed }),
  setIsKeyActive: active => set({ isKeyActive: active }),

  addKeyboardKey: key =>
    set(state => {
      const upperKey = key.toUpperCase();
      if (state.keyboardKeys.has(upperKey)) return state;
      return { keyboardKeys: new Set(state.keyboardKeys).add(upperKey) };
    }),

  removeKeyboardKey: key =>
    set(state => {
      const upperKey = key.toUpperCase();
      if (!state.keyboardKeys.has(upperKey)) return state;
      const newKeys = new Set(state.keyboardKeys);
      newKeys.delete(upperKey);
      return { keyboardKeys: newKeys };
    }),
}));

export default useHotkeyStore;
