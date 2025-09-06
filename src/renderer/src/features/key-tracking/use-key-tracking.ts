import { useEffect } from "react";
import { useHotkeyStore } from "../../entities/hot-key";
import { modifierKeys } from "../../shared/config/keyboard";

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

  const handleKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toUpperCase();
    event.preventDefault();

    store.addKeyboardKey(key);

    let isAnyModifierActive = false;

    Object.values(modifierKeys).forEach(({ setter, checker }) => {
      if (event[checker as keyof KeyboardEvent]) {
        (store as any)[setter](true);
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

  const handleKeyUp = (event: KeyboardEvent): void => {
    const key = event.key.toUpperCase();
    store.removeKeyboardKey(key);

    Object.values(modifierKeys).forEach(({ setter, checker }) => {
      if (!event[checker as keyof KeyboardEvent]) {
        (store as any)[setter](false);
      }
    });

    const hasActiveModifier = Object.values(modifierKeys).some(
      ({ checker }) => event[checker as keyof KeyboardEvent]
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
