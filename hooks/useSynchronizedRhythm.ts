"use client";

import type { CSSProperties } from "react";

const BASE_BGM_DURATION_MS = 4000;
const BASE_BGM_BEATS = 8;

export const RHYTHM_DURATION_MS = BASE_BGM_DURATION_MS / BASE_BGM_BEATS;
const RHYTHM_STAGGER_MS = 120;

export type SynchronizedRhythmStyle = CSSProperties & {
  "--game-rhythm-delay"?: string;
  "--game-rhythm-duration": string;
  "--setup-life-delay"?: string;
};

export function useSynchronizedRhythm(
  beatDurationMs: number = RHYTHM_DURATION_MS,
) {
  const rhythmStyle = {
    "--game-rhythm-duration": `${beatDurationMs}ms`,
  } satisfies SynchronizedRhythmStyle;

  const getStaggeredRhythmStyle = (index: number) =>
    ({
      ...rhythmStyle,
      "--game-rhythm-delay": `${index * RHYTHM_STAGGER_MS}ms`,
    }) satisfies SynchronizedRhythmStyle;

  return {
    getStaggeredRhythmStyle,
    rhythmStyle,
  };
}
