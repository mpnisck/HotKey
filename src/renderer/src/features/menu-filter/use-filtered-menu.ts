import { MenuData, MenuItem } from "@/shared/types";

interface ModifierState {
  isCommandPressed: boolean;
  isOptionPressed: boolean;
  isControlPressed: boolean;
  isShiftPressed: boolean;
  isFnPressed: boolean;
}

interface UseFilteredMenuParams {
  menuData: MenuData;
  isKeyActive: boolean;
  modifiers: ModifierState;
}

const MODIFIER_SYMBOLS = {
  command: "⌘",
  option: "⌥",
  control: "⌃",
  shift: "⇧",
  fn: "🌐",
} as const;

export const useFilteredMenu = ({
  menuData,
  isKeyActive,
  modifiers,
}: UseFilteredMenuParams): MenuData => {
  if (!isKeyActive) {
    return menuData;
  }

  const matchConditions = [
    {
      symbol: MODIFIER_SYMBOLS.command,
      pressed: modifiers.isCommandPressed,
    },
    {
      symbol: MODIFIER_SYMBOLS.option,
      pressed: modifiers.isOptionPressed,
    },
    {
      symbol: MODIFIER_SYMBOLS.control,
      pressed: modifiers.isControlPressed,
    },
    {
      symbol: MODIFIER_SYMBOLS.shift,
      pressed: modifiers.isShiftPressed,
    },
    {
      symbol: MODIFIER_SYMBOLS.fn,
      pressed: modifiers.isFnPressed,
    },
  ];

  const activeModifiers = matchConditions.filter((mod) => mod.pressed);

  if (activeModifiers.length === 0) {
    return menuData;
  }

  return Object.entries(menuData).reduce((acc: MenuData, [category, items]) => {
    const filteredItems = items.filter((item: MenuItem) => {
      const shortcut = item.shortcut || "";

      return activeModifiers.every((mod) => shortcut.includes(mod.symbol));
    });

    if (filteredItems.length > 0) {
      acc[category] = filteredItems;
    }
    return acc;
  }, {});
};
