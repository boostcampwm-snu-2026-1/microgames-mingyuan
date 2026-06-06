"use client";

import type { Microgame } from "@/data/microgames";
import { useAppleGameCanvas } from "@/games/useAppleGame";

export function AppleGame({ microgame }: Readonly<{ microgame: Microgame }>) {
  const canvasRef = useAppleGameCanvas();

  void microgame;

  return (
    <canvas
      ref={canvasRef}
      className="block h-screen w-screen touch-none bg-emerald-50"
    />
  );
}
