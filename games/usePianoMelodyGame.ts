"use client";

import { useEffect, useRef } from "react";
import { MICROGAME_CLEAR_EVENT } from "@/hooks/useMicrogameInput";
import { drawCenteredText } from "@/lib/canvasUtils";

const MIN_CANVAS_HEIGHT = 360;
const MIN_CANVAS_WIDTH = 640;
const MAX_DELTA_MS = 50;
const ACTIVE_KEY_DURATION_MS = 180;
const FEEDBACK_DURATION_MS = 360;
const BACKGROUND_IMAGE_SRC = "/games/piano/images/background.png";
const NOTE_VOLUME = 0.68;

type Note = Readonly<{
  key: string;
  label: string;
  soundSrc: string;
}>;

type Melody = readonly number[];

type GameState = {
  activeKeyIndex: number | null;
  activeKeyMs: number;
  feedback: "idle" | "reset" | "success";
  feedbackMs: number;
  hasCleared: boolean;
  lastTimestamp: number | null;
  melody: Melody;
  progress: number;
};

const NOTES = [
  { key: "1", label: "도", soundSrc: "/games/piano/sounds/C4.mp3" },
  { key: "2", label: "레", soundSrc: "/games/piano/sounds/D4.mp3" },
  { key: "3", label: "미", soundSrc: "/games/piano/sounds/E4.mp3" },
  { key: "4", label: "파", soundSrc: "/games/piano/sounds/F4.mp3" },
  { key: "5", label: "솔", soundSrc: "/games/piano/sounds/G4.mp3" },
  { key: "6", label: "라", soundSrc: "/games/piano/sounds/A4.mp3" },
  { key: "7", label: "시", soundSrc: "/games/piano/sounds/B4.mp3" },
  { key: "8", label: "도", soundSrc: "/games/piano/sounds/C5.mp3" },
  { key: "9", label: "레", soundSrc: "/games/piano/sounds/D5.mp3" },
] satisfies Note[];

const MELODY_POOL = [
  [3, 2, 1, 2, 3, 3, 3],
  [5, 5, 6, 6, 5, 5, 3],
  [1, 1, 5, 5, 6, 6, 5],
  [3, 4, 5, 3, 4, 5, 5],
  [5, 6, 5, 4, 3, 2, 1],
  [1, 2, 3, 5, 3, 2, 1],
] as const satisfies readonly Melody[];

function dispatchClear() {
  window.dispatchEvent(new CustomEvent(MICROGAME_CLEAR_EVENT));
}

function getRandomMelody() {
  return MELODY_POOL[Math.floor(Math.random() * MELODY_POOL.length)];
}

function createInitialState() {
  return {
    activeKeyIndex: null,
    activeKeyMs: 0,
    feedback: "idle",
    feedbackMs: 0,
    hasCleared: false,
    lastTimestamp: null,
    melody: getRandomMelody(),
    progress: 0,
  } satisfies GameState;
}

function isImageReady(
  image: HTMLImageElement | null,
): image is HTMLImageElement {
  return Boolean(image?.complete && image.naturalWidth > 0);
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const scale = Math.max(
    width / image.naturalWidth,
    height / image.naturalHeight,
  );
  const imageWidth = image.naturalWidth * scale;
  const imageHeight = image.naturalHeight * scale;

  context.drawImage(
    image,
    (width - imageWidth) / 2,
    (height - imageHeight) / 2,
    imageWidth,
    imageHeight,
  );
}

function getMelodyLabel(melody: Melody) {
  return melody.map((noteNumber) => NOTES[noteNumber - 1].label).join(" ");
}

