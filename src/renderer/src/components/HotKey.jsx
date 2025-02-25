import { useState, useEffect } from "react";

const KeyboardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="mr-2 text-[#FE8E00]"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
    <line x1="6" y1="8" x2="6.01" y2="8" />
    <line x1="10" y1="8" x2="10.01" y2="8" />
    <line x1="14" y1="8" x2="14.01" y2="8" />
    <line x1="18" y1="8" x2="18.01" y2="8" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

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
    "Delete",
  ],
  ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Delete"],
  ["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
  ["Caps Lock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter"],
  ["Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Shift"],
  ["Fn", "Control", "Option", "Meta", "Space", "Meta", "Option", "Control"],
];

function Hotkey() {
  const [menuData, setMenuData] = useState({});
  const [activeApp, setActiveApp] = useState("아직 활성화된 앱이 없습니다.");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCommandPressed, setIsCommandPressed] = useState(false);
  const [isOptionPressed, setIsOptionPressed] = useState(false);
  const [isControlPressed, setIsControlPressed] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isBackspacePressed, setIsBackspacePressed] = useState(false);
  const [isFnPressed, setIsFnPressed] = useState(false);
  const [isKeyActive, setIsKeyActive] = useState(false);
  const [pressedKeys, setPressedKeys] = useState(new Set());
  const [keyboardKeys, setKeyboardKeys] = useState(new Set());

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
        setError("데이터를 가져오는 중에 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (event) => {
    const key = event.key.toUpperCase();

    if (event.metaKey) {
      setIsCommandPressed(true);
      setIsKeyActive(true);
    }

    if (event.key === "Enter") {
      setPressedKeys((prev) => new Set(prev).add("enter"));
      setKeyboardKeys((prev) => new Set(prev).add("ENTER"));
    }

    setPressedKeys((prev) => new Set(prev).add(event.key.toLowerCase()));
    setKeyboardKeys((prev) => new Set(prev).add(key));

    const modifierKeyMap = {
      Meta: () => {
        setIsCommandPressed(true);
        setIsKeyActive(true);
      },
      Option: () => {
        setIsOptionPressed(true);
        setIsKeyActive(true);
      },
      Control: () => {
        setIsControlPressed(true);
        setIsKeyActive(true);
      },
      Shift: () => {
        setIsShiftPressed(true);
        setIsKeyActive(true);
      },
      Backspace: () => {
        setIsBackspacePressed(true);
        setIsKeyActive(true);
      },
      Enter: () => {
        setIsKeyActive(true);
      },
    };

    if (modifierKeyMap[event.key]) {
      modifierKeyMap[event.key]();
    }

    if (event.key.toLowerCase() === "fn" || pressedKeys.has("fn")) {
      setIsFnPressed(true);
      setIsKeyActive(true);
    }
  };

  const handleKeyUp = (event) => {
    const key = event.key.toUpperCase();

    if (!event.metaKey) {
      setIsCommandPressed(false);
    }

    if (event.key === "Enter") {
      setPressedKeys((prev) => {
        const newKeys = new Set(prev);
        newKeys.delete("enter");
        return newKeys;
      });
      setKeyboardKeys((prev) => {
        const updated = new Set(prev);
        updated.delete("ENTER");
        return updated;
      });
    }

    setPressedKeys((prev) => {
      const newKeys = new Set(prev);
      newKeys.delete(event.key.toLowerCase());
      return newKeys;
    });

    setKeyboardKeys((prev) => {
      const updated = new Set(prev);
      updated.delete(key);
      return updated;
    });

    const modifierKeyMap = {
      Meta: () => setIsCommandPressed(false),
      Option: () => setIsOptionPressed(false),
      Control: () => setIsControlPressed(false),
      Shift: () => setIsShiftPressed(false),
      Backspace: () => setIsBackspacePressed(false),
      Enter: () => {
        setIsKeyActive(false);
      },
      fn: () => setIsFnPressed(false),
    };

    if (modifierKeyMap[event.key]) {
      modifierKeyMap[event.key]();
    }

    if (
      !isCommandPressed &&
      !isOptionPressed &&
      !isControlPressed &&
      !isShiftPressed &&
      !isBackspacePressed &&
      !isFnPressed
    ) {
      setIsKeyActive(false);
    }
  };

  const getKeyStyle = (key) => {
    const isPressed = keyboardKeys.has(key.toUpperCase());
    const specialKeys = [
      "ESC",
      "TAB",
      "CAPS LOCK",
      "SHIFT",
      "FN",
      "CONTROL",
      "OPTION",
      "META",
      "ENTER",
      "DELETE",
      "SPACE",
    ];

    if (specialKeys.includes(key.toUpperCase())) {
      return isPressed
        ? "bg-gray-600 text-white shadow-lg scale-105"
        : "bg-gray-200 text-gray-800 hover:bg-gray-300";
    }

    return isPressed
      ? "bg-[#FE8E00] text-white shadow-lg scale-105"
      : "bg-white text-gray-800 border border-gray-300 hover:bg-gray-100";
  };

  useEffect(() => {
    window.addEventListener("keydown", handleTabKey);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleTabKey);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
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
        setError("초기 데이터를 불러오는 중에 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);

  const filteredMenuData = isKeyActive
    ? Object.entries(menuData).reduce((acc, [category, items]) => {
        const filteredItems = items.filter(
          (item) =>
            (isCommandPressed && item.shortcut.includes("⌘")) ||
            (isOptionPressed && item.shortcut.includes("⌥")) ||
            (isControlPressed && item.shortcut.includes("⌃")) ||
            (isShiftPressed && item.shortcut.includes("⇧")) ||
            (isBackspacePressed && item.shortcut.includes("⌫")) ||
            (isFnPressed && item.shortcut.includes("Fn")) ||
            (pressedKeys.has("enter") && item.shortcut.includes("⏎"))
        );
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
            {activeApp}
          </span>
        </p>
      </div>

      <div className="bg-white shadow-md rounded-lg p-4 mt-4">
        <div className="flex items-center mb-4">
          <KeyboardIcon />
          <h2 className="text-xl font-semibold">MacBook Pro 키보드</h2>
        </div>

        <div
          className="
            bg-gray-100
            rounded-xl
            p-4
            shadow-inner
            border
            border-gray-200
          "
        >
          {macBookProKeyboardLayout.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={`
                flex gap-1 justify-center mb-1
                ${rowIndex === 0 ? "mb-2" : ""}
                ${rowIndex === 5 ? "mt-2" : ""}
              `}
            >
              {row.map((key) => {
                const isSpecialKey = [
                  "Esc",
                  "Tab",
                  "Caps Lock",
                  "Shift",
                  "Fn",
                  "Control",
                  "Option",
                  "Meta",
                  "Enter",
                  "Delete",
                  "Space",
                ].includes(key);

                const specialKeyWidths = {
                  Esc: "w-16",
                  Tab: "w-20",
                  "Caps Lock": "w-24",
                  Shift: "w-24",
                  Enter: "w-24",
                  Space: "w-64",
                  Control: "w-20",
                  Option: "w-20",
                  Meta: "w-20",
                };

                return (
                  <div
                    key={key}
                    className={`
                      ${specialKeyWidths[key] || "w-12"}
                      h-10
                      rounded-md
                      text-center
                      flex
                      items-center
                      justify-center
                      font-medium
                      cursor-default
                      transition-all
                      ease-in-out
                      ${getKeyStyle(key)}
                      ${isSpecialKey ? "text-xs" : "text-sm"}
                    `}
                  >
                    {key === "Meta"
                      ? "⌘"
                      : key === "Option"
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

      {!isLoading && !error && Object.keys(filteredMenuData).length > 0 && (
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
                    className="flex justify-between items-center p-3 bg-white rounded"
                  >
                    <span className="text-[#333] text-sm">{item.name}</span>
                    <code
                      className={`text-lg tracking-wider block px-4 py-1 rounded-md ${
                        isKeyActive
                          ? "bg-[#FE8E00] text-[#fff]"
                          : "bg-[#333] text-[#fff]"
                      }`}
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
            단축키 정보가 없습니다. Tab 키를 눌러 정보를 불러오세요.
          </p>
        </div>
      )}

      <div className="fixed bottom-[10px] left-[10px] text-[#333]">
        현재 눌린 키: {Array.from(pressedKeys).join(", ")}
      </div>
    </div>
  );
}

export default Hotkey;
