"use client";

import { useEffect, useState } from "react";
import { ALL_GAME_PRELOAD_ASSETS } from "@/games/preloadAssets";

const MIN_LOADING_TIME_MS = 900;
const MAX_LIVES = 4;

let allGameAssetsPreloadPromise: Promise<unknown> | null = null;

export type GameScreen = "main" | "loading" | "playing" | "gameOver";
export type GameRoundResult = "idle" | "success" | "failure";

function waitForMinimumLoadingTime() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, MIN_LOADING_TIME_MS);
  });
}

function preloadAsset(assetPath: string) {
  return fetch(assetPath, { cache: "force-cache" }).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to preload ${assetPath}`);
    }
  });
}

function preloadAllGameAssets() {
  allGameAssetsPreloadPromise ??= Promise.allSettled([
    ...ALL_GAME_PRELOAD_ASSETS.map(preloadAsset),
    waitForMinimumLoadingTime(),
  ]);

  return allGameAssetsPreloadPromise;
}

export function useGameScreenFlow() {
  const [screen, setScreen] = useState<GameScreen>("main");
  const [lives, setLives] = useState(MAX_LIVES);
  const [roundResult, setRoundResult] = useState<GameRoundResult>("idle");

  useEffect(() => {
    if (screen !== "loading") {
      return;
    }

    let isCurrentLoadingScreen = true;

    preloadAllGameAssets().then(() => {
      if (isCurrentLoadingScreen) {
        setScreen("playing");
      }
    });

    return () => {
      isCurrentLoadingScreen = false;
    };
  }, [screen]);

  const startGame = () => {
    setLives(MAX_LIVES);
    setRoundResult("idle");
    setScreen("loading");
  };

  const finishGame = () => {
    setLives(0);
    setScreen("gameOver");
  };

  const restartGame = () => {
    setLives(MAX_LIVES);
    setRoundResult("idle");
    setScreen("loading");
  };

  const returnToMain = () => {
    setLives(MAX_LIVES);
    setRoundResult("idle");
    setScreen("main");
  };

  const recordSuccess = () => {
    setRoundResult("success");
  };

  const loseLife = () => {
    setRoundResult("failure");
    setLives((currentLives) => {
      const nextLives = Math.max(currentLives - 1, 0);

      if (nextLives === 0) {
        setScreen("gameOver");
      }

      return nextLives;
    });
  };

  return {
    finishGame,
    lives,
    loseLife,
    maxLives: MAX_LIVES,
    recordSuccess,
    restartGame,
    returnToMain,
    roundResult,
    screen,
    startGame,
  };
}
