"use client";

import type { Microgame } from "@/data/microgames";
import { useCrazyArcadeGameCanvas } from "@/games/useCrazyArcadeGame";

export function CrazyArcadeGame({
  microgame,
}: Readonly<{ microgame: Microgame }>) {
  const canvasRef = useCrazyArcadeGameCanvas(microgame.beatCount);

  return (
    <canvas
      ref={canvasRef}
      className="block h-screen w-screen touch-none bg-[#0062bc]"
    />
  );
}
