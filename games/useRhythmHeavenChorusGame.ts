"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent, RefObject } from "react";
import {
  MICROGAME_CLEAR_EVENT,
  MICROGAME_FAILURE_EVENT,
} from "@/hooks/useMicrogameInput";

export type ChorusSinger = "first" | "player" | "second";

const DEFAULT_BEAT_DURATION_MS = 500;
const FIRST_STOP_BEAT = 4;
const SECOND_STOP_BEAT = 5;
const SINGING_SOUND_SRC =
  "/games/rhythm-heaven/sounds/chorus-man-sing-basic.wav";
const STOP_SOUND_SRC =
  "/games/rhythm-heaven/sounds/chorus-man-sing-stopped.wav";
const INITIAL_SINGERS = ["first", "second", "player"] as const;
const SINGING_LOOP_START_SECONDS = 0.2;
const SINGING_LOOP_END_SECONDS = 0.52;
const SINGING_FADE_SECONDS = 0.025;
const SINGER_PLAYBACK_RATES = {
  first: 1,
  second: Math.pow(2, 4 / 12),
  player: Math.pow(2, 7 / 12),
} satisfies Record<ChorusSinger, number>;

type SingingVoice = Readonly<{
  gain: GainNode;
  source: AudioBufferSourceNode;
}>;

function dispatchClear() {
  window.dispatchEvent(new CustomEvent(MICROGAME_CLEAR_EVENT));
}

function dispatchFailure() {
  window.dispatchEvent(new CustomEvent(MICROGAME_FAILURE_EVENT));
}

function getBeatDurationMs(element: HTMLElement | null) {
  if (!element) {
    return DEFAULT_BEAT_DURATION_MS;
  }

  const rawDuration = window
    .getComputedStyle(element)
    .getPropertyValue("--game-rhythm-duration")
    .trim();
  const parsedDuration = Number.parseFloat(rawDuration);

  return Number.isFinite(parsedDuration) && parsedDuration > 0
    ? parsedDuration
    : DEFAULT_BEAT_DURATION_MS;
}

function stopHtmlAudio(audio: HTMLAudioElement | null) {
  if (!audio) {
    return;
  }

  audio.pause();
  audio.currentTime = 0;
}

function reportAudioPlaybackError(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return;
  }

  console.error(error);
}

function startSingingVoice(
  audioContext: AudioContext | null,
  buffer: AudioBuffer | null,
  singer: ChorusSinger,
  startWithAttack: boolean,
) {
  if (!audioContext || !buffer) {
    return null;
  }

  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  const startAt = audioContext.currentTime;

  source.buffer = buffer;
  source.loop = true;
  source.loopStart = SINGING_LOOP_START_SECONDS;
  source.loopEnd = Math.min(SINGING_LOOP_END_SECONDS, buffer.duration);
  source.playbackRate.value = SINGER_PLAYBACK_RATES[singer];
  source.connect(gain);
  gain.connect(audioContext.destination);
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(0.34, startAt + SINGING_FADE_SECONDS);
  source.start(startAt, startWithAttack ? 0 : source.loopStart);

  return { gain, source } satisfies SingingVoice;
}

function stopSingingVoice(
  audioContext: AudioContext | null,
  voice: SingingVoice | null,
) {
  if (!audioContext || !voice) {
    return;
  }

  const stopAt = audioContext.currentTime + SINGING_FADE_SECONDS;

  voice.gain.gain.cancelScheduledValues(audioContext.currentTime);
  voice.gain.gain.setValueAtTime(
    voice.gain.gain.value,
    audioContext.currentTime,
  );
  voice.gain.gain.linearRampToValueAtTime(0, stopAt);

  try {
    voice.source.stop(stopAt);
  } catch {
    // The source may already have been stopped by a phase transition.
  }
}

function playStopSound(audio: HTMLAudioElement | null) {
  if (!audio) {
    return;
  }

  audio.currentTime = 0;
  audio.play().catch(reportAudioPlaybackError);
}

