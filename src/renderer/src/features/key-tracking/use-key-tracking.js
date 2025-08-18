import { useEffect } from "react";
import { useHotkeyStore } from "../../entities/hotkey";
import { modifierKeys } from "../../shared/config/keyboard";

export const useKeyTracking = () => {
  const store = useHotkeyStore();

  const handleKeyDown = event => {
    const key = event.key.toUpperCase();
    event.preventDefault();

    store.addKeyboardKey(key);

    let isAnyModifierActive = false;

    Object.values(modifierKeys).forEach(({ setter, checker }) => {
      if (event[checker]) {
        store[setter](true);
        isAnyModifierActive = true;
      }
    });

    if (event.key.toLowerCase() === "fn") {
      store.setIsFnPressed(true);
      isAnyModifierActive = true;
    }

    if (isAnyModifierActive) {
      store.setIsKeyActive(true);
    }
  };

  const handleKeyUp = event => {
    const key = event.key.toUpperCase();
    store.removeKeyboardKey(key);

    Object.values(modifierKeys).forEach(({ setter, checker }) => {
      if (!event[checker]) {
        store[setter](false);
      }
    });

    const hasActiveModifier = Object.values(modifierKeys).some(
      ({ checker }) => event[checker]
    );

    if (!hasActiveModifier) {
      store.setIsKeyActive(false);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return {
    keyboardKeys: store.keyboardKeys,
    isKeyActive: store.isKeyActive,
    isCommandPressed: store.isCommandPressed,
    isOptionPressed: store.isOptionPressed,
    isControlPressed: store.isControlPressed,
    isShiftPressed: store.isShiftPressed,
    isFnPressed: store.isFnPressed,
  };
};
