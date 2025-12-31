import React from "react";
import {
  macBookProKeyboardLayout,
  specialKeyWidths,
} from "@/shared/config/keyboard";
import { getKeyStyle } from "@/shared/lib/keyboard";

interface KeyboardProps {
  keyboardKeys: Set<string>;
}

function Keyboard({ keyboardKeys }: KeyboardProps): React.JSX.Element {
  return (
    <div className="bg-[#fff] shadow-md rounded-lg p-4 mt-4">
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

              return (
                <div
                  key={`key-${key}-${rowIndex}-${keyIndex}`}
                  className={`${specialKeyWidths[key] || "w-12"} h-7 rounded-md text-center flex items-center justify-center font-medium cursor-default transition-all ease-in-out ${getKeyStyle(key, keyboardKeys)} ${isSpecialKey ? "text-xs" : "text-xs"}`}
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
  );
}

export default Keyboard;
