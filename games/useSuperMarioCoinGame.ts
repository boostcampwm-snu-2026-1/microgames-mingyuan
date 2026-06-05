"use client";

import { useEffect, useRef } from "react";
import { MICROGAME_CLEAR_EVENT } from "@/hooks/useMicrogameInput";
import { drawCenteredText } from "@/lib/canvasUtils";

const DEFAULT_BEAT_DURATION_MS = 500;
const MIN_CANVAS_HEIGHT = 360;
const MIN_CANVAS_WIDTH = 640;
const MAX_DELTA_SECONDS = 1 / 30;
const MARIO_WIDTH = 54;
const MARIO_HEIGHT = 76;
const JUMP_HEIGHT = 92;
const QUESTION_BLOCK_SIZE = 58;
const TARGET_MIN = 3;
const TARGET_MAX = 7;
const SUCCESS_WINDOW_MS = 120;

type GameState = {
  collectedCoins: number;
  elapsedMs: number;
  hasCleared: boolean;
  jumpAgeMs: number;
  lastTimestamp: number | null;
  targetCoins: number;
};

function getBeatDurationMs(canvas: HTMLCanvasElement) {
  const rawDuration = window
    .getComputedStyle(canvas)
    .getPropertyValue("--game-rhythm-duration")
    .trim();
  const parsedDuration = Number.parseFloat(rawDuration);

  return Number.isFinite(parsedDuration) && parsedDuration > 0
    ? parsedDuration
    : DEFAULT_BEAT_DURATION_MS;
}

function createInitialState() {
  return {
    collectedCoins: 0,
    elapsedMs: 0,
    hasCleared: false,
    jumpAgeMs: Number.POSITIVE_INFINITY,
    lastTimestamp: null,
    targetCoins:
      TARGET_MIN + Math.floor(Math.random() * (TARGET_MAX - TARGET_MIN + 1)),
  } satisfies GameState;
}

function dispatchClear() {
  window.dispatchEvent(new CustomEvent(MICROGAME_CLEAR_EVENT));
}

function playTone(
  frequency: number,
  durationSeconds: number,
  type: OscillatorType,
  volume = 0.12,
) {
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const startAt = audioContext.currentTime;
  const stopAt = startAt + durationSeconds;

  oscillator.frequency.setValueAtTime(frequency, startAt);
  oscillator.type = type;
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  gainNode.gain.setValueAtTime(0, startAt);
  gainNode.gain.linearRampToValueAtTime(volume, startAt + 0.012);
  gainNode.gain.exponentialRampToValueAtTime(0.001, stopAt);
  oscillator.start(startAt);
  oscillator.stop(stopAt);
}

function playJumpSound() {
  playTone(330, 0.1, "square", 0.08);
  window.setTimeout(() => playTone(494, 0.08, "square", 0.06), 36);
}

function playCoinSound() {
  playTone(988, 0.08, "triangle", 0.11);
  window.setTimeout(() => playTone(1319, 0.08, "triangle", 0.1), 58);
}

function playReadySound() {
  playTone(1568, 0.12, "triangle", 0.12);
}

function drawBrickGround(
  context: CanvasRenderingContext2D,
  width: number,
  groundY: number,
) {
  context.fillStyle = "#a9471d";
  context.fillRect(0, groundY, width, 120);
  context.strokeStyle = "#5f240f";
  context.lineWidth = 2;

  for (let x = 0; x < width; x += 42) {
    context.strokeRect(x, groundY, 42, 30);
    context.strokeRect(x - 21, groundY + 30, 42, 30);
    context.strokeRect(x, groundY + 60, 42, 30);
  }
}