function playNoteAudio(
  noteAudios: readonly HTMLAudioElement[],
  noteIndex: number,
) {
  const audio = noteAudios[noteIndex];

  if (!audio) {
    return;
  }

  audio.volume = NOTE_VOLUME;
  audio.currentTime = 0;
  audio.play().catch((error: unknown) => {
    console.error(error);
  });
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawScene(
  context: CanvasRenderingContext2D,
  state: GameState,
  backgroundImage: HTMLImageElement | null,
  width: number,
  height: number,
) {
  if (isImageReady(backgroundImage)) {
    drawCoverImage(context, backgroundImage, width, height);
  } else {
    const gradient = context.createLinearGradient(0, 0, width, height);

    gradient.addColorStop(0, "#111827");
    gradient.addColorStop(0.55, "#3f2a19");
    gradient.addColorStop(1, "#18181b");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  context.fillStyle = "rgba(12, 10, 9, 0.42)";
  context.fillRect(0, 0, width, height);

  const panelWidth = Math.min(width * 0.82, 780);
  const panelX = (width - panelWidth) / 2;
  const panelY = height * 0.13;

  context.fillStyle = "rgba(255, 247, 237, 0.9)";
  drawRoundedRect(context, panelX, panelY, panelWidth, 172, 18);
  context.fill();
  context.strokeStyle = "rgba(120, 53, 15, 0.32)";
  context.lineWidth = 3;
  context.stroke();

  drawCenteredText(
    context,
    getMelodyLabel(state.melody),
    width / 2,
    panelY + 62,
    Math.min(42, panelWidth / 13),
    "#431407",
  );

  context.font = "800 20px Arial, Helvetica, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  state.melody.forEach((noteNumber, index) => {
    const x = width / 2 - ((state.melody.length - 1) * 34) / 2 + index * 34;
    const isComplete = index < state.progress;
    const isCurrent = index === state.progress;

    context.fillStyle = isComplete
      ? "#16a34a"
      : isCurrent
        ? "#f97316"
        : "#9ca3af";
    context.beginPath();
    context.arc(x, panelY + 123, isCurrent ? 10 : 8, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#ffffff";
    context.fillText(String(noteNumber), x, panelY + 123);
  });

  if (state.feedback === "reset") {
    drawCenteredText(
      context,
      "처음부터!",
      width / 2,
      panelY + 205,
      34,
      "#fecaca",
    );
  }

  const keyboardWidth = Math.min(width * 0.9, 900);
  const keyGap = 8;
  const keyWidth = (keyboardWidth - keyGap * (NOTES.length - 1)) / NOTES.length;
  const keyHeight = Math.min(height * 0.32, 220);
  const keyY = height - keyHeight - height * 0.08;
  const keyX = (width - keyboardWidth) / 2;

  NOTES.forEach((note, index) => {
    const x = keyX + index * (keyWidth + keyGap);
    const isActive = state.activeKeyIndex === index;
    const isExpected = state.melody[state.progress] === index + 1;

    context.fillStyle = isActive
      ? "#fde68a"
      : isExpected
        ? "#fff7ed"
        : "#f8fafc";
    drawRoundedRect(context, x, keyY, keyWidth, keyHeight, 8);
    context.fill();
    context.strokeStyle = isActive ? "#f59e0b" : "#27272a";
    context.lineWidth = isActive ? 5 : 2;
    context.stroke();

    context.fillStyle = "#18181b";
    context.font = `900 ${Math.min(30, keyWidth * 0.32)}px Arial, Helvetica, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(note.key, x + keyWidth / 2, keyY + keyHeight * 0.22);
    context.font = `900 ${Math.min(34, keyWidth * 0.38)}px Arial, Helvetica, sans-serif`;
    context.fillText(note.label, x + keyWidth / 2, keyY + keyHeight * 0.62);
  });
}

export function usePianoMelodyGameCanvas() {
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const noteAudiosRef = useRef<HTMLAudioElement[]>([]);
  const stateRef = useRef<GameState>(createInitialState());

  useEffect(() => {
    const image = new Image();

    image.src = BACKGROUND_IMAGE_SRC;
    backgroundImageRef.current = image;
    noteAudiosRef.current = NOTES.map((note) => {
      const audio = new Audio(note.soundSrc);

      audio.preload = "auto";
      audio.volume = NOTE_VOLUME;

      return audio;
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    let animationFrame = 0;
    let canvasHeight = MIN_CANVAS_HEIGHT;
    let canvasWidth = MIN_CANVAS_WIDTH;
    const pixelRatio = window.devicePixelRatio || 1;

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();

      canvasWidth = Math.max(bounds.width, MIN_CANVAS_WIDTH);
      canvasHeight = Math.max(bounds.height, MIN_CANVAS_HEIGHT);
      canvas.width = Math.floor(canvasWidth * pixelRatio);
      canvas.height = Math.floor(canvasHeight * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const noteIndex = NOTES.findIndex((note) => note.key === event.key);

      if (noteIndex < 0 || stateRef.current.hasCleared) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      const state = stateRef.current;
      const noteNumber = noteIndex + 1;
      const expectedNoteNumber = state.melody[state.progress];

      playNoteAudio(noteAudiosRef.current, noteIndex);
      state.activeKeyIndex = noteIndex;
      state.activeKeyMs = ACTIVE_KEY_DURATION_MS;

      if (noteNumber !== expectedNoteNumber) {
        state.progress = 0;
        state.feedback = "reset";
        state.feedbackMs = FEEDBACK_DURATION_MS;
        return;
      }

      state.progress += 1;
      state.feedback = "idle";
      state.feedbackMs = 0;

      if (state.progress >= state.melody.length) {
        state.hasCleared = true;
        state.feedback = "success";
        dispatchClear();
      }
    };

    const render = (timestamp: number) => {
      const state = stateRef.current;
      const deltaMs =
        state.lastTimestamp === null
          ? 0
          : Math.min(timestamp - state.lastTimestamp, MAX_DELTA_MS);

      state.lastTimestamp = timestamp;
      state.activeKeyMs = Math.max(state.activeKeyMs - deltaMs, 0);
      state.feedbackMs = Math.max(state.feedbackMs - deltaMs, 0);

      if (state.activeKeyMs === 0) {
        state.activeKeyIndex = null;
      }

      if (state.feedbackMs === 0 && state.feedback !== "success") {
        state.feedback = "idle";
      }

      drawScene(
        context,
        state,
        backgroundImageRef.current,
        canvasWidth,
        canvasHeight,
      );
      animationFrame = window.requestAnimationFrame(render);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      noteAudiosRef.current.forEach((audio) => {
        audio.pause();
      });
      noteAudiosRef.current = [];
    };
  }, []);

  return canvasRef;
}
