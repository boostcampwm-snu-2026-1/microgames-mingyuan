"use client";

import type { Microgame } from "@/data/microgames";
import { useFireAndIceDanceGameCanvas } from "@/games/useFireAndIceDanceGame";

export function FireAndIceDanceGame({
  microgame,
}: Readonly<{ microgame: Microgame }>) {
  const canvasRef = useFireAndIceDanceGameCanvas(microgame.beatCount);

  return (
    <canvas ref={canvasRef} className="block h-screen w-screen bg-[#16052f]" />
  );
}
