"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useBgmTrack } from "@/hooks/useBgmTrack";
import { useGameSetupTransition } from "@/hooks/useGameSetupTransition";
import { useSynchronizedRhythm } from "@/hooks/useSynchronizedRhythm";
import {
  bgmLibrary,
  GAME_OVER_DURATION_MS,
  unlockBgmLibrary,
} from "@/lib/bgmLibrary";
import { FixedLivesOverlay } from "./FixedLivesOverlay";
import { MAIN_SCREEN_EXIT_MS } from "./gameFlowConstants";
import { NeonButton, NeonShell } from "./NeonShell";

export function MainScreen({
  highestClearedRound,
  onStart,
}: Readonly<{ highestClearedRound: number; onStart: () => void }>) {
  useBgmTrack("resultsAndMain", "loop", "now");
  const [isStarting, setIsStarting] = useState(false);
  const { rhythmStyle } = useSynchronizedRhythm();

  useEffect(() => {
    const unlockMainBgm = () => {
      unlockBgmLibrary().catch((error: unknown) => {
        console.error(error);
      });
    };

    unlockMainBgm();
    window.addEventListener("pointerdown", unlockMainBgm, { once: true });
    window.addEventListener("keydown", unlockMainBgm, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockMainBgm);
      window.removeEventListener("keydown", unlockMainBgm);
    };
  }, []);

  const startGame = () => {
    if (isStarting) {
      return;
    }

    setIsStarting(true);
    unlockBgmLibrary()
      .catch((error: unknown) => {
        console.error(error);
      })
      .finally(() => {
        window.setTimeout(() => {
          onStart();
        }, MAIN_SCREEN_EXIT_MS);
      });
  };

  return (
    <NeonShell rhythmStyle={rhythmStyle}>
      <div
        className={`rounded-lg border border-cyan-100/70 bg-black/55 p-6 shadow-[0_0_32px_rgba(103,232,249,0.18)] backdrop-blur-sm sm:p-8 ${
          isStarting ? "main-screen-exit-up" : ""
        }`}
      >
        <div className="grid gap-7 lg:grid-cols-[1fr_260px] lg:items-center">
          <div className="space-y-7">
            <p className="text-sm font-black uppercase tracking-[0.32em] text-cyan-100">
              마이크로게임 천국
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-black leading-none tracking-normal text-white drop-shadow-[0_0_18px_rgba(103,232,249,0.7)] sm:text-7xl">
                캣타워 오르기
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-cyan-50/85">
                고양이가 엘리베이터를 타고 캣타워를 오르는 것을 도와주세요. 과연
                당신은 몇 층까지 올라갈 수 있을까요? 당신의 센스를 보여주세요!
              </p>
            </div>
            <div className="max-w-xs rounded-md border border-cyan-100/55 bg-black/45 p-4 shadow-[0_0_24px_rgba(103,232,249,0.16)]">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/60">
                최고 기록
              </p>
              <p className="mt-2 flex items-end gap-2 text-cyan-100 drop-shadow-[0_0_16px_rgba(103,232,249,0.68)]">
                <span className="text-4xl font-black leading-none">
                  {highestClearedRound.toString().padStart(2, "0")}
                </span>
                <span className="pb-1 text-lg font-black leading-none">층</span>
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <NeonButton onClick={startGame}>
                {isStarting ? "준비 중" : "게임 시작"}
              </NeonButton>
            </div>
          </div>
          <div className="mx-auto w-full max-w-48 lg:max-w-none">
            <Image
              src="/games/game-flow/images/game-main-logo.png"
              alt="캣타워 오르기 로고"
              width={880}
              height={1268}
              priority
              className="main-logo-bounce h-auto w-full object-contain drop-shadow-[0_0_24px_rgba(103,232,249,0.45)]"
            />
          </div>
        </div>
      </div>
    </NeonShell>
  );
}

export function SetupScreen({
  lives,
  maxLives,
  onComplete,
}: Readonly<{
  lives: number;
  maxLives: number;
  onComplete: () => void;
}>) {
  const { getStaggeredRhythmStyle, rhythmStyle } = useSynchronizedRhythm();

  useGameSetupTransition({
    isActive: true,
    onComplete,
  });

  return (
    <NeonShell rhythmStyle={rhythmStyle} shouldDim={false}>
      <FixedLivesOverlay
        animateSetup
        getStaggeredRhythmStyle={getStaggeredRhythmStyle}
        lives={lives}
        maxLives={maxLives}
      />
    </NeonShell>
  );
}

