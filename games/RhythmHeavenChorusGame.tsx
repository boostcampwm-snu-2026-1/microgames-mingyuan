"use client";

import Image from "next/image";
import type { Microgame } from "@/data/microgames";
import {
  type ChorusSinger,
  useRhythmHeavenChorusGame,
} from "@/games/useRhythmHeavenChorusGame";

const BACKGROUND_SRC = "/games/rhythm-heaven/images/background.png";
const SINGING_SRC = "/games/rhythm-heaven/images/chorus-man-singing.png";
const IDLE_SRC = "/games/rhythm-heaven/images/chorus-man-idle.png";
const SINGER_LAYOUT = [
  {
    id: "first",
    label: "첫 번째 코러스맨",
    left: "43%",
    top: "43.5%",
    width: "clamp(6.5rem, 9.5vw, 10.5rem)",
  },
  {
    id: "second",
    label: "두 번째 코러스맨",
    left: "62%",
    top: "48.5%",
    width: "clamp(6.7rem, 9.8vw, 10.8rem)",
  },
  {
    id: "player",
    label: "플레이어 코러스맨",
    left: "81%",
    top: "53.5%",
    width: "clamp(6.9rem, 10.1vw, 11.1rem)",
  },
] satisfies ReadonlyArray<{
  id: ChorusSinger;
  label: string;
  left: string;
  top: string;
  width: string;
}>;

export function RhythmHeavenChorusGame({
  microgame,
}: Readonly<{ microgame: Microgame }>) {
  const {
    containerRef,
    handlePointerCancel,
    handlePointerDown,
    handlePointerUp,
    singingSingers,
  } = useRhythmHeavenChorusGame(microgame.beatCount);

  return (
    <div
      aria-label="Rhythm Heaven chorus microgame"
      className="relative h-screen w-screen cursor-pointer touch-none select-none overflow-hidden bg-[#d2d2d2]"
      onContextMenu={(event) => {
        event.preventDefault();
      }}
      onDragStart={(event) => {
        event.preventDefault();
      }}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      ref={containerRef}
    >
      <Image
        alt=""
        className="select-none object-cover"
        draggable={false}
        fill
        priority
        sizes="100vw"
        src={BACKGROUND_SRC}
        unoptimized
      />
      {SINGER_LAYOUT.map((singer) => {
        const isSinging = singingSingers.includes(singer.id);

        return (
          <div
            aria-label={singer.label}
            className="pointer-events-none absolute aspect-[3/5] -translate-x-1/2 -translate-y-1/2"
            key={singer.id}
            style={{
              left: singer.left,
              top: singer.top,
              width: singer.width,
            }}
          >
            {singer.id === "player" ? (
              <div className="absolute -top-12 left-1/2 z-10 -translate-x-1/2 text-[clamp(1.8rem,3.2vw,3rem)] font-black leading-none text-black [text-shadow:0_2px_0_white,2px_0_0_white,0_-2px_0_white,-2px_0_0_white]">
                나
              </div>
            ) : null}
            <Image
              alt=""
              className={`select-none object-contain transition-transform duration-75 ${
                isSinging ? "chorus-man-singing" : "scale-100"
              }`}
              draggable={false}
              fill
              priority
              sizes="256px"
              src={isSinging ? SINGING_SRC : IDLE_SRC}
              unoptimized
            />
          </div>
        );
      })}
    </div>
  );
}
