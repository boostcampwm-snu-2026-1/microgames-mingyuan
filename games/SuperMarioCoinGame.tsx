"use client";

import type { Microgame } from "@/data/microgames";
import { useSuperMarioCoinGameCanvas } from "@/games/useSuperMarioCoinGame";

export function SuperMarioCoinGame({
  microgame,
}: Readonly<{ microgame: Microgame }>) {
  const canvasRef = useSuperMarioCoinGameCanvas(microgame.beatCount);

  return (
    <canvas ref={canvasRef} className="block h-screen w-screen bg-sky-400" />
  );
}
