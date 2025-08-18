import { useEffect } from "react";
import { useHotkeyStore } from "../../entities/hotkey";
import { processMenuItems } from "../../shared/lib/keyboard";

export const useAppDetection = () => {
  const store = useHotkeyStore();

  const clearMenuData = () => {
    store.setMenuData({});
    localStorage.removeItem("menuData");
  };

  const fetchMenuItems = async currentApp => {
    const storedMenuData = localStorage.getItem("menuData");

    if (storedMenuData) {
      try {
        const parsedMenuData = JSON.parse(storedMenuData);
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
      const menuItems = await window.api.invoke("get-menu-info", currentApp);

      if (Array.isArray(menuItems) && menuItems.length > 0) {
        const groupedItems = processMenuItems(menuItems);
        store.setMenuData(groupedItems);
        localStorage.setItem("menuData", JSON.stringify(groupedItems));
        store.setError("");
      } else {
        store.setError("메뉴 항목이 없습니다.");
        clearMenuData();
      }
    } catch (error) {
      store.setError(
        "시스템 설정 > 개인정보 보호 및 보안 > 손쉬운 사용에서 앱 허용을 해 주세요"
      );
      clearMenuData();
    } finally {
      store.setIsLoading(false);
    }
  };

  const fetchActiveApp = async () => {
    const storedActiveApp = localStorage.getItem("activeApp");

    if (storedActiveApp) {
      store.setActiveApp(storedActiveApp);
      return storedActiveApp;
    }

    try {
      const activeApp = await window.api.invoke("get-active-app");

      if (activeApp) {
        store.setActiveApp(activeApp);
        localStorage.setItem("activeApp", activeApp);
        return activeApp;
      } else {
        store.setActiveApp("활성화된 앱 정보를 찾을 수 없습니다.");
        return null;
      }
    } catch (error) {
      store.setError("활성화된 앱을 가져오는 중에 오류가 발생했습니다.");
      return null;
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      const storedActiveApp = localStorage.getItem("activeApp");
      const storedMenuData = localStorage.getItem("menuData");

      if (storedActiveApp) {
        store.setActiveApp(storedActiveApp);

        if (storedMenuData) {
          try {
            const parsedMenuData = JSON.parse(storedMenuData);
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
  }, []);

  return {
    fetchMenuItems,
    fetchActiveApp,
    menuData: store.menuData,
    error: store.error,
    isLoading: store.isLoading,
    activeApp: store.activeApp,
  };
};