export function LoadingScreen() {
  useBgmTrack("resultsAndMain", "loop", "now");

  return (
    <NeonShell>
      <div className="mx-auto w-full max-w-2xl rounded-lg border border-cyan-100/70 bg-black/65 p-6 text-center shadow-[0_0_36px_rgba(103,232,249,0.22)] backdrop-blur-sm sm:p-8">
        <p className="mb-4 text-sm font-black uppercase tracking-[0.32em] text-cyan-100">
          Cat Tower
        </p>
        <h1 className="text-4xl font-black text-white drop-shadow-[0_0_18px_rgba(103,232,249,0.65)] sm:text-6xl">
          잠시만 기다려 주세요
        </h1>
        <div className="loading-spinner-vital mx-auto mt-8 grid size-32 place-items-center sm:size-40">
          <Image
            src="/games/game-flow/images/loading-spinner.png"
            alt=""
            width={180}
            height={151}
            priority
            className="h-auto w-full object-contain drop-shadow-[0_0_22px_rgba(103,232,249,0.75)]"
          />
        </div>
        <div className="mx-auto my-8 h-4 max-w-md overflow-hidden rounded-full border border-cyan-100/70 bg-black">
          <div className="neon-loading-bar h-full rounded-full bg-cyan-200" />
        </div>
      </div>
    </NeonShell>
  );
}

export function GameOverScreen({
  finalClearedRound,
  highestClearedRound,
  onReturnToMain,
}: Readonly<{
  finalClearedRound: number;
  highestClearedRound: number;
  onReturnToMain: () => void;
}>) {
  useEffect(() => {
    bgmLibrary.play("gameOver", "once").catch((error: unknown) => {
      console.error(error);
    });

    const resultMusicTimer = window.setTimeout(() => {
      bgmLibrary
        .play("resultsAndMain", "loop", "now")
        .catch((error: unknown) => {
          console.error(error);
        });
    }, GAME_OVER_DURATION_MS);

    return () => {
      window.clearTimeout(resultMusicTimer);
    };
  }, []);

  const returnToMain = () => {
    unlockBgmLibrary()
      .catch((error: unknown) => {
        console.error(error);
      })
      .finally(onReturnToMain);
  };

  return (
    <NeonShell>
      <div className="game-over-comic-drop mx-auto w-full max-w-3xl rounded-lg border border-cyan-100/70 bg-black/70 p-6 text-center shadow-[0_0_38px_rgba(103,232,249,0.24)] backdrop-blur-sm sm:p-8">
        <p className="mb-4 text-sm font-black uppercase tracking-[0.32em] text-cyan-100">
          게임 종료
        </p>
        <h1 className="text-5xl font-black leading-none text-white drop-shadow-[0_0_18px_rgba(103,232,249,0.7)] sm:text-7xl">
          Game Over
        </h1>
        <div className="mx-auto my-8 grid max-w-xl gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-white/35 bg-black/45 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">
              도달 층
            </p>
            <p className="mt-3 flex items-end justify-center gap-2 text-cyan-100 drop-shadow-[0_0_18px_rgba(103,232,249,0.7)]">
              <span className="text-6xl font-black leading-none sm:text-7xl">
                {finalClearedRound.toString().padStart(2, "0")}
              </span>
              <span className="pb-1 text-2xl font-black leading-none">층</span>
            </p>
          </div>
          <div className="rounded-md border border-cyan-100/55 bg-black/45 p-6 shadow-[0_0_24px_rgba(103,232,249,0.16)]">
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">
              최고 기록
            </p>
            <p className="mt-3 flex items-end justify-center gap-2 text-cyan-100 drop-shadow-[0_0_18px_rgba(103,232,249,0.7)]">
              <span className="text-6xl font-black leading-none sm:text-7xl">
                {highestClearedRound.toString().padStart(2, "0")}
              </span>
              <span className="pb-1 text-2xl font-black leading-none">층</span>
            </p>
          </div>
        </div>
        <div className="flex justify-center">
          <NeonButton onClick={returnToMain}>메인으로</NeonButton>
        </div>
      </div>
    </NeonShell>
  );
}
