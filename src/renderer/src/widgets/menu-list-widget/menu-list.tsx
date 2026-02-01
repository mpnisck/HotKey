import React from "react";
import { MenuData } from "@/shared/types";

interface MenuListProps {
  menuData: MenuData;
  isKeyActive: boolean;
}

function MenuList({ menuData, isKeyActive }: MenuListProps): React.JSX.Element {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {Object.entries(menuData).map(([category, items]) => (
        <div key={category} className="mb-6">
          <h2 className="text-lg font-semibold mb-5 bg-gray-100 p-3 rounded">
            {category}
          </h2>
          <div className="grid gap-2">
            {items.map((item) => (
              <div
                key={`${category}-${item.name}`}
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
  );
}

export default MenuList;
