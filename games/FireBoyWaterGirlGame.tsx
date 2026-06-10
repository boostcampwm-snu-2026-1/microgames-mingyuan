"use client";

import type { Microgame } from "@/data/microgames";
import { useFireBoyWaterGirlGameCanvas } from "@/games/useFireBoyWaterGirlGame";

export function FireBoyWaterGirlGame({
  microgame,
}: Readonly<{ microgame: Microgame }>) {
  const canvasRef = useFireBoyWaterGirlGameCanvas(microgame.beatCount);

  return (
    <canvas ref={canvasRef} className="block h-screen w-screen bg-[#24250f]" />
  );
}
