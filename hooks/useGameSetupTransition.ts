"use client";

import { useEffect } from "react";
import { bgmLibrary } from "@/lib/bgmLibrary";

type UseGameSetupTransitionParams = Readonly<{
  isActive: boolean;
  onComplete: () => void;
}>;

export function useGameSetupTransition({
  isActive,
  onComplete,
}: UseGameSetupTransitionParams) {
  useEffect(() => {
    if (!isActive) {
      return;
    }

    let isCancelled = false;
    let transitionTimer: number | null = null;

    Promise.all([
      bgmLibrary.play("setup", "once", "now"),
      bgmLibrary.getTrackDurationMs("setup"),
    ])
      .then(([, setupDurationMs]) => {
        if (isCancelled) {
          return;
        }

        transitionTimer = window.setTimeout(() => {
          onComplete();
        }, setupDurationMs);
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      isCancelled = true;

      if (transitionTimer !== null) {
        window.clearTimeout(transitionTimer);
      }
    };
  }, [isActive, onComplete]);
}
