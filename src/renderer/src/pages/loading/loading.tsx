import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import textImgUrl from "../../shared/assets/hotkey-text.png";
import logoImgUrl from "../../shared/assets/hotkey-icon.png";

const DEFAULT_DURATION = 3000;
const MAX_PROGRESS = 100;

interface LoadingProps {
  duration?: number;
  onComplete?: () => void;
  redirectTo?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  textImage?: string;
  logoImage?: string;
}

function Loading({
  duration = DEFAULT_DURATION,
  onComplete,
  redirectTo = "/main",
  title = "HotKey",
  subtitle = "이제 HotKey가 당신의 작업을 더욱 쉽게 만들어 드릴게요!",
  ctaText = "함께 시작해 볼까요?",
  textImage = textImgUrl,
  logoImage = logoImgUrl,
}: LoadingProps): React.JSX.Element {
  const [progress, setProgress] = useState<number>(0);
  const animationFrameId = useRef<number>(0);
  const hasCompletedRef = useRef<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const validDuration =
      typeof duration === "number" && duration > 0
        ? duration
        : DEFAULT_DURATION;
    const start = performance.now();

    const handleComplete = () => {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;

      try {
        if (onComplete) {
          onComplete();
        } else if (redirectTo) {
          navigate(redirectTo);
        }
      } catch (error) {
        console.error("Loading completion error:", error);
        if (redirectTo && redirectTo !== window.location.pathname) {
          navigate(redirectTo);
        }
      }
    };

    const updateProgress = (currentTime: number) => {
      try {
        const elapsed = currentTime - start;
        const newProgress = Math.min(
          (elapsed / validDuration) * MAX_PROGRESS,
          MAX_PROGRESS
        );

        setProgress(newProgress);

        if (newProgress < MAX_PROGRESS && !hasCompletedRef.current) {
          animationFrameId.current = requestAnimationFrame(updateProgress);
        } else if (!hasCompletedRef.current) {
          handleComplete();
        }
      } catch (error) {
        console.error("Progress update error:", error);
        handleComplete();
      }
    };

    animationFrameId.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [duration, onComplete, redirectTo, navigate]);

  const progressPercentage = Math.round(progress);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = "none";
  };

  return (
    <div className="loading" role="main" aria-label="애플리케이션 로딩 중">
      <div className="loading__content">
        {textImage && (
          <img
            src={textImage}
            alt={`${title} 로고 텍스트`}
            className="loading__text-image"
            onError={handleImageError}
          />
        )}

        {logoImage && (
          <img
            src={logoImage}
            alt={`${title} 로고`}
            className="loading__logo-image"
            onError={handleImageError}
          />
        )}

        <div className="loading__message" role="status" aria-live="polite">
          <p className="loading__subtitle">
            {subtitle}
            <br />
            <strong>{ctaText}</strong>
          </p>
        </div>

        <div
          className="loading__progress"
          role="progressbar"
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`로딩 진행률: ${progressPercentage}%`}
        >
          <div
            className="loading__progress-bar"
            style={{
              transform: `scaleX(${progress / MAX_PROGRESS})`,
              transformOrigin: "left center",
            }}
          />
        </div>

        <div className="loading__progress-text" aria-live="polite">
          {progressPercentage}% 완료
        </div>
      </div>
    </div>
  );
}

export default Loading;
