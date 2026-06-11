"use client";

import type { Microgame } from "@/data/microgames";
import { useSuikaGameCanvas } from "@/games/useSuikaGame";

export function SuikaGame({ microgame }: Readonly<{ microgame: Microgame }>) {
  const canvasRef = useSuikaGameCanvas();

  return (
    <canvas
      ref={canvasRef}
      aria-label={microgame.startPrompt}
      className="block h-screen w-screen bg-[#c98742]"
    />
  );
}