function drawCoin(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  isCollected: boolean,
) {
  context.globalAlpha = isCollected ? 0.35 : 1;
  context.fillStyle = "#facc15";
  context.beginPath();
  context.ellipse(x, y, 15, 20, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#fef08a";
  context.lineWidth = 4;
  context.stroke();
  context.globalAlpha = 1;
}

function drawQuestionBlock(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  lift: number,
) {
  const blockY = y - lift;

  context.fillStyle = "#f59e0b";
  context.fillRect(x, blockY, QUESTION_BLOCK_SIZE, QUESTION_BLOCK_SIZE);
  context.strokeStyle = "#92400e";
  context.lineWidth = 4;
  context.strokeRect(x, blockY, QUESTION_BLOCK_SIZE, QUESTION_BLOCK_SIZE);
  context.fillStyle = "#fde68a";
  context.fillRect(x + 8, blockY + 8, 10, 10);
  context.fillRect(x + 40, blockY + 8, 10, 10);
  drawCenteredText(
    context,
    "?",
    x + QUESTION_BLOCK_SIZE / 2,
    blockY + QUESTION_BLOCK_SIZE / 2 + 1,
    34,
    "#7c2d12",
  );
}

function drawMario(context: CanvasRenderingContext2D, x: number, y: number) {
  context.fillStyle = "#dc2626";
  context.fillRect(x + 8, y, 38, 20);
  context.fillStyle = "#f8b47a";
  context.fillRect(x + 12, y + 18, 34, 22);
  context.fillStyle = "#2563eb";
  context.fillRect(x + 8, y + 38, 38, 28);
  context.fillStyle = "#7f1d1d";
  context.fillRect(x, y + 66, 22, 10);
  context.fillRect(x + 32, y + 66, 22, 10);
}

function drawScene(
  context: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
  remainingMs: number,
) {
  const groundY = height * 0.72;
  const marioX = width / 2 - MARIO_WIDTH / 2;
  const blockX = width / 2 - QUESTION_BLOCK_SIZE / 2;
  const blockY =
    groundY - MARIO_HEIGHT - JUMP_HEIGHT - QUESTION_BLOCK_SIZE + 16;
  const jumpProgress = Math.min(state.jumpAgeMs / 360, 1);
  const jumpOffset =
    jumpProgress < 1 ? Math.sin(jumpProgress * Math.PI) * JUMP_HEIGHT : 0;
  const marioY = groundY - MARIO_HEIGHT - jumpOffset;
  const progress = Math.min(Math.max(1 - state.jumpAgeMs / 440, 0), 1);
  const activeCoinY = blockY - 18 - progress * 46;
  const blockLift =
    state.jumpAgeMs < 180
      ? Math.sin((state.jumpAgeMs / 180) * Math.PI) * 10
      : 0;

  context.fillStyle = "#60a5fa";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(width * 0.18, height * 0.18, 34, 0, Math.PI * 2);
  context.arc(width * 0.22, height * 0.17, 42, 0, Math.PI * 2);
  context.arc(width * 0.27, height * 0.19, 32, 0, Math.PI * 2);
  context.fill();

  drawBrickGround(context, width, groundY);
  drawQuestionBlock(context, blockX, blockY, blockLift);
  drawMario(context, marioX, marioY);

  Array.from({ length: state.targetCoins }, (_, index) => {
    const startX = width * 0.55 - (state.targetCoins - 1) * 21;
    drawCoin(
      context,
      startX + index * 42,
      height * 0.27,
      index < state.collectedCoins,
    );
  });

  if (state.jumpAgeMs < 440) {
    drawCoin(context, width / 2, activeCoinY, false);
  }

  context.fillStyle = "#111827";
  context.fillRect(width / 2 - 214, 20, 428, 118);
  context.strokeStyle = "#ffffff";
  context.lineWidth = 5;
  context.strokeRect(width / 2 - 214, 20, 428, 118);
  drawCenteredText(
    context,
    `TARGET ${state.targetCoins} COINS`,
    width / 2,
    56,
    32,
    "#facc15",
  );
  drawCenteredText(
    context,
    `${state.collectedCoins} / ${state.targetCoins}`,
    width / 2,
    104,
    42,
    state.collectedCoins === state.targetCoins ? "#86efac" : "#ffffff",
  );

  if (state.collectedCoins > state.targetCoins) {
    drawCenteredText(
      context,
      "TOO MANY!",
      width / 2,
      height * 0.5,
      44,
      "#ef4444",
    );
  } else if (
    state.collectedCoins === state.targetCoins &&
    remainingMs > SUCCESS_WINDOW_MS
  ) {
    drawCenteredText(context, "STOP!", width / 2, height * 0.5, 44, "#22c55e");
  }
}

export function useSuperMarioCoinGameCanvas(gameBeatCount: number) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(createInitialState());

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
    let beatDurationMs = getBeatDurationMs(canvas);
    let canvasHeight = MIN_CANVAS_HEIGHT;
    let canvasWidth = MIN_CANVAS_WIDTH;
    const pixelRatio = window.devicePixelRatio || 1;

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();

      canvasWidth = Math.max(bounds.width, MIN_CANVAS_WIDTH);
      canvasHeight = Math.max(bounds.height, MIN_CANVAS_HEIGHT);
      canvas.width = Math.floor(canvasWidth * pixelRatio);
      canvas.height = Math.floor(canvasHeight * pixelRatio);
      beatDurationMs = getBeatDurationMs(canvas);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const handleSpace = (event: KeyboardEvent) => {
      const state = stateRef.current;

      if (event.code !== "Space" || state.hasCleared) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      state.collectedCoins += 1;
      state.jumpAgeMs = 0;
      playJumpSound();
      playCoinSound();
    };

    const render = (timestamp: number) => {
      const state = stateRef.current;
      const deltaSeconds =
        state.lastTimestamp === null
          ? 0
          : Math.min(
              (timestamp - state.lastTimestamp) / 1000,
              MAX_DELTA_SECONDS,
            );
      const phaseDurationMs = gameBeatCount * beatDurationMs;

      state.lastTimestamp = timestamp;
      state.elapsedMs += deltaSeconds * 1000;
      state.jumpAgeMs += deltaSeconds * 1000;

      const remainingMs = Math.max(phaseDurationMs - state.elapsedMs, 0);

      drawScene(context, state, canvasWidth, canvasHeight, remainingMs);

      if (
        !state.hasCleared &&
        state.lastTimestamp !== null &&
        remainingMs <= SUCCESS_WINDOW_MS &&
        state.collectedCoins === state.targetCoins
      ) {
        state.hasCleared = true;
        playReadySound();
        dispatchClear();
      }

      animationFrame = window.requestAnimationFrame(render);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("keydown", handleSpace, { capture: true });
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("keydown", handleSpace, { capture: true });
    };
  }, [gameBeatCount]);

  return canvasRef;
}
