import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import textImgUrl from "../assets/HotKey.png";
import logoImgUrl from "../assets/hotkey_icon.png";

function Info() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeApp, setActiveApp] = useState("");

  useEffect(() => {
    const storedActiveApp = localStorage.getItem("activeApp");
    if (storedActiveApp) {
      setActiveApp(storedActiveApp);
    }
  }, []);

  const fetchActiveApp = async () => {
    try {
      const activeApp = await window.api.invoke("get-active-app");
      return activeApp || "활성화된 앱 정보를 찾을 수 없습니다.";
    } catch (error) {
      console.error("활성화된 앱을 가져오는 중 오류가 발생했습니다.", error);
      return null;
    }
  };

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const currentApp = await fetchActiveApp();
      if (currentApp) {
        setActiveApp(currentApp);
        localStorage.setItem("activeApp", currentApp);
      }
      navigate("/hotkey", {
        state: {
          initialMessage: "버튼을 눌러 현재 활성화된 앱의 단축키를 확인하세요.",
        },
      });
    } catch (error) {
      console.error("앱을 실행하는 중 오류가 발생했습니다.", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-fit h-[900px] m-auto flex flex-col justify-center gap-[2rem]">
      <div className="flex gap-[10px] items-center">
        <img src={logoImgUrl} alt="HotKey Logo" className="block w-[60px]" />
        <img
          src={textImgUrl}
          alt="HotKey Text"
          className="block w-[70px] h-[25px]"
        />
      </div>
      <div className="contentWrap w-fit flex flex-col tracking-tighter">
        <div className="flex items-center gap-[0.5rem] mt-[1rem]">
          <h1 className="flex justify-center items-center w-[25%] h-[40px] bg-[#ff8c00] text-[#fff] text-lg rounded-t-lg">
            사용자 가이드
          </h1>
          <h2 className="font-medium text-[#FF8C00]">
            앱 사용을 위해 꼭 설정해 주세요!
          </h2>
        </div>

        <div className="mb-[2rem] py-[1rem] bg-[#f6f6f6] shadow-sm">
          <p className="text-[#333] text-lg text-center leading-8">
            이 앱은 활성화된 메뉴바의 단축키 정보를 가져오고 있어요
            <br />
            <span
              className="inline mr-1.5 px-5 py-1 text-sm
             text-[#fff] bg-[#000] rounded-full"
            >
              사용 시작
            </span>
            버튼을 누르고 원하는 앱을 실행해 보세요!
          </p>
        </div>

        <ul className="list-disc leading-7 text-[#777] mb-[4rem]">
          <li className="list-none">
            <h3 className="text-lg text-[#000] font-bold py-[0.5rem]">
              macOS에서 개인정보 보호 해제
            </h3>
          </li>
          <li className="ml-[1rem]">
            <span className="inline-block align-middle">
              <svg
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className="w-[17px] h-[17px] mr-1"
              >
                <title>Apple</title>
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
              </svg>
            </span>
            Apple 메뉴 &gt; 시스템 설정 &gt; 개인정보 보호 및 보안
          </li>
          <li className="ml-[1rem]">
            사이드바에서
            <span className="text-[#FF8C00]"> 개인정보 보호 및 보안</span> 을
            클릭 (아래로 스크롤해야 할 수 있어요.)
          </li>
          <li className="ml-[1rem]">
            위치, 카메라, 마이크 등의 권한을 관리하세요.
          </li>
          <li className="ml-[1rem]">
            전체 디스크 접근 권한을 설정하려면{" "}
            <span className="text-[#FF8C00]">전체 디스크 접근</span> 항목에서
            관리하세요.
          </li>
        </ul>

        <button
          className={`w-[95%] h-[50px] rounded-full mx-auto my-[10px] text-xl text-[#fff] relative z-10 cursor-pointer bg-[#000] transition-all hover:bg-[#FF8C00] ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={handleStart}
          disabled={isLoading}
        >
          {isLoading ? "로딩 중..." : "사용 시작"}
        </button>

        {activeApp && (
          <div className="mt-4 text-center text-lg text-[#333]"></div>
        )}
      </div>
    </div>
  );
}

export default Info;
