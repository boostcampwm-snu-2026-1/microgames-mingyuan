"use client";

import Image from "next/image";
import type { Microgame } from "@/data/microgames";
import { useAnimalFarmBossGame } from "@/games/useAnimalFarmBossGame";

export function AnimalFarmBossGame({
  microgame,
}: Readonly<{ microgame: Microgame }>) {
  void microgame;

  const {
    currentStage,
    currentStageIndex,
    inputHandlers,
    inputRef,
    stageCount,
  } = useAnimalFarmBossGame();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-sky-400 text-white">
      <Image
        alt=""
        fill
        className="absolute inset-0 size-full object-cover object-center"
        priority
        src="/games/animal-farm/images/background.png"
        unoptimized
      />
      <div className="absolute left-[57vw] top-[8vh] grid h-[31vh] w-[39vw] min-w-[20rem] place-items-center px-[4vw] text-center text-slate-950">
        <div>
          <p className="text-[clamp(0.7rem,1.2vw,1.15rem)] font-black uppercase tracking-[0.18em] text-sky-900/60">
            이걸 거꾸로 쳐봐라~
          </p>
          <p className="mt-2 break-keep text-[clamp(2.1rem,5vw,5.4rem)] font-black leading-tight text-sky-950">
            {currentStage.target}
          </p>
        </div>
      </div>
      <section className="absolute bottom-[6vh] left-1/2 w-[min(86vw,56rem)] -translate-x-1/2 rounded-lg border-4 border-white/75 bg-sky-950/70 p-5 shadow-[0_0_30px_rgba(14,165,233,0.32)] backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-sky-100/75">
            먹구름의 마법 단어를 거꾸로 치세요! (예시: "사과" → "과사")
          </p>
          <p className="text-base font-black text-yellow-100">
            {currentStageIndex + 1}/{stageCount}
          </p>
        </div>
        <input
          ref={inputRef}
          aria-label="거꾸로 입력"
          autoCapitalize="off"
          autoComplete="off"
          autoFocus
          className="h-20 w-full rounded-md border-2 border-yellow-100 bg-white/95 px-5 text-center text-[clamp(2rem,5vw,4.25rem)] font-black text-sky-950 outline-none placeholder:text-sky-950/25 focus:border-yellow-300"
          inputMode="text"
          lang="ko"
          placeholder="입력"
          spellCheck={false}
          type="text"
          {...inputHandlers}
        />
        <div className="mt-4 flex gap-2">
          {Array.from({ length: stageCount }, (_, index) => (
            <span
              aria-hidden="true"
              className={`h-3 flex-1 rounded-full ${
                index <= currentStageIndex ? "bg-yellow-200" : "bg-white/25"
              }`}
              key={index}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
