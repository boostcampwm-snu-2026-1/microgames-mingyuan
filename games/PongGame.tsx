"use client";

import type { Microgame } from "@/data/microgames";
import { usePongGameCanvas } from "@/games/usePongGame";

export function PongGame({ microgame }: Readonly<{ microgame: Microgame }>) {
  const canvasRef = usePongGameCanvas(microgame.beatCount);

  return (
    <canvas ref={canvasRef} className="block h-screen w-screen bg-black" />
  );
}
