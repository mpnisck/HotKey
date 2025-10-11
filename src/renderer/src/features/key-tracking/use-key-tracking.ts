import { useEffect, useCallback } from "react";
import { useHotkeyStore } from "../../entities/hot-key";

interface UseKeyTrackingReturn {
  keyboardKeys: Set<string>;
  isKeyActive: boolean;
  isCommandPressed: boolean;
  isOptionPressed: boolean;
  isControlPressed: boolean;
  isShiftPressed: boolean;
  isFnPressed: boolean;
}

export const useKeyTracking = (): UseKeyTrackingReturn => {
  const store = useHotkeyStore();

  const handleKeyDown = useCallback((event: KeyboardEvent): void => {
    const key = event.key.toUpperCase();
    event.preventDefault();

    store.addKeyboardKey(key);

    let isAnyModifierActive = false;

    if (event.metaKey) {
      store.setIsCommandPressed(true);
      isAnyModifierActive = true;
    }
    if (event.altKey) {
      store.setIsOptionPressed(true);
      isAnyModifierActive = true;
    }
    if (event.ctrlKey) {
      store.setIsControlPressed(true);
      isAnyModifierActive = true;
    }
    if (event.shiftKey) {
      store.setIsShiftPressed(true);
      isAnyModifierActive = true;
    }
    if (event.key.toLowerCase() === "fn") {
      store.setIsFnPressed(true);
      isAnyModifierActive = true;
    }

    if (isAnyModifierActive) {
      store.setIsKeyActive(true);
    }
  }, []);

  const handleKeyUp = useCallback((event: KeyboardEvent): void => {
    const key = event.key.toUpperCase();
    store.removeKeyboardKey(key);

    if (!event.metaKey) store.setIsCommandPressed(false);
    if (!event.altKey) store.setIsOptionPressed(false);
    if (!event.ctrlKey) store.setIsControlPressed(false);
    if (!event.shiftKey) store.setIsShiftPressed(false);

    const hasActiveModifier =
      event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;

    if (!hasActiveModifier) {
      store.setIsKeyActive(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

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
