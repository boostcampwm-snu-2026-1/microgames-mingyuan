"use client";

import { useRef } from "react";
import type { Microgame } from "@/data/microgames";
import { useUndertaleMouseGameCanvas } from "@/games/useUndertaleMouseGame";

export function UndertaleMouseGame({
  microgame,
}: Readonly<{ microgame: Microgame }>) {
  const gameOverAudioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useUndertaleMouseGameCanvas(
    microgame.beatCount,
    gameOverAudioRef,
  );

  return (
    <>
      <canvas ref={canvasRef} className="block h-screen w-screen bg-black" />
      <audio
        ref={gameOverAudioRef}
        preload="auto"
        src="/games/undertale/sounds/game-over-undertale.mp3"
      />
    </>
  );
}
