import { useNavigate } from "react-router-dom";
import textImgUrl from "../assets/HotKey.png";
import logoImgUrl from "../assets/hotkey_icon.png";

function Info() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/hotkey", {
      state: {
        initialMessage: "Tab 키를 눌러 현재 활성화된 앱의 단축키를 확인하세요.",
      },
    });
  };

  return (
    <div className="w-[95%] h-[900px] m-auto flex flex-col justify-center gap-[1rem]">
      <div className="flex gap-[10px] items-center">
        <img src={logoImgUrl} alt="HotKey Logo" className="block w-[60px]" />
        <img
          src={textImgUrl}
          alt="HotKey Text"
          className="block w-[70px] h-[25px]"
        />
      </div>
      <div className="contentWrap w-fit flex flex-col tracking-tighter">
        <div className="flex items-center gap-[0.5rem] my-[1rem]">
          <h1 className="flex justify-center items-center w-[25%] h-[40px] bg-[#ff8c00] text-[#fff] text-lg rounded-full">
            사용자 가이드
          </h1>
          <h2 className="font-medium text-[#FF8C00]">
            앱 사용을 위해 꼭 설정해 주세요!
          </h2>
        </div>

        <div>
          <ul className="list-disc leading-7 text-[#777] mb-[1.4rem]">
            <li className="list-none">
              <h3 className="text-lg text-[#000] font-bold py-[0.5rem]">
                개인정보 보호 설정 해제
              </h3>
            </li>
            <li className="ml-[1rem]">
              설정 창을 열고, 개인정보 보호를 클릭해 볼까요?
            </li>
            <li className="ml-[1rem]">
              시작 메뉴 &gt; 설정 &gt; 개인정보 보호로 이동해 주세요.
            </li>
            <li className="ml-[1rem]">
              왼쪽 메뉴에서 일반을 클릭하고, 여러 옵션을 확인해 볼까요?
            </li>
            <li className="ml-[1rem]">
              예를 들어, 앱이 내 정보에 액세스하도록 허용을 끄거나,
              <br />
              위치나 음성인식 등을 비활성화할 수 있어요!
            </li>
            <li className="ml-[1rem]">
              진단 및 데이터 항목에서 기본 설정을 선택하거나
              <br />
              모든 데이터 공유 설정을 변경도 할 수 있어요!
            </li>
          </ul>

          <ul className="list-disc leading-7 text-[#777] mb-[1.4rem]">
            <li className="list-none">
              <h3 className="text-lg text-[#000] font-bold py-[0.5rem]">
                앱 권한 관리
              </h3>
            </li>
            <li className="ml-[1rem]">
              관리하려면, 개인정보 보호 &gt; 앱 권한에서 각 앱별로 접근할 수
              있는 권한을 조정할 수 있어요!
            </li>
            <li className="ml-[1rem]">
              카메라, 마이크, 위치, 알림 등 각 항목을 클릭하고 권한도 해제할 수
              있어요!
            </li>
          </ul>

          <ul className="list-disc leading-7 text-[#777] mb-[1.4rem]">
            <li className="list-none">
              <h3 className="text-lg text-[#000] font-bold py-[0.5rem]">
                macOS에서 개인정보 보호 해제
              </h3>
            </li>
            <li className="ml-[1rem]">
              시스템 환경설정을 열고 보안 및 개인정보 보호로 이동해 볼까요?
            </li>
            <li className="ml-[1rem]">
              상단 탭에서 개인정보 보호를 클릭해 주세요!
            </li>
            <li className="ml-[1rem]">
              여기서 위치 서비스, 마이크, 카메라, 연락처 등 각 항목에 대한 앱의
              권한을 관리할 수 있어요!
            </li>
            <li className="ml-[1rem]">
              앱 목록에서 권한을 허용하거나 비활성화할 수 있어요!
            </li>
            <li className="ml-[1rem]">
              앱별로 전체 디스크 접근 권한, 하드웨어 리소스 접근 등을 수정할 수
              있어요!
            </li>
            <li className="ml-[1rem]">
              전체 디스크 접근 권한을 설정하려면, 시스템 환경설정 &gt; 보안 및
              개인정보 보호 &gt;
              <br />
              전체 디스크 접근에서 앱별로 권한을 허용/거부할 수 있어요!
            </li>
          </ul>
        </div>

        <button
          className="w-[95%] h-[50px] rounded-full mx-auto my-[10px] text-2xl text-[#fff] relative z-10 cursor-pointer bg-[#000] transition-all hover:bg-[#FF8C00]"
          onClick={handleStart}
        >
          사용 시작
        </button>
      </div>
    </div>
  );
}

export default Info;
