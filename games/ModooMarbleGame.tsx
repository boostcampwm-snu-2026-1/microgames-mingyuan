"use client";

import type { Microgame } from "@/data/microgames";
import { useModooMarbleGameCanvas } from "@/games/useModooMarbleGame";

export function ModooMarbleGame({
  microgame,
}: Readonly<{ microgame: Microgame }>) {
  void microgame;

  const canvasRef = useModooMarbleGameCanvas();

  return (
    <canvas
      ref={canvasRef}
      className="block h-screen w-screen touch-none bg-[#21143f]"
    />
  );
}
