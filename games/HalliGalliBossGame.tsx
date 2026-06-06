"use client";

import type { Microgame } from "@/data/microgames";
import { useHalliGalliBossGameCanvas } from "@/games/useHalliGalliBossGame";

export function HalliGalliBossGame({
  microgame,
}: Readonly<{ microgame: Microgame }>) {
  const canvasRef = useHalliGalliBossGameCanvas(microgame.beatCount);

  return (
    <canvas
      ref={canvasRef}
      className="block h-screen w-screen touch-none bg-black"
    />
  );
}
