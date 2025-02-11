import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import textImgUrl from "../assets/HotKey.png";
import logoImgUrl from "../assets/hotkey_icon.png";

function Loading() {
  const [progress, setProgress] = useState(0);
  const animationFrameId = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    const duration = 3000;
    const start = performance.now();

    const loadingProgress = (currentTime) => {
      const elapsed = currentTime - start;
      const newProgress = Math.min((elapsed / duration) * 100, 100);

      setProgress(newProgress);

      if (newProgress < 100) {
        animationFrameId.current = requestAnimationFrame(loadingProgress);
      } else {
        navigate("/main");
      }
    };

    animationFrameId.current = requestAnimationFrame(loadingProgress);

    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [navigate]);

  return (
    <div className="w-full h-screen flex flex-col justify-center items-center gap-[50px]">
      <img src={textImgUrl} alt="HotKey Text" className="block w-[25%]" />
      <img src={logoImgUrl} alt="HotKey Logo" className="block w-[20%]" />
      <p className="text-xl text-[#333]">Loading ...</p>

      <div className="w-[50%] h-[10px] bg-gray-200 rounded-full">
        <div
          className="h-full bg-[#000] rounded-full"
          style={{ width: `${progress}%`, transition: "width 0.1s linear" }}
        />
      </div>
    </div>
  );
}

export default Loading;
