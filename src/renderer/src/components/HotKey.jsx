import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

function Hotkey() {
  const [menuData, setMenuData] = useState([]);
  const [activeApp, setActiveApp] = useState("아직 활성화된 앱이 없습니다.");
  const [error, setError] = useState("");

  const location = useLocation();
  const { activeApp: activeAppProp } = location.state || {};

  useEffect(() => {
    if (activeAppProp) {
      setActiveApp(activeAppProp);
    }
  }, [activeAppProp]);

  const fetchActiveApp = async () => {
    try {
      const activeApp = await window.api.invoke("get-active-app");
      return activeApp || "활성화된 앱 정보를 찾을 수 없습니다.";
    } catch (error) {
      setError("활성화된 앱을 가져오는 중에 오류가 발생했습니다.");
      console.error("활성화된 앱 가져오기 실패:", error);
      return "활성화된 앱 정보를 찾을 수 없습니다.";
    }
  };

  const fetchMenuItems = async (activeApp) => {
    try {
      const menuItems = await window.api.invoke("get-menu-info", activeApp);
      if (Array.isArray(menuItems)) {
        const filteredMenuItems = menuItems
          .filter((item) => item.name && !item.name.includes("missing value"))
          .map((item) => ({
            name: item.name.replace(/^name:/, "").trim(),
            shortcut: item.shortcut || "No Shortcut",
            icon: item.icon || "No Icon",
          }));
        setMenuData(filteredMenuItems);
      } else {
        setError("유효하지 않은 메뉴 항목입니다.");
        setMenuData([]);
      }
    } catch (error) {
      setError("메뉴 항목을 가져오는 중에 오류가 발생했습니다.");
      console.error("메뉴 항목 가져오기 실패:", error);
    }
  };

  const handleTabKey = async (event) => {
    if (event.key === "Tab") {
      event.preventDefault();

      const currentActiveApp = await fetchActiveApp();
      setActiveApp(currentActiveApp);
      await fetchMenuItems(currentActiveApp);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleTabKey);
    return () => {
      window.removeEventListener("keydown", handleTabKey);
    };
  }, []);

  useEffect(() => {
    const loadAppsAndMenus = async () => {
      const currentActiveApp = await fetchActiveApp();
      setActiveApp(currentActiveApp);
      await fetchMenuItems(currentActiveApp);
    };

    loadAppsAndMenus();
  }, []);

  return (
    <div className="w-[900px] h-[700px] m-auto flex flex-col gap-[1rem] overflow-y-scroll">
      <div className="flex gap-[10px] items-center">
        <h1 className="text-2xl font-bold">단축키 정보</h1>
        <p>현재 활성화된 앱: {activeApp}</p>
      </div>

      {error && <p className="text-center text-red-500">{error}</p>}

      {menuData.length > 0 ? (
        <ul className="list-none h-[700px] overflow-y-auto">
          {menuData.map((item, index) => (
            <li key={index} className="p-4 border-b">
              <strong className="text-lg text-black">{item.name}</strong>
              <div className="text-sm text-gray-600">{item.shortcut}</div>
              <div className="text-xs text-gray-500">{item.icon}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500">
          활성화된 앱에 대한 단축키 정보가 없습니다.
        </p>
      )}
    </div>
  );
}

export default Hotkey;
