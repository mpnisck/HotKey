import { useEffect } from "react";
import { useHotkeyStore } from "../../entities/hot-key";
import { processMenuItems } from "../../shared/lib/keyboard";
import { MenuData } from "../../shared/types";
import { electronApi } from "../../shared/api";
import { STORAGE_KEYS, ERROR_MESSAGES } from "../../shared/config/storage";

interface UseAppDetectionReturn {
  fetchMenuItems: (currentApp: string) => Promise<void>;
  fetchActiveApp: () => Promise<string | null>;
  menuData: MenuData;
  error: string;
  isLoading: boolean;
  activeApp: string;
}

export const useAppDetection = (): UseAppDetectionReturn => {
  const store = useHotkeyStore();

  const clearMenuData = (): void => {
    store.setMenuData({});
    localStorage.removeItem(STORAGE_KEYS.MENU_DATA);
  };

  const fetchMenuItems = async (currentApp: string): Promise<void> => {
    const storedMenuData = localStorage.getItem(STORAGE_KEYS.MENU_DATA);

    if (storedMenuData) {
      try {
        const parsedMenuData = JSON.parse(storedMenuData) as MenuData;

        if (Object.keys(parsedMenuData).length > 0) {
          store.setMenuData(parsedMenuData);
          store.setError("");
          return;
        }
      } catch (error) {
        console.error("로컬 스토리지 데이터 파싱 중 오류:", error);
      }
    }

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
  };

  const fetchActiveApp = async (): Promise<string | null> => {
    const storedActiveApp = localStorage.getItem(STORAGE_KEYS.ACTIVE_APP);

    if (storedActiveApp) {
      store.setActiveApp(storedActiveApp);
      return storedActiveApp;
    }

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
  };

  useEffect(() => {
    const loadInitialData = async (): Promise<void> => {
      const storedActiveApp = localStorage.getItem(STORAGE_KEYS.ACTIVE_APP);
      const storedMenuData = localStorage.getItem(STORAGE_KEYS.MENU_DATA);

      if (storedActiveApp) {
        store.setActiveApp(storedActiveApp);

        if (storedMenuData) {
          try {
            const parsedMenuData = JSON.parse(storedMenuData) as MenuData;
            store.setMenuData(parsedMenuData);
          } catch (error) {
            console.error("초기 메뉴 데이터 파싱 오류:", error);
            await fetchMenuItems(storedActiveApp);
          }
        } else {
          await fetchMenuItems(storedActiveApp);
        }
      } else {
        await fetchActiveApp();
      }
    };

    loadInitialData();
  }, [store, fetchMenuItems, fetchActiveApp]);

  return {
    fetchMenuItems,
    fetchActiveApp,
    menuData: store.menuData,
    error: store.error,
    isLoading: store.isLoading,
    activeApp: store.activeApp,
  };
};
