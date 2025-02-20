import { useState, useEffect } from "react";

function Hotkey() {
  const [menuData, setMenuData] = useState({});
  const [activeApp, setActiveApp] = useState("아직 활성화된 앱이 없습니다.");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchActiveApp = async () => {
    try {
      const activeApp = await window.api.invoke("get-active-app");
      console.log("현재 활성화된 앱:", activeApp);
      return activeApp || "활성화된 앱 정보를 찾을 수 없습니다.";
    } catch (error) {
      console.error("활성 앱 가져오기 오류:", error);
      setError("활성화된 앱을 가져오는 중에 오류가 발생했습니다.");
      return null;
    }
  };

  const processMenuItems = (items) => {
    console.log("메뉴 아이템 처리 중:", items);

    return items.reduce((acc, item) => {
      const [category, menuName] = item.name.split(" > ");

      if (!category || !menuName) return acc;

      if (!acc[category]) {
        acc[category] = [];
      }

      const shortcutInfo = formatShortcutAndSymbol(item.shortcut, item.symbol);
      acc[category].push({
        name: menuName,
        shortcut: shortcutInfo.shortcut,
        symbol: shortcutInfo.symbol,
        displayText: shortcutInfo.displayText,
      });

      return acc;
    }, {});
  };

  const formatShortcutAndSymbol = (shortcut, symbol) => {
    if (!shortcut && !symbol) {
      return { shortcut: null, symbol: null, displayText: "-" };
    }

    const symbolMap = {
      cmd: "⌘",
      shift: "⇧",
      alt: "⌥",
      ctrl: "⌃",
      return: "↵",
      enter: "↵",
      left: "←",
      right: "→",
      up: "↑",
      down: "↓",
    };

    let processedShortcut = shortcut;
    let processedSymbol = symbol;

    Object.entries(symbolMap).forEach(([key, value]) => {
      if (processedShortcut) {
        processedShortcut = processedShortcut.replace(
          new RegExp(key, "gi"),
          value
        );
      }
      if (processedSymbol) {
        processedSymbol = processedSymbol.replace(new RegExp(key, "gi"), value);
      }
    });

    const displayText = [processedShortcut, processedSymbol]
      .filter(Boolean)
      .join(" ");

    return {
      shortcut: processedShortcut,
      symbol: processedSymbol,
      displayText: displayText || "-",
    };
  };

  const fetchMenuItems = async (currentApp) => {
    if (!currentApp) return;

    try {
      const menuItems = await window.api.invoke("get-menu-info", currentApp);
      console.log("메뉴 정보 수신:", menuItems);

      if (Array.isArray(menuItems) && menuItems.length > 0) {
        const groupedItems = processMenuItems(menuItems);
        setMenuData(groupedItems);
        setError("");
      } else {
        setError("메뉴 항목이 없습니다.");
        setMenuData({});
      }
    } catch (error) {
      console.error("메뉴 정보 가져오기 오류:", error);
      setError("메뉴 항목을 가져오는 중에 오류가 발생했습니다.");
      setMenuData({});
    }
  };

  const handleTabKey = async (event) => {
    if (event.key === "Tab") {
      event.preventDefault(); // 기본 동작 방지
      setIsLoading(true); // 로딩 상태 설정
      try {
        const currentApp = await activeApp(); // 활성 앱 가져오기
        if (currentApp) {
          setActiveApp(currentApp); // 앱 이름 업데이트
          await fetchMenuItems(currentApp); // 메뉴 정보 가져오기
        }
      } catch (error) {
        console.error("Tab 키 핸들러 오류:", error); // 오류 로그 추가
        setError("데이터를 가져오는 중에 오류가 발생했습니다.");
      } finally {
        setIsLoading(false); // 로딩 상태 해제
      }
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleTabKey);
    return () => window.removeEventListener("keydown", handleTabKey);
  }, []);

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        const currentApp = await fetchActiveApp();
        if (currentApp) {
          setActiveApp(currentApp);
          await fetchMenuItems(currentApp);
        }
      } catch (error) {
        console.error("초기 로드 오류:", error);
        setError("초기 데이터를 불러오는 중에 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);

  return (
    <div className="w-[900px] h-[700px] m-auto flex flex-col">
      <div className="flex justify-between items-center p-7 bg-[#333] text-[#fff] rounded">
        <h1 className="text-2xl font-semibold">단축키 정보</h1>
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold bg-[#FE8E00] text-[#fff] py-2 px-5 rounded-full">
            {activeApp}
          </span>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FE8E00]"></div>
            <div className="text-center text-[#666]">
              단축키 정보를 불러오는 중...
            </div>
          </div>
        </div>
      )}

      {error && <div className="text-center text-[#f00] p-4">{error}</div>}

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
                    key={`${category}-${index}`}
                    className="flex justify-between items-center p-3 bg-white rounded"
                  >
                    <span className="text-[#333] text-sm">{item.name}</span>
                    <code className="text-lg tracking-wide bg-[#333] text-[#fff] hover:bg-[#fe8e00] transition-all border-gray-100 block px-4 py-1 rounded-md font-mono">
                      {item.displayText}
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
