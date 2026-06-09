"use client";

import { useCallback, useState } from "react";

const PLAYER_ID_STORAGE_KEY = "catTower.playerId";
const USERNAME_STORAGE_KEY = "catTower.username";
const SUBMITTED_BEST_STORAGE_KEY = "catTower.submittedBest";

function readSubmittedBest() {
  if (typeof window === "undefined") {
    return 0;
  }

  const storedValue = window.localStorage.getItem(SUBMITTED_BEST_STORAGE_KEY);
  const parsedValue = Number.parseInt(storedValue ?? "0", 10);

  return Number.isFinite(parsedValue) ? Math.max(parsedValue, 0) : 0;
}

function readOrCreatePlayerId() {
  if (typeof window === "undefined") {
    return "";
  }

  const storedPlayerId = window.localStorage.getItem(PLAYER_ID_STORAGE_KEY);

  if (storedPlayerId) {
    return storedPlayerId;
  }

  const playerId = window.crypto.randomUUID();
  window.localStorage.setItem(PLAYER_ID_STORAGE_KEY, playerId);

  return playerId;
}

function readUsername() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(USERNAME_STORAGE_KEY)?.trim() ?? "";
}

export function usePlayerIdentity() {
  const [playerId] = useState(readOrCreatePlayerId);
  const [username, setUsernameState] = useState(readUsername);
  const [submittedBest, setSubmittedBest] = useState(readSubmittedBest);

  const saveUsername = useCallback((nextUsername: string) => {
    const normalizedUsername = nextUsername.trim();
    window.localStorage.setItem(USERNAME_STORAGE_KEY, normalizedUsername);
    setUsernameState(normalizedUsername);

    return normalizedUsername;
  }, []);

  const recordSubmittedBest = useCallback((score: number) => {
    setSubmittedBest((currentSubmittedBest) => {
      const nextSubmittedBest = Math.max(currentSubmittedBest, score);
      window.localStorage.setItem(
        SUBMITTED_BEST_STORAGE_KEY,
        nextSubmittedBest.toString(),
      );

      return nextSubmittedBest;
    });
  }, []);

  return {
    isReady: Boolean(playerId),
    playerId,
    recordSubmittedBest,
    saveUsername,
    submittedBest,
    username,
  };
}
