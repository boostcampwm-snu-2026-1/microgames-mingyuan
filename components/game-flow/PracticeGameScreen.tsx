"use client";

import type { Microgame } from "@/data/microgames";
import { usePracticeMicrogame } from "@/hooks/usePracticeMicrogame";
import { useSynchronizedRhythm } from "@/hooks/useSynchronizedRhythm";
import { NeonButton, NeonShell } from "./NeonShell";
import { MicrogameRoundScreen } from "./roundScreens";

export function PracticeGameScreen({
  microgame,
}: Readonly<{
  microgame: Microgame;
}>) {
  const { rhythmStyle } = useSynchronizedRhythm();
  const { beatsLeft, phase, result, returnToMicroscope } =
    usePracticeMicrogame(microgame);

  if (phase === "playing") {
    return (
      <NeonShell
        rhythmStyle={rhythmStyle}
        shouldDim={false}
        showBackdrop={false}
      >
        <MicrogameRoundScreen
          beatsLeft={beatsLeft}
          microgame={microgame}
          roundNumber={1}
        />
        {beatsLeft === microgame.beatCount ? (
          <div className="microgame-start-prompt pointer-events-none fixed inset-0 z-30 grid place-items-center">
            <p>{microgame.startPrompt}</p>
          </div>
        ) : null}
      </NeonShell>
    );
  }

  return (
    <NeonShell
      rhythmStyle={rhythmStyle}
      roundResult={result ?? "idle"}
      transition="toElevator"
    >
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-7 rounded-lg border border-cyan-100/55 bg-black/65 p-8 text-center shadow-[0_0_32px_rgba(103,232,249,0.2)]">
        <p className="text-sm font-black uppercase tracking-[0.26em] text-cyan-100">
          Practice Complete
        </p>
        <h1 className="text-5xl font-black text-white sm:text-7xl">
          {result === "success" ? "연습 성공!" : "연습 실패"}
        </h1>
        <p className="text-base font-bold text-cyan-50/75">
          잠시 후 게임 도감으로 돌아갑니다.
        </p>
        <NeonButton onClick={returnToMicroscope} variant="secondary">
          도감으로 돌아가기
        </NeonButton>
      </div>
    </NeonShell>
  );
}