export function useRhythmHeavenChorusGame(gameBeatCount: number): Readonly<{
  containerRef: RefObject<HTMLDivElement | null>;
  handlePointerCancel: () => void;
  handlePointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  handlePointerUp: () => void;
  singingSingers: readonly ChorusSinger[];
}> {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameStartedAtRef = useRef<number | null>(null);
  const hasResolvedRef = useRef(false);
  const isPlayerHoldingRef = useRef(false);
  const singingAudioBufferRef = useRef<AudioBuffer | null>(null);
  const singingAudioContextRef = useRef<AudioContext | null>(null);
  const singingVoiceRefs = useRef<Record<ChorusSinger, SingingVoice | null>>({
    first: null,
    player: null,
    second: null,
  });
  const singingSingersRef = useRef<readonly ChorusSinger[]>(INITIAL_SINGERS);
  const stopAudioRef = useRef<HTMLAudioElement | null>(null);
  const [singingSingers, setSingingSingers] =
    useState<readonly ChorusSinger[]>(INITIAL_SINGERS);

  const stopSinger = useCallback((singer: ChorusSinger) => {
    if (!singingSingersRef.current.includes(singer)) {
      return;
    }

    singingSingersRef.current = singingSingersRef.current.filter(
      (currentSinger) => currentSinger !== singer,
    );
    setSingingSingers((currentSingers) =>
      currentSingers.filter((currentSinger) => currentSinger !== singer),
    );
    stopSingingVoice(
      singingAudioContextRef.current,
      singingVoiceRefs.current[singer],
    );
    singingVoiceRefs.current[singer] = null;
    playStopSound(stopAudioRef.current);
  }, []);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (hasResolvedRef.current || gameStartedAtRef.current === null) {
        return;
      }

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);

      const beatDurationMs = getBeatDurationMs(containerRef.current);
      const elapsedMs = performance.now() - gameStartedAtRef.current;
      const secondSingerStopMs = SECOND_STOP_BEAT * beatDurationMs;

      isPlayerHoldingRef.current = true;
      stopSinger("player");

      if (elapsedMs < secondSingerStopMs) {
        hasResolvedRef.current = true;
        dispatchFailure();
      }
    },
    [stopSinger],
  );

  const stopHolding = useCallback(() => {
    if (hasResolvedRef.current || !isPlayerHoldingRef.current) {
      return;
    }

    isPlayerHoldingRef.current = false;
    singingSingersRef.current = singingSingersRef.current.includes("player")
      ? singingSingersRef.current
      : [...singingSingersRef.current, "player"];
    setSingingSingers((currentSingers) =>
      currentSingers.includes("player")
        ? currentSingers
        : [...currentSingers, "player"],
    );
    singingVoiceRefs.current.player = startSingingVoice(
      singingAudioContextRef.current,
      singingAudioBufferRef.current,
      "player",
      false,
    );
  }, []);

  useEffect(() => {
    const audioContext = new AudioContext();
    const singingVoiceRegistry = singingVoiceRefs.current;
    const stoppedAudio = new Audio(STOP_SOUND_SRC);
    const beatDurationMs = getBeatDurationMs(containerRef.current);
    let isDisposed = false;

    stoppedAudio.volume = 0.95;
    singingAudioContextRef.current = audioContext;
    stopAudioRef.current = stoppedAudio;
    gameStartedAtRef.current = performance.now();
    hasResolvedRef.current = false;
    isPlayerHoldingRef.current = false;
    singingSingersRef.current = INITIAL_SINGERS;

    fetch(SINGING_SOUND_SRC)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load Rhythm Heaven singing audio.");
        }

        return response.arrayBuffer();
      })
      .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
      .then((buffer) => {
        if (isDisposed) {
          return;
        }

        singingAudioBufferRef.current = buffer;
        return audioContext.resume().then(() => {
          INITIAL_SINGERS.forEach((singer) => {
            if (!singingSingersRef.current.includes(singer)) {
              return;
            }

            singingVoiceRegistry[singer] = startSingingVoice(
              audioContext,
              buffer,
              singer,
              true,
            );
          });
        });
      })
      .catch(reportAudioPlaybackError);

    const firstStopTimer = window.setTimeout(() => {
      stopSinger("first");
    }, FIRST_STOP_BEAT * beatDurationMs);
    const secondStopTimer = window.setTimeout(() => {
      stopSinger("second");
    }, SECOND_STOP_BEAT * beatDurationMs);
    const timeoutTimer = window.setTimeout(() => {
      if (hasResolvedRef.current) {
        return;
      }

      hasResolvedRef.current = true;
      INITIAL_SINGERS.forEach((singer) => {
        stopSingingVoice(audioContext, singingVoiceRegistry[singer]);
        singingVoiceRegistry[singer] = null;
      });

      if (isPlayerHoldingRef.current) {
        dispatchClear();
        return;
      }

      dispatchFailure();
    }, gameBeatCount * beatDurationMs);

    return () => {
      isDisposed = true;
      window.clearTimeout(firstStopTimer);
      window.clearTimeout(secondStopTimer);
      window.clearTimeout(timeoutTimer);
      INITIAL_SINGERS.forEach((singer) => {
        stopSingingVoice(audioContext, singingVoiceRegistry[singer]);
        singingVoiceRegistry[singer] = null;
      });
      stopHtmlAudio(stoppedAudio);
      singingAudioBufferRef.current = null;
      singingAudioContextRef.current = null;
      stopAudioRef.current = null;
      gameStartedAtRef.current = null;
      audioContext.close().catch(reportAudioPlaybackError);
    };
  }, [gameBeatCount, stopSinger]);

  return {
    containerRef,
    handlePointerCancel: stopHolding,
    handlePointerDown,
    handlePointerUp: stopHolding,
    singingSingers,
  };
}
