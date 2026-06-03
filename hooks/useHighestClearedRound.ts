"use client";

import { useCallback, useState } from "react";

const HIGHEST_CLEARED_ROUND_STORAGE_KEY = "catTower.highestClearedRound";

function readHighestClearedRound() {
  if (typeof window === "undefined") {
    return 0;
  }

  const storedValue = window.localStorage.getItem(
    HIGHEST_CLEARED_ROUND_STORAGE_KEY,
  );
  const parsedValue = Number.parseInt(storedValue ?? "0", 10);

  return Number.isFinite(parsedValue) ? Math.max(parsedValue, 0) : 0;
}

function writeHighestClearedRound(highestClearedRound: number) {
  window.localStorage.setItem(
    HIGHEST_CLEARED_ROUND_STORAGE_KEY,
    highestClearedRound.toString(),
  );
}

export function useHighestClearedRound() {
  const [highestClearedRound, setHighestClearedRound] = useState(
    readHighestClearedRound,
  );

  const recordHighestClearedRound = useCallback((clearedRound: number) => {
    setHighestClearedRound((currentHighestClearedRound) => {
      const nextHighestClearedRound = Math.max(
        currentHighestClearedRound,
        clearedRound,
      );

      writeHighestClearedRound(nextHighestClearedRound);

      return nextHighestClearedRound;
    });
  }, []);

  return {
    highestClearedRound,
    recordHighestClearedRound,
  };
}
