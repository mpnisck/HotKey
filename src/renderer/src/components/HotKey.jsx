import { useState, useEffect } from "react";

function Hotkey() {
  const [menuData, setMenuData] = useState({});
  const [activeApp, setActiveApp] = useState("아직 활성화된 앱이 없습니다.");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchActiveApp = async () => {
    try {
      setIsLoading(true);
      const activeApp = await window.api.invoke("get-active-app");
      setActiveApp(activeApp || "활성화된 앱 정보를 찾을 수 없습니다.");
      return activeApp;
    } catch (error) {
      setError("활성화된 앱을 가져오는 중에 오류가 발생했습니다.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const processMenuItems = (items) => {
    const processed = items.reduce((acc, item) => {
      const [category] = item.name.split(" > ");
      if (!acc[category]) {
        acc[category] = [];
      }

      const menuName = item.name.split(" > ")[1];
      if (menuName) {
        acc[category].push({
          name: menuName,
          shortcut: item.shortcut,
        });
      }

      return acc;
    }, {});

    return processed;
  };

  const fetchMenuItems = async (currentApp) => {
    if (!currentApp) return;

    try {
      setIsLoading(true);
      const menuItems = await window.api.invoke("get-menu-info", currentApp);

      if (Array.isArray(menuItems) && menuItems.length > 0) {
        const groupedItems = processMenuItems(menuItems);
        setMenuData(groupedItems);
        setError("");
      } else {
        setError("메뉴 항목이 없습니다.");
        setMenuData({});
      }
    } catch (error) {
      console.error("Error in fetchMenuItems:", error);
      setError("메뉴 항목을 가져오는 중에 오류가 발생했습니다.");
      setMenuData({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabKey = async (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      setIsLoading(true);
      try {
        const currentApp = await fetchActiveApp();
        if (currentApp) {
          await fetchMenuItems(currentApp);
        } else {
          setError("활성화된 앱이 없습니다.");
        }
      } catch (error) {
        console.error("Error in handleTabKey:", error);
        setError("데이터를 가져오는 중에 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleTabKey);
    return () => {
      window.removeEventListener("keydown", handleTabKey);
    };
  }, []);

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        const currentApp = await fetchActiveApp();
        if (currentApp) {
          await fetchMenuItems(currentApp);
        }
      } catch (error) {
        console.error("Error in initial load:", error);
        setError("초기 데이터를 불러오는 중에 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);

  return (
    <div className="w-[95%] h-[800px] m-auto flex flex-col">
      <div className="flex justify-between items-center p-7 bg-[#333] text-[#fff] rounded">
        <h1 className="text-2xl font-semibold">단축키 정보</h1>
        <p className="text-[#666]">
          <span className="text-xl font-semibold bg-[#FE8E00] text-[#fff] py-2 px-5 rounded-full">
            {activeApp}
          </span>
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FE8E00]"></div>
            <div className="text-center text-[#666]">
              데이터를 불러오는 중...
            </div>
          </div>
        </div>
      )}

      {error && <div className="text-center text-[#f00] p-4"> {error} </div>}

      {!isLoading && !error && Object.keys(menuData).length > 0 && (
        <div className="flex-1 overflow-y-auto p-4">
          {Object.entries(menuData).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h2 className="text-lg font-semibold mb-5 bg-gray-100 p-3 rounded">
                {category}
              </h2>
              <div className="grid gap-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-white rounded"
                  >
                    <span className="text-[#333] text-sm">{item.name}</span>
                    <code className="text-lg tracking-wider bg-[#333] text-[#fff] hover:bg-[#fe8e00] transition-all border-gray-100 block px-4 py-1 rounded-md">
                      {item.shortcut || "-"}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && Object.keys(menuData).length === 0 && (
        <div className="flex items-center justify-center py-6">
          <p className="text-[#999]">
            단축키 정보가 없습니다. Tab 키를 눌러 정보를 불러오세요.
          </p>
        </div>
      )}
    </div>
  );
}

export default Hotkey;
