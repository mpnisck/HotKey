import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import textImgUrl from "@/shared/assets/hotkey-text.png";
import logoImgUrl from "@/shared/assets/hotkey-icon.png";
import accessImgUrl from "@/shared/assets/universal-access-icon.png";
import { electronApi } from "@/shared/api";
import { STORAGE_KEYS, ERROR_MESSAGES } from "@/shared/config/storage";

function Info(): React.JSX.Element {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchActiveApp = async (): Promise<string | null> => {
    try {
      const activeApp = await electronApi.getActiveApp();
      return activeApp || ERROR_MESSAGES.NO_APP;
    } catch (error) {
      console.error(ERROR_MESSAGES.FETCH_ERROR, error);
      return null;
    }
  };

  const handleStart = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const currentApp = await fetchActiveApp();
      if (currentApp) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_APP, currentApp);
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
    <div className="w-fit h-[700px] m-auto flex flex-col justify-center gap-[2rem]">
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
          <h1 className="flex justify-center items-center w-[30%] h-[35px] bg-[#ff8c00] text-[#fff] text-sm font-medium rounded-t-lg">
            사용자 가이드
          </h1>
        </div>

        <div className="mb-6 p-[1rem] bg-[#f6f6f6] shadow-sm">
          <p className="text-[#333] text-base text-center leading-8">
            현재 사용 중인 앱의 모든 단축키를 한눈에!
            <br />
            <span className="inline px-3 py-1 text-sm text-[#fff] bg-[#000] rounded-full">
              사용 시작
            </span>
            {" → "}
            <span className="text-[#FF8C00] font-semibold">앱 선택</span>
            {" → "}
            <span className="text-[#FF8C00] font-semibold">
              ⌘ 2초 꾹 누르기
            </span>
          </p>
        </div>

        <ul className="list-disc leading-7 text-[#777] text-sm">
          <li className="list-none">
            <h3 className="text-base text-[#000] font-bold py-[0.5rem]">
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
            <span className="inline-block align-middle w-[21px] h-[21px] mr-1">
              <img src={accessImgUrl} alt="AccessIcon" />
            </span>
            손쉬운 사용에서 + 버튼을 통해 응용 프로그램 중 HotKey 앱을 추가
          </li>
          <li className="ml-[1rem]">
            HotKey 앱 제어를 허용 후 사용법을 확인하세요!
          </li>
          <li className="list-none">
            <h3 className="text-base text-[#000] font-bold py-[0.5rem]">
              HotKey 사용법
            </h3>
          </li>
        </ul>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-3 p-3 bg-[#f9f9f9] shadow-sm rounded-lg">
            <span className="flex items-center justify-center w-6 h-6 text-xs font-regular text-white bg-[#333] rounded-full">
              1
            </span>
            <span className="text-sm text-[#333]">사용 시작 클릭</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#f9f9f9] shadow-sm rounded-lg">
            <span className="flex items-center justify-center w-6 h-6 text-xs font-regular text-white bg-[#333] rounded-full">
              2
            </span>
            <span className="text-sm text-[#333]">원하는 앱 활성화</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#f9f9f9] shadow-sm rounded-lg">
            <span className="flex items-center justify-center w-6 h-6 text-xs font-regular text-white bg-[#333] rounded-full">
              3
            </span>
            <span className="text-sm text-[#333]">⌘ 2초간 꾹 누르기</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#f9f9f9] shadow-sm rounded-lg">
            <span className="flex items-center justify-center w-6 h-6 text-xs font-regular text-white bg-[#333] rounded-full">
              4
            </span>
            <span className="text-sm text-[#333]">⌘⌥⌃⇧ 키로 바로 검색</span>
          </div>
        </div>

        <button
          className={`w-[95%] h-[50px] rounded-full mx-auto mt-4 text-xl text-[#fff] relative z-10 cursor-pointer bg-[#000] transition-all hover:bg-[#FF8C00] ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={handleStart}
          disabled={isLoading}
        >
          {isLoading ? "로딩 중..." : "사용 시작"}
        </button>
      </div>
    </div>
  );
}

export default Info;
