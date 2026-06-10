"use client";

import type { Microgame } from "@/data/microgames";
import { useBabaIsYouGameCanvas } from "@/games/useBabaIsYouGame";

export function BabaIsYouGame({
  microgame,
}: Readonly<{ microgame: Microgame }>) {
  const canvasRef = useBabaIsYouGameCanvas();

  return (
    <canvas
      ref={canvasRef}
      aria-label={microgame.startPrompt}
      className="block h-screen w-screen bg-black"
    />
  );
}
