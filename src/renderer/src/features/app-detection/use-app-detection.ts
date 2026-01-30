import { useCallback } from "react";
import { useHotkeyStore } from "@/entities/hot-key";
import { processMenuItems } from "@/shared/lib/keyboard";
import { MenuData } from "@/shared/types";
import { electronApi } from "@/shared/api";
import { STORAGE_KEYS, ERROR_MESSAGES } from "@/shared/config/storage";

interface UseAppDetectionReturn {
  fetchMenuItems: (currentApp: string) => Promise<void>;
  fetchActiveApp: () => Promise<string | null>;
  triggerActivation: (capturedAppName?: string) => Promise<void>;
  menuData: MenuData;
  error: string;
  isLoading: boolean;
  activeApp: string;
}

export const useAppDetection = (): UseAppDetectionReturn => {
  const store = useHotkeyStore();

  const clearMenuData = useCallback((): void => {
    store.setMenuData({});
    localStorage.removeItem(STORAGE_KEYS.MENU_DATA);
  }, [store]);

  const fetchMenuItems = useCallback(
    async (currentApp: string): Promise<void> => {
      if (!currentApp) return;

      try {
        store.setIsLoading(true);
        const menuItems = await electronApi.getMenuInfo(currentApp);

        if (Array.isArray(menuItems) && menuItems.length > 0) {
          const groupedItems = processMenuItems(menuItems);
          store.setMenuData(groupedItems);
          localStorage.setItem(
            STORAGE_KEYS.MENU_DATA,
            JSON.stringify(groupedItems)
          );
          store.setError("");
        } else {
          store.setError(ERROR_MESSAGES.NO_MENU);
          clearMenuData();
        }
      } catch (error) {
        console.error("메뉴 정보 가져오기 오류:", error);
        store.setError(ERROR_MESSAGES.PERMISSION);
        clearMenuData();
      } finally {
        store.setIsLoading(false);
      }
    },
    [store, clearMenuData]
  );

  const fetchActiveApp = useCallback(async (): Promise<string | null> => {
    try {
      const activeApp = await electronApi.getActiveApp();

      if (activeApp) {
        store.setActiveApp(activeApp);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_APP, activeApp);
        return activeApp;
      } else {
        store.setActiveApp(ERROR_MESSAGES.NO_APP);
        return null;
      }
    } catch (error) {
      console.error("활성 앱 가져오기 오류:", error);
      store.setError(ERROR_MESSAGES.FETCH_ERROR);
      return null;
    }
  }, [store]);

  const triggerActivation = useCallback(
    async (capturedAppName?: string): Promise<void> => {
      let currentApp = capturedAppName;

      if (!currentApp) {
        currentApp = (await fetchActiveApp()) ?? undefined;
      } else {
        store.setActiveApp(currentApp);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_APP, currentApp);
      }

      if (currentApp) {
        await fetchMenuItems(currentApp);
      }
    },
    [store, fetchActiveApp, fetchMenuItems]
  );

  return {
    fetchMenuItems,
    fetchActiveApp,
    triggerActivation,
    menuData: store.menuData,
    error: store.error,
    isLoading: store.isLoading,
    activeApp: store.activeApp,
  };
};
