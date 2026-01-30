import { useEffect, useRef, useCallback } from "react";
import { useHotkeyStore } from "@/entities/hot-key";

const getStoreActions = () => useHotkeyStore.getState();

const LONG_PRESS_DURATION = 2000;

declare global {
  interface Window {
    api: {
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
      on: (channel: string, func: (...args: unknown[]) => void) => () => void;
    };
  }
}

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
  const store = useHotkeyStore();
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
    getStoreActions().setLongPressProgress(0);
  }, []);

  const startLongPress = useCallback(() => {
    const actions = getStoreActions();
    if (actions.isActivated) return;

    longPressStartRef.current = Date.now();

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - longPressStartRef.current;
      const progress = Math.min((elapsed / LONG_PRESS_DURATION) * 100, 100);
      getStoreActions().setLongPressProgress(progress);
    }, 50);

    longPressTimerRef.current = setTimeout(() => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      longPressTimerRef.current = null;
      longPressStartRef.current = 0;

      getStoreActions().setIsActivated(true);
      getStoreActions().setLongPressProgress(0);
      onLongPressCommandRef.current?.();
    }, LONG_PRESS_DURATION);
  }, []);

  useEffect(() => {
    if (!window.api?.on) return;

    const unsubscribeState = window.api.on(
      "global-key-state",
      (data: unknown) => {
        const { key, pressed } = data as { key: string; pressed: boolean };
        const actions = getStoreActions();

        if (key === "command") {
          actions.setIsCommandPressed(pressed);
          if (pressed) {
            actions.setIsKeyActive(true);
          } else {
            actions.setIsKeyActive(false);
          }
        }
      }
    );

    const unsubscribeProgress = window.api.on(
      "global-key-progress",
      (progress: unknown) => {
        const p = progress as number;
        getStoreActions().setLongPressProgress(p);
      }
    );

    const unsubscribeActivated = window.api.on(
      "global-key-activated",
      (data: unknown) => {
        const { activated, appName } = data as {
          activated: boolean;
          appName?: string;
        };
        const actions = getStoreActions();
        actions.setIsActivated(activated);
        if (activated) {
          onLongPressCommandRef.current?.(appName);
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
      const actions = getStoreActions();
      const key = event.key.toUpperCase();
      const code = event.code;

      event.preventDefault();

      pressedKeys.add(key);
      if (code) pressedKeys.add(code);
      actions.addKeyboardKey(key);

      let isAnyModifierActive = false;

      if (event.metaKey) {
        actions.setIsCommandPressed(true);
        isAnyModifierActive = true;

        if (!commandPressedRef.current) {
          commandPressedRef.current = true;
          if (!event.altKey && !event.ctrlKey && !event.shiftKey) {
            startLongPress();
          }
        }
      }
      if (event.altKey) {
        actions.setIsOptionPressed(true);
        isAnyModifierActive = true;
        clearLongPressTimer();
      }
      if (event.ctrlKey) {
        actions.setIsControlPressed(true);
        isAnyModifierActive = true;
        clearLongPressTimer();
      }
      if (event.shiftKey) {
        actions.setIsShiftPressed(true);
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
        actions.setIsFnPressed(true);
        isAnyModifierActive = true;
        clearLongPressTimer();
      }

      if (!event.metaKey && key !== "META") {
        clearLongPressTimer();
      }

      if (isAnyModifierActive) {
        actions.setIsKeyActive(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      const actions = getStoreActions();
      const key = event.key.toUpperCase();
      const code = event.code;

      pressedKeys.delete(key);
      if (code) pressedKeys.delete(code);
      actions.removeKeyboardKey(key);

      if (!event.metaKey && commandPressedRef.current) {
        commandPressedRef.current = false;
        actions.setIsCommandPressed(false);
        clearLongPressTimer();
      }

      if (!event.altKey) actions.setIsOptionPressed(false);
      if (!event.ctrlKey) actions.setIsControlPressed(false);
      if (!event.shiftKey) actions.setIsShiftPressed(false);

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
        actions.setIsFnPressed(false);
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
    keyboardKeys: store.keyboardKeys,
    isKeyActive: store.isKeyActive,
    isCommandPressed: store.isCommandPressed,
    isOptionPressed: store.isOptionPressed,
    isControlPressed: store.isControlPressed,
    isShiftPressed: store.isShiftPressed,
    isFnPressed: store.isFnPressed,
    isArmed: store.isArmed,
    isActivated: store.isActivated,
    longPressProgress: store.longPressProgress,
  };
};
