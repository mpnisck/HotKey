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
      console.log("활성 앱:", activeApp);
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
            shortcut: item.shortcut
              ? item.shortcut.replace(/^shortcut:\s*/, "").trim()
              : "",
          }));
        setMenuData(filteredMenuItems);
      } else {
        setError("유효하지 않은 메뉴 항목입니다.");
        setMenuData([]);
      }
    } catch (error) {
      setError("메뉴 항목을 가져오는 중에 오류가 발생했습니다.");
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

  const renderMenuItem = (item) => {
    return (
      <div className="flex justify-between items-center py-4 px-4 hover:bg-[#eee]">
        <span className="text-[16px] text-gray-800">{item.name}</span>
        <h3
          className="text-[16px] text-gray-800"
          style={{ color: "transparent" }}
        >
          {item.shortcut}
        </h3>
      </div>
    );
  };

  return (
    <div className="w-[900px] h-[700px] m-auto flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h1 className="text-2xl font-bold">단축키 정보</h1>
        <p className="text-[#666]">
          <span className="text-xl font-semibold bg-[#FE8E00] text-[#fff] py-2 px-5 rounded-full">
            {activeApp}
          </span>
        </p>
      </div>

      {error && <p className="text-center text-[#f00] p-4">{error}</p>}

      {menuData.length > 0 ? (
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="grid grid-cols-2 divide-y divide-gray-200">
            {menuData.map((item, index) => (
              <div key={index}>{renderMenuItem(item)}</div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center text-[#666] p-4">
          활성화된 앱에 대한 단축키 정보가 없습니다.
        </p>
      )}
    </div>
  );
}

export default Hotkey;
