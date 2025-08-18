import { useHotkeyStore } from "../../entities/hotkey";
import { useKeyTracking } from "../../features/key-tracking/use-key-tracking";
import { useAppDetection } from "../../features/app-detection/use-app-detection";
import Keyboard from "../../widgets/keyboard/Keyboard";
import MenuList from "../../widgets/menu-list/MenuList";

function Hotkey() {
  const { showMenuData } = useHotkeyStore();
  const {
    keyboardKeys,
    isKeyActive,
    isCommandPressed,
    isOptionPressed,
    isControlPressed,
    isShiftPressed,
    isFnPressed,
  } = useKeyTracking();

  const { menuData, error, isLoading } = useAppDetection();

  const filteredMenuData = isKeyActive
    ? Object.entries(menuData).reduce((acc, [category, items]) => {
        const filteredItems = items.filter(item => {
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

          const activeModifiers = matchConditions.filter(mod => mod.pressed);
          return (
            activeModifiers.length > 0 &&
            activeModifiers.every(mod => mod.condition)
          );
        });

        if (filteredItems.length > 0) {
          acc[category] = filteredItems;
        }
        return acc;
      }, {})
    : menuData;

  return (
    <div className="w-[95%] h-[670px] m-auto flex flex-col">
      <div className="flex justify-between items-center p-4 bg-[#333] text-[#fff] rounded">
        <h1 className="text-lg font-semibold">단축키 정보</h1>
        <p className="text-[#666]">
          <span className="text-lg font-semibold bg-[#FE8E00] text-[#fff] py-2 px-5 rounded-full">
            Figma
          </span>
        </p>
      </div>

      <Keyboard keyboardKeys={keyboardKeys} />

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

      {error && (
        <div className="text-center text-[#f00] p-2 text-sm">{error}</div>
      )}

      {showMenuData &&
        !isLoading &&
        !error &&
        Object.keys(filteredMenuData).length > 0 && (
          <MenuList menuData={filteredMenuData} isKeyActive={isKeyActive} />
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
