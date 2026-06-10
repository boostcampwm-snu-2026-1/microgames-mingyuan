"use client";

import type { Microgame } from "@/data/microgames";
import { useSudokuGameCanvas } from "@/games/useSudokuGame";

export function SudokuGame({ microgame }: Readonly<{ microgame: Microgame }>) {
  void microgame;

  const canvasRef = useSudokuGameCanvas();

  return (
    <canvas ref={canvasRef} className="block h-screen w-screen bg-[#070b20]" />
  );
}
