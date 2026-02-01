import React, { useCallback } from "react";
import { useHotkeyStore } from "@/entities/hot-key";
import { useKeyTracking } from "@/features/key-tracking/use-key-tracking";
import { useAppDetection } from "@/features/app-detection/use-app-detection";
import { useFilteredMenu } from "@/features/menu-filter/use-filtered-menu";
import Keyboard from "@/widgets/keyboard-widget/keyboard";
import MenuList from "@/widgets/menu-list-widget/menu-list";

function Hotkey(): React.JSX.Element {
  const { showMenuData } = useHotkeyStore();
  const { menuData, error, isLoading, activeApp, triggerActivation } =
    useAppDetection();

  const handleLongPressCommand = useCallback(
    (appName?: string) => {
      triggerActivation(appName);
    },
    [triggerActivation]
  );

  const {
    keyboardKeys,
    isKeyActive,
    isCommandPressed,
    isOptionPressed,
    isControlPressed,
    isShiftPressed,
    isFnPressed,
    isArmed,
    isActivated,
    longPressProgress,
  } = useKeyTracking(handleLongPressCommand);

  const filteredMenuData = useFilteredMenu({
    menuData,
    isKeyActive,
    modifiers: {
      isCommandPressed,
      isOptionPressed,
      isControlPressed,
      isShiftPressed,
      isFnPressed,
    },
  });

  return (
    <div className="w-[95%] h-[670px] m-auto flex flex-col">
      <div className="flex justify-between items-center p-4 bg-[#333] text-[#fff] rounded">
        <h1 className="text-lg font-semibold">단축키 정보</h1>
        <p className="text-[#666]">
          {isArmed && !isActivated ? (
            <span className="text-lg font-semibold bg-[#666] text-[#fff] py-2 px-5 rounded-full animate-pulse">
              대기 중...
            </span>
          ) : activeApp ? (
            <span className="text-lg font-semibold bg-[#FE8E00] text-[#fff] py-2 px-5 rounded-full">
              {activeApp}
            </span>
          ) : null}
        </p>
      </div>

      <Keyboard keyboardKeys={keyboardKeys} />

      {Object.keys(menuData).length === 0 && !isLoading && (
        <div className="flex items-center justify-center py-10">
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="relative">
              <div className="text-6xl">⌘</div>
              {longPressProgress > 0 && (
                <svg
                  className="absolute inset-0 w-full h-full -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#e5e5e5"
                    strokeWidth="6"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#FE8E00"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${longPressProgress * 2.83} 283`}
                  />
                </svg>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-[#333] text-base">
                <span className="text-[#FE8E00] font-semibold">1.</span>{" "}
                단축키를 확인할 앱을 활성화하세요
              </div>
              <div className="text-[#333] text-base">
                <span className="text-[#FE8E00] font-semibold">2.</span>{" "}
                <span className="font-semibold">⌘ Command 키를 2초간 꾹</span>{" "}
                눌러주세요
              </div>
              {longPressProgress > 0 && (
                <div className="text-[#FE8E00] font-semibold text-lg animate-pulse">
                  {Math.round(longPressProgress)}% 진행 중...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}

export default Hotkey;
