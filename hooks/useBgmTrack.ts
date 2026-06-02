"use client";

import { useEffect } from "react";
import {
  bgmLibrary,
  type BgmPlaybackMode,
  type BgmStartPolicy,
  type BgmTrack,
} from "@/lib/bgmLibrary";

export function useBgmTrack(
  track: BgmTrack | null,
  mode: BgmPlaybackMode = "loop",
  startPolicy?: BgmStartPolicy,
) {
  useEffect(() => {
    if (!track) {
      bgmLibrary.stop();
      return;
    }

    bgmLibrary.play(track, mode, startPolicy).catch((error: unknown) => {
      console.error(error);
    });
  }, [mode, startPolicy, track]);
}
