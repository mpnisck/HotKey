import { create } from "zustand";

const useHotkeyStore = create((set) => ({
  menuData: {},
  activeApp: "Figma",
  error: "",
  isLoading: false,
  isCommandPressed: false,
  isOptionPressed: false,
  isControlPressed: false,
  isShiftPressed: false,
  isBackspacePressed: false,
  isFnPressed: false,
  isKeyActive: false,
  pressedKeys: new Set(),
  keyboardKeys: new Set(),
  showMenuData: false,

  setMenuData: (data) => set({ menuData: data }),
  setActiveApp: (app) => set({ activeApp: app }),
  setError: (error) => set({ error }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsCommandPressed: (pressed) =>
    set({ isCommandPressed: pressed, isKeyActive: pressed }),
  setIsOptionPressed: (pressed) =>
    set({ isOptionPressed: pressed, isKeyActive: pressed }),
  setIsControlPressed: (pressed) => set({ isControlPressed: pressed }),
  setIsShiftPressed: (pressed) => set({ isShiftPressed: pressed }),
  setIsBackspacePressed: (pressed) => set({ isBackspacePressed: pressed }),
  setIsFnPressed: (pressed) =>
    set({ isFnPressed: pressed, isKeyActive: pressed }),
  setIsKeyActive: (active) => set({ isKeyActive: active }),
  setShowMenuData: (value) =>
    set((state) => {
      const newShowMenuData =
        typeof value === "function" ? value(state.showMenuData) : value;
      return { showMenuData: newShowMenuData };
    }),

  addPressedKey: (key) =>
    set((state) => ({
      pressedKeys: new Set(state.pressedKeys).add(key.toLowerCase()),
    })),

  removePressedKey: (key) =>
    set((state) => {
      const newKeys = new Set(state.pressedKeys);
      newKeys.delete(key.toLowerCase());
      return { pressedKeys: newKeys };
    }),

  addKeyboardKey: (key) =>
    set((state) => ({
      keyboardKeys: new Set(state.keyboardKeys).add(key.toUpperCase()),
    })),

  removeKeyboardKey: (key) =>
    set((state) => {
      const newKeys = new Set(state.keyboardKeys);
      newKeys.delete(key.toUpperCase());
      return { keyboardKeys: newKeys };
    }),
}));

export default useHotkeyStore;
