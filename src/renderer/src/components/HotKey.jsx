import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

function Hotkey() {
  const { state } = useLocation();
  const [menuData, setMenuData] = useState(state?.menuData || []);

  useEffect(() => {
    setMenuData(menuData);
    console.log("메뉴 데이터:", menuData);
  }, [menuData]);

  return (
    <div className="w-[90%] h-screen m-auto flex flex-col gap-[1rem] overflow-y-scroll">
      <div className="flex gap-[10px] items-center">
        <h1 className="text-2xl font-bold">단축키 정보</h1>
      </div>
      {menuData && menuData.length > 0 ? (
        <ul>
          {menuData.map((item, index) => (
            <li key={index} className="py-2">
              <strong>{item.name}</strong>
              <div>{item.shortcut}</div>
              <div>{item.icon}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p>활성화된 앱에 대한 단축키 정보가 없습니다.</p>
      )}
    </div>
  );
}

export default Hotkey;
