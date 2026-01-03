import { useEffect } from "react";
import { useHotkeyStore } from "@/entities/hot-key";

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

  useEffect(() => {
    const pressedKeys = new Set<string>();

    const handleKeyDown = (event: KeyboardEvent): void => {
      const key = event.key.toUpperCase();
      const code = event.code;

      event.preventDefault();

      pressedKeys.add(key);
      if (code) pressedKeys.add(code);
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

      const isFnPressed =
        event.key.toLowerCase() === "fn" ||
        code === "Fn" ||
        code === "Function";
      const isGlobePressed =
        event.key === "Globe" ||
        event.key === "Lang1" ||
        code === "Lang1" ||
        code === "IntlBackslash";

      if (isFnPressed || isGlobePressed) {
        store.setIsFnPressed(true);
        isAnyModifierActive = true;
      }

      if (isAnyModifierActive) {
        store.setIsKeyActive(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      const key = event.key.toUpperCase();
      const code = event.code;

      pressedKeys.delete(key);
      if (code) pressedKeys.delete(code);
      store.removeKeyboardKey(key);

      if (!event.metaKey) store.setIsCommandPressed(false);
      if (!event.altKey) store.setIsOptionPressed(false);
      if (!event.ctrlKey) store.setIsControlPressed(false);
      if (!event.shiftKey) store.setIsShiftPressed(false);

      const isFnStillPressed =
        pressedKeys.has("FN") ||
        pressedKeys.has("Fn") ||
        pressedKeys.has("Function") ||
        event.key.toLowerCase() === "fn" ||
        code === "Fn" ||
        code === "Function";
      const isGlobeStillPressed =
        pressedKeys.has("GLOBE") ||
        pressedKeys.has("Lang1") ||
        pressedKeys.has("IntlBackslash") ||
        event.key === "Globe" ||
        event.key === "Lang1" ||
        code === "Lang1" ||
        code === "IntlBackslash";

      if (!isFnStillPressed && !isGlobeStillPressed) {
        store.setIsFnPressed(false);
      }

      const hasActiveModifier =
        event.metaKey ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey ||
        isFnStillPressed ||
        isGlobeStillPressed;

      if (!hasActiveModifier) {
        store.setIsKeyActive(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [store]);

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
