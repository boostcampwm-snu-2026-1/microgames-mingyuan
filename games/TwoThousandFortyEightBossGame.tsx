"use client";

import type { Microgame } from "@/data/microgames";
import { useTwoThousandFortyEightBossGameCanvas } from "@/games/useTwoThousandFortyEightBossGame";

export function TwoThousandFortyEightBossGame({
  microgame,
}: Readonly<{ microgame: Microgame }>) {
  const canvasRef = useTwoThousandFortyEightBossGameCanvas();

  void microgame;

  return (
    <canvas ref={canvasRef} className="block h-screen w-screen bg-[#faf8ef]" />
  );
}
