import { useEffect, useRef, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useHotkeyStore } from "@/entities/hot-key";

const getStoreActions = () => useHotkeyStore.getState();

const LONG_PRESS_DURATION = 2000;

interface UseKeyTrackingReturn {
  keyboardKeys: Set<string>;
  isKeyActive: boolean;
  isCommandPressed: boolean;
  isOptionPressed: boolean;
  isControlPressed: boolean;
  isShiftPressed: boolean;
  isFnPressed: boolean;
  isArmed: boolean;
  isActivated: boolean;
  longPressProgress: number;
}

export const useKeyTracking = (
  onLongPressCommand?: (appName?: string) => void
): UseKeyTrackingReturn => {
  const {
    keyboardKeys,
    isKeyActive,
    isCommandPressed,
    isOptionPressed,
    isControlPressed,
    isShiftPressed,
    isFnPressed,
    isArmed,
    isActivated,
    longPressProgress,
  } = useHotkeyStore(
    useShallow((state) => ({
      keyboardKeys: state.keyboardKeys,
      isKeyActive: state.isKeyActive,
      isCommandPressed: state.isCommandPressed,
      isOptionPressed: state.isOptionPressed,
      isControlPressed: state.isControlPressed,
      isShiftPressed: state.isShiftPressed,
      isFnPressed: state.isFnPressed,
      isArmed: state.isArmed,
      isActivated: state.isActivated,
      longPressProgress: state.longPressProgress,
    }))
  );

  const commandPressedRef = useRef<boolean>(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressStartRef = useRef<number>(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const onLongPressCommandRef = useRef(onLongPressCommand);

  useEffect(() => {
    onLongPressCommandRef.current = onLongPressCommand;
  }, [onLongPressCommand]);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    longPressStartRef.current = 0;
    getStoreActions().updateActivationState({ longPressProgress: 0 });
  }, []);

  const startLongPress = useCallback(() => {
    const actions = getStoreActions();
    if (actions.isActivated) return;

    longPressStartRef.current = Date.now();

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - longPressStartRef.current;
      const progress = Math.min((elapsed / LONG_PRESS_DURATION) * 100, 100);
      getStoreActions().updateActivationState({ longPressProgress: progress });
    }, 50);

    longPressTimerRef.current = setTimeout(() => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      longPressTimerRef.current = null;
      longPressStartRef.current = 0;

      getStoreActions().updateActivationState({
        isActivated: true,
        longPressProgress: 0,
      });
      onLongPressCommandRef.current?.();
    }, LONG_PRESS_DURATION);
  }, []);

  useEffect(() => {
    if (!window.api?.on) return;

    const unsubscribeState = window.api.on("global-key-state", (data) => {
      const actions = getStoreActions();

      if (data.key === "command") {
        actions.updateModifierKeys({ isCommandPressed: data.pressed });
        actions.setIsKeyActive(data.pressed);
      }
    });

    const unsubscribeProgress = window.api.on(
      "global-key-progress",
      (progress) => {
        getStoreActions().updateActivationState({
          longPressProgress: progress,
        });
      }
    );

    const unsubscribeActivated = window.api.on(
      "global-key-activated",
      (data) => {
        const actions = getStoreActions();
        actions.updateActivationState({ isActivated: data.activated });
        if (data.activated) {
          onLongPressCommandRef.current?.(data.appName);
        }
      }
    );

    return () => {
      unsubscribeState();
      unsubscribeProgress();
      unsubscribeActivated();
    };
  }, []);

  useEffect(() => {
    const pressedKeys = new Set<string>();

    const handleKeyDown = (event: KeyboardEvent): void => {
      try {
        const actions = getStoreActions();
        const key = event.key.toUpperCase();
        const code = event.code;

        event.preventDefault();

        pressedKeys.add(key);
        if (code) pressedKeys.add(code);
        actions.addKeyboardKey(key);

        const modifierUpdates: Partial<{
          isCommandPressed: boolean;
          isOptionPressed: boolean;
          isControlPressed: boolean;
          isShiftPressed: boolean;
          isFnPressed: boolean;
        }> = {};

        let isAnyModifierActive = false;

        if (event.metaKey) {
          modifierUpdates.isCommandPressed = true;
          isAnyModifierActive = true;

          if (!commandPressedRef.current) {
            commandPressedRef.current = true;
            if (!event.altKey && !event.ctrlKey && !event.shiftKey) {
              startLongPress();
            }
          }
        }
        if (event.altKey) {
          modifierUpdates.isOptionPressed = true;
          isAnyModifierActive = true;
          clearLongPressTimer();
        }
        if (event.ctrlKey) {
          modifierUpdates.isControlPressed = true;
          isAnyModifierActive = true;
          clearLongPressTimer();
        }
        if (event.shiftKey) {
          modifierUpdates.isShiftPressed = true;
          isAnyModifierActive = true;
          clearLongPressTimer();
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
          modifierUpdates.isFnPressed = true;
          isAnyModifierActive = true;
          clearLongPressTimer();
        }

        if (Object.keys(modifierUpdates).length > 0) {
          actions.updateModifierKeys(modifierUpdates);
        }

        if (!event.metaKey && key !== "META") {
          clearLongPressTimer();
        }

        if (isAnyModifierActive) {
          actions.setIsKeyActive(true);
        }
      } catch (error) {
        console.error("Error handling keydown event:", error);
      }
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      try {
        const actions = getStoreActions();
        const key = event.key.toUpperCase();
        const code = event.code;

        pressedKeys.delete(key);
        if (code) pressedKeys.delete(code);
        actions.removeKeyboardKey(key);

        const modifierUpdates: Partial<{
          isCommandPressed: boolean;
          isOptionPressed: boolean;
          isControlPressed: boolean;
          isShiftPressed: boolean;
          isFnPressed: boolean;
        }> = {};

        if (!event.metaKey && commandPressedRef.current) {
          commandPressedRef.current = false;
          modifierUpdates.isCommandPressed = false;
          clearLongPressTimer();
        }

        if (!event.altKey) modifierUpdates.isOptionPressed = false;
        if (!event.ctrlKey) modifierUpdates.isControlPressed = false;
        if (!event.shiftKey) modifierUpdates.isShiftPressed = false;

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
          modifierUpdates.isFnPressed = false;
        }

        if (Object.keys(modifierUpdates).length > 0) {
          actions.updateModifierKeys(modifierUpdates);
        }

        const hasActiveModifier =
          event.metaKey ||
          event.altKey ||
          event.ctrlKey ||
          event.shiftKey ||
          isFnStillPressed ||
          isGlobeStillPressed;

        if (!hasActiveModifier) {
          actions.setIsKeyActive(false);
        }
      } catch (error) {
        console.error("Error handling keyup event:", error);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      clearLongPressTimer();
    };
  }, [startLongPress, clearLongPressTimer]);

  return {
    keyboardKeys,
    isKeyActive,
    isCommandPressed,
    isOptionPressed,
    isControlPressed,
    isShiftPressed,
    isFnPressed,
    isArmed,
    isActivated,
    longPressProgress,
  };
};
