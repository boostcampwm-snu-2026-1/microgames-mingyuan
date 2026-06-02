"use client";

import type { CSSProperties } from "react";

const RHYTHM_DURATION_MS = 1200;
const RHYTHM_STAGGER_MS = 120;

export type SynchronizedRhythmStyle = CSSProperties & {
  "--game-rhythm-delay"?: string;
  "--game-rhythm-duration": string;
};

export function useSynchronizedRhythm() {
  const rhythmStyle = {
    "--game-rhythm-duration": `${RHYTHM_DURATION_MS}ms`,
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
