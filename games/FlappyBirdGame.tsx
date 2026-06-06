"use client";

import type { Microgame } from "@/data/microgames";
import { useFlappyBirdGameCanvas } from "@/games/useFlappyBirdGame";

export function FlappyBirdGame({
  microgame,
}: Readonly<{ microgame: Microgame }>) {
  const canvasRef = useFlappyBirdGameCanvas(microgame.beatCount);

  return (
    <canvas ref={canvasRef} className="block h-screen w-screen bg-[#70c5ce]" />
  );
}
