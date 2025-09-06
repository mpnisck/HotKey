import { specialKeys } from "../config/keyboard";
import { MenuItem } from "../types";

export interface ProcessedMenuItems {
  [category: string]: MenuItem[];
}

export const getKeyStyle = (key: string, keyboardKeys: Set<string>): string => {
  const upperKey = key.toUpperCase();
  const isPressed = keyboardKeys.has(upperKey);

  if (isPressed) return "bg-[#FE8E00] text-[#fff] shadow-lg scale-105";
  if (specialKeys.has(upperKey))
    return "bg-gray-200 text-gray-800 shadow-sm hover:bg-gray-300";
  return "bg-[#fff] text-gray-800 shadow-sm hover:bg-gray-100";
};

export const processMenuItems = (items: MenuItem[]): ProcessedMenuItems => {
  return items.reduce((accumulator: ProcessedMenuItems, item) => {
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
