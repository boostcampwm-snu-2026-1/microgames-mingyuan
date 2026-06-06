"use client";

import Image from "next/image";
import type { Microgame } from "@/data/microgames";
import { useSuperMarioGalaxyGame } from "@/games/useSuperMarioGalaxyGame";

const BACKGROUND_SRC = "/games/super-mario-galaxy/images/background.png";

export function SuperMarioGalaxyGame({
  microgame,
}: Readonly<{ microgame: Microgame }>) {
  void microgame;

  const {
    bits,
    collectedBitIds,
    containerRef,
    handlePointerCancel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useSuperMarioGalaxyGame();

  return (
    <div
      className="relative h-screen w-screen cursor-grab touch-none overflow-hidden bg-[#050816] active:cursor-grabbing"
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      ref={containerRef}
    >
      <Image
        alt=""
        className="object-cover"
        fill
        priority
        sizes="100vw"
        src={BACKGROUND_SRC}
        unoptimized
      />
      <div className="absolute inset-0 bg-black/10" />
      {bits.map((bit) => {
        const isCollected = collectedBitIds.includes(bit.id);

        return (
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute z-10 size-[clamp(3.5rem,7.2vw,5.4rem)] -translate-x-1/2 -translate-y-1/2 transition duration-200 ${
              isCollected
                ? "scale-0 opacity-0 blur-sm"
                : "scale-100 opacity-100 drop-shadow-[0_0_18px_rgba(255,255,255,0.68)]"
            }`}
            key={bit.id}
            style={{
              left: `${bit.x}%`,
              top: `${bit.y}%`,
            }}
          >
            <Image
              alt=""
              className="animate-spin object-contain"
              fill
              sizes="86px"
              src={bit.imageSrc}
              style={{
                animationDelay: `${bit.rotationDelaySeconds}s`,
                animationDuration: "1.35s",
              }}
              unoptimized
            />
          </div>
        );
      })}
    </div>
  );
}
