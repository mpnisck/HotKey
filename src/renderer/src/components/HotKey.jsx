import { useEffect } from "react";
import useHotkeyStore from "../../../main/store";

const macBookProKeyboardLayout = [
  [
    "Esc",
    "F1",
    "F2",
    "F3",
    "F4",
    "F5",
    "F6",
    "F7",
    "F8",
    "F9",
    "F10",
    "F11",
    "F12",
    "⏻",
  ],
  ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Delete"],
  ["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
  ["한/A", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter"],
  ["Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Shift"],
  ["Fn", "Control", "Alt", "Meta", "Spaces", "Meta", "Alt", "←", "↑", "↓", "→"],
];

function Hotkey() {
  const {
    menuData,
    error,
    isLoading,
    isKeyActive,
    keyboardKeys,
    showMenuData,
    setMenuData,
    setActiveApp,
    setError,
    setIsLoading,
    addKeyboardKey,
    removeKeyboardKey,
    setIsCommandPressed,
    setIsOptionPressed,
    setIsControlPressed,
    setIsShiftPressed,
    setIsFnPressed,
    setIsKeyActive,
    setShowMenuData,
    isCommandPressed,
    isOptionPressed,
    isControlPressed,
    isShiftPressed,
    isFnPressed,
  } = useHotkeyStore();

  const getKeyStyle = (key) => {
    const isPressed = keyboardKeys.has(key.toUpperCase());
    const specialKeys = [
      "ESC",
      "TAB",
      "CAPS LOCK",
      "SHIFT",
      "FN",
      "CONTROL",
      "ALT",
      "META",
      "ENTER",
      "DELETE",
      "SPACES",
      "⏻",
      "←",
      "↑",
      "↓",
      "→",
      "한/A",
    ];

    return isPressed
      ? "bg-[#FE8E00] text-[#fff] shadow-lg scale-105"
      : specialKeys.includes(key.toUpperCase())
        ? "bg-gray-200 text-gray-800 shadow-sm hover:bg-gray-300"
        : "bg-[#fff] text-gray-800 shadow-sm hover:bg-gray-100";
  };

  const fetchMenuItems = async (currentApp) => {
    const storedMenuData = localStorage.getItem("menuData");

    if (storedMenuData) {
      try {
        const parsedMenuData = JSON.parse(storedMenuData);

        if (Object.keys(parsedMenuData).length > 0) {
          setMenuData(parsedMenuData);
          setError("");
          return;
        }
      } catch (error) {
        console.error("로컬 스토리지 데이터 파싱 중 오류:", error);
      }
    }

    if (!currentApp) {
      return;
    }

    try {
      setIsLoading(true);
      const menuItems = await window.api.invoke("get-menu-info", currentApp);

      if (Array.isArray(menuItems) && menuItems.length > 0) {
        const groupedItems = processMenuItems(menuItems);
        setMenuData(groupedItems);
        localStorage.setItem("menuData", JSON.stringify(groupedItems));
        setError("");
      } else {
        setError("메뉴 항목이 없습니다.");
        setMenuData({});
        localStorage.removeItem("menuData");
      }
    } catch (error) {
      setError("메뉴 항목을 가져오는 중에 오류가 발생했습니다.");
      setMenuData({});
      localStorage.removeItem("menuData");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActiveApp = async () => {
    const storedActiveApp = localStorage.getItem("activeApp");

    if (storedActiveApp) {
      setActiveApp(storedActiveApp);
      return storedActiveApp;
    }

    try {
      const activeApp = await window.api.invoke("get-active-app");

      if (activeApp) {
        setActiveApp(activeApp);
        localStorage.setItem("activeApp", activeApp);
        return activeApp;
      } else {
        setActiveApp("활성화된 앱 정보를 찾을 수 없습니다.");
        return null;
      }
    } catch (error) {
      setError("활성화된 앱을 가져오는 중에 오류가 발생했습니다.");
      return null;
    }
  };

  const processMenuItems = (items) => {
    return items.reduce((accumulator, item) => {
      const [category] = item.name.split(" > ");
      if (!accumulator[category]) {
        accumulator[category] = [];
      }
      const menuName = item.name.split(" > ")[1];
      if (menuName) {
        accumulator[category].push({
          name: menuName,
          shortcut: item.shortcut,
        });
      }
      return accumulator;
    }, {});
  };

  useEffect(() => {
    const loadInitialData = async () => {
      const storedActiveApp = localStorage.getItem("activeApp");
      const storedMenuData = localStorage.getItem("menuData");

      if (storedActiveApp) {
        setActiveApp(storedActiveApp);

        if (storedMenuData) {
          try {
            const parsedMenuData = JSON.parse(storedMenuData);
            setMenuData(parsedMenuData);
          } catch (error) {
            console.error("초기 메뉴 데이터 파싱 오류:", error);
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

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handleKeyDown = (event) => {
    const key = event.key.toUpperCase();
    event.preventDefault();

    addKeyboardKey(key);

    if (event.metaKey) {
      setIsCommandPressed(true);
      setIsKeyActive(true);
    }
    if (event.altKey) {
      setIsOptionPressed(true);
      setIsKeyActive(true);
    }
    if (event.ctrlKey) {
      setIsControlPressed(true);
      setIsKeyActive(true);
    }
    if (event.shiftKey) {
      setIsShiftPressed(true);
      setIsKeyActive(true);
    }

    if (event.key.toLowerCase() === "fn") {
      setIsFnPressed(true);
      setIsKeyActive(true);
    }
  };

  const handleKeyUp = (event) => {
    const key = event.key.toUpperCase();
    removeKeyboardKey(key);

    if (!event.metaKey) setIsCommandPressed(false);
    if (!event.altKey) setIsOptionPressed(false);
    if (!event.ctrlKey) setIsControlPressed(false);
    if (!event.shiftKey) setIsShiftPressed(false);

    if (!event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey) {
      setIsKeyActive(false);
    }
  };

  const filteredMenuData = isKeyActive
    ? Object.entries(menuData).reduce((acc, [category, items]) => {
        const filteredItems = items.filter((item) => {
          const shortcut = item.shortcut || "";

          const matchConditions = [
            {
              symbol: "⌘",
              pressed: isCommandPressed,
              condition: shortcut.includes("⌘"),
            },
            {
              symbol: "⌥",
              pressed: isOptionPressed,
              condition: shortcut.includes("⌥"),
            },
            {
              symbol: "⌃",
              pressed: isControlPressed,
              condition: shortcut.includes("⌃"),
            },
            {
              symbol: "⇧",
              pressed: isShiftPressed,
              condition: shortcut.includes("⇧"),
            },
            {
              symbol: "Fn",
              pressed: isFnPressed,
              condition: shortcut.includes("Fn"),
            },
          ];

          const activeModifiers = matchConditions.filter((mod) => mod.pressed);
          return (
            activeModifiers.length > 0 &&
            activeModifiers.every((mod) => mod.condition)
          );
        });

        if (filteredItems.length > 0) {
          acc[category] = filteredItems;
        }
        return acc;
      }, {})
    : menuData;

  return (
    <div className="w-[95%] h-[800px] m-auto flex flex-col">
      <div className="flex justify-between items-center p-7 bg-[#333] text-[#fff] rounded">
        <h1 className="text-2xl font-semibold">단축키 정보</h1>
        <p className="text-[#666]">
          <span className="text-xl font-semibold bg-[#FE8E00] text-[#fff] py-2 px-5 rounded-full">
            Figma
          </span>
        </p>
      </div>

      <div className="bg-[#fff] shadow-md rounded-lg p-4 mt-4">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold">키보드 뷰어</h2>
        </div>

        <div className="bg-gray-100 rounded-xl p-4 shadow-inner border border-gray-200">
          {macBookProKeyboardLayout.map((row, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className={`flex gap-1 justify-center mb-1 ${rowIndex === 0 ? "mb-2" : ""} ${rowIndex === 5 ? "mt-2" : ""}`}
            >
              {row.map((key, keyIndex) => {
                const isSpecialKey = [
                  "Esc",
                  "Tab",
                  "한/A",
                  "Shift",
                  "Fn",
                  "Control",
                  "Option",
                  "Meta",
                  "Enter",
                  "Delete",
                  "Spaces",
                  "←",
                  "↑",
                  "↓",
                  "→",
                ].includes(key);

                const specialKeyWidths = {
                  Esc: "w-16",
                  Tab: "w-18",
                  "한/A": "w-22",
                  Shift: "w-24",
                  Enter: "w-24",
                  Spaces: "w-64",
                  Control: "w-20",
                  Option: "w-18",
                  Meta: "w-20",
                  "←": "w-12",
                  "↑": "w-12",
                  "↓": "w-12",
                  "→": "w-12",
                };

                return (
                  <div
                    key={`key-${key}-${rowIndex}-${keyIndex}`}
                    className={`${specialKeyWidths[key] || "w-12"} h-8 rounded-md text-center flex items-center justify-center font-medium cursor-default transition-all ease-in-out ${getKeyStyle(key)} ${isSpecialKey ? "text-xs" : "text-sm"}`}
                  >
                    {key === "Meta"
                      ? "⌘"
                      : key === "Alt"
                        ? "⌥"
                        : key === "Control"
                          ? "⌃"
                          : key === "Delete"
                            ? "⌫"
                            : key === "Enter"
                              ? "⏎"
                              : key}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <button
        className="p-3 bg-[#FE8E00] text-[#fff] rounded my-4 cursor-pointer"
        onClick={() => setShowMenuData((prev) => !prev)}
      >
        {showMenuData ? "정보 숨기기" : "정보 보기"}
      </button>

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

      {error && <div className="text-center text-[#f00] p-4">{error}</div>}

      {showMenuData &&
        !isLoading &&
        !error &&
        Object.keys(filteredMenuData).length > 0 && (
          <div className="flex-1 overflow-y-auto p-4">
            {Object.entries(filteredMenuData).map(([category, items]) => (
              <div key={category} className="mb-6">
                <h2 className="text-lg font-semibold mb-5 bg-gray-100 p-3 rounded">
                  {category}
                </h2>
                <div className="grid gap-2">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-[#fff] rounded"
                    >
                      <span className="text-[#333] text-sm">{item.name}</span>
                      <code
                        className={`text-lg tracking-wider block px-4 py-1 rounded-md ${isKeyActive ? "bg-[#FE8E00] text-[#fff]" : "bg-[#333] text-[#fff]"}`}
                      >
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
            단축키 정보가 없습니다. 버튼을 눌러 정보를 불러오세요.
          </p>
        </div>
      )}
    </div>
  );
}

export default Hotkey;
