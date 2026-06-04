"use client";

import { useEffect, useRef, type RefObject } from "react";
import { MICROGAME_CLEAR_EVENT } from "@/hooks/useMicrogameInput";
import { bgmLibrary } from "@/lib/bgmLibrary";
import { drawCenteredText } from "@/lib/canvasUtils";

const DEFAULT_BEAT_DURATION_MS = 500;
const MIN_CANVAS_HEIGHT = 360;
const MIN_CANVAS_WIDTH = 640;
const MAX_DELTA_SECONDS = 1 / 30;
const HEART_SIZE = 26;
const HEART_TRAVEL_PER_BEAT = 158;
const SANS_WIDTH = 116;
const SANS_HEIGHT = 138;
const BONE_BASE_HEIGHT = 34;
const BONE_TRAVEL_PER_BEAT = 270;
const ARROW_KEYS = new Set(["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp"]);

const BONE_PATTERN = [
  { beat: 0.65, scale: 1, y: 0.16 },
  { beat: 0.95, scale: 0.86, y: 0.48 },
  { beat: 1.18, scale: 1, y: 0.74 },
  { beat: 1.62, scale: 0.9, y: 0.31 },
  { beat: 1.9, scale: 1.05, y: 0.62 },
  { beat: 2.18, scale: 0.82, y: 0.08 },
  { beat: 2.62, scale: 1, y: 0.42 },
  { beat: 2.86, scale: 0.9, y: 0.78 },
  { beat: 3.18, scale: 1, y: 0.22 },
  { beat: 3.58, scale: 0.92, y: 0.56 },
  { beat: 4.22, scale: 0.86, y: 0.7 },
  { beat: 4.52, scale: 1, y: 0.35 },
  { beat: 5.18, scale: 1.06, y: 0.58 },
  { beat: 5.44, scale: 0.88, y: 0.82 },
  { beat: 5.78, scale: 1, y: 0.25 },
  { beat: 6.08, scale: 0.94, y: 0.66 },
  { beat: 6.7, scale: 0.9, y: 0.06 },
  { beat: 7, scale: 1, y: 0.76 },
  { beat: 7.28, scale: 0.92, y: 0.32 },
] as const;

const UNDERTALE_ASSETS = {
  bone: "/games/undertale/images/bone.png",
  cursor: "/games/undertale/images/player-cursor.png",
  gameOver: "/games/undertale/images/game-over.png",
  sans: "/games/undertale/images/sans.png",
} as const;

type Bone = {
  heightScale: number;
  x: number;
  yRatio: number;
};

type GameState = {
  bones: Bone[];
  cursorX: number;
  cursorY: number;
  elapsedMs: number;
  hasCleared: boolean;
  hasDied: boolean;
  lastTimestamp: number | null;
};

type LoadedImages = Record<keyof typeof UNDERTALE_ASSETS, HTMLImageElement>;

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

function getBoneSpeed(beatDurationMs: number) {
  return BONE_TRAVEL_PER_BEAT / (beatDurationMs / 1000);
}

function getHeartSpeed(beatDurationMs: number) {
  return HEART_TRAVEL_PER_BEAT / (beatDurationMs / 1000);
}

function getBattleBox(width: number, height: number) {
  const boxWidth = Math.min(width * 0.72, 760);
  const boxHeight = Math.min(height * 0.4, 320);

  return {
    height: boxHeight,
    width: boxWidth,
    x: (width - boxWidth) / 2,
    y: height * 0.43,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function intersects(first: DOMRectReadOnly, second: DOMRectReadOnly) {
  return (
    first.left < second.right &&
    first.right > second.left &&
    first.top < second.bottom &&
    first.bottom > second.top
  );
}

function preloadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to preload ${src}`));
    image.src = src;
  });
}

async function preloadUndertaleImages() {
  const [bone, cursor, gameOver, sans] = await Promise.all([
    preloadImage(UNDERTALE_ASSETS.bone),
    preloadImage(UNDERTALE_ASSETS.cursor),
    preloadImage(UNDERTALE_ASSETS.gameOver),
    preloadImage(UNDERTALE_ASSETS.sans),
  ]);

  return { bone, cursor, gameOver, sans } satisfies LoadedImages;
}

function createInitialState(width: number, height: number) {
  const box = getBattleBox(width, height);
  const travel = BONE_TRAVEL_PER_BEAT;

  return {
    bones: BONE_PATTERN.map((bone) => ({
      heightScale: bone.scale,
      x: box.x + box.width + travel * bone.beat,
      yRatio: bone.y,
    })),
    cursorX: width / 2,
    cursorY: box.y + box.height / 2,
    elapsedMs: 0,
    hasCleared: false,
    hasDied: false,
    lastTimestamp: null,
  } satisfies GameState;
}

function getBoneSize(image: HTMLImageElement, bone: Bone) {
  const height = BONE_BASE_HEIGHT * bone.heightScale;
  const aspectRatio =
    image.naturalHeight > 0 ? image.naturalWidth / image.naturalHeight : 1;

  return {
    height,
    width: height * aspectRatio,
  };
}

function playGameOver(audioRef: RefObject<HTMLAudioElement | null>) {
  const audio = audioRef.current;

  bgmLibrary.stop();

  if (!audio) {
    return;
  }

  audio.currentTime = 0;
  audio.play().catch(() => {
    // Audio can be blocked before the browser receives a trusted input.
  });
}

function dispatchClear() {
  window.dispatchEvent(new CustomEvent(MICROGAME_CLEAR_EVENT));
}

function drawUndertaleUi(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  box: ReturnType<typeof getBattleBox>,
) {
  context.fillStyle = "#000000";
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "#ffffff";
  context.lineWidth = 5;
  context.strokeRect(box.x, box.y, box.width, box.height);

  context.fillStyle = "#ffffff";
  context.font = "700 22px Arial, Helvetica, sans-serif";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText("CHARA", box.x, box.y + box.height + 38);
  context.fillText("LV 19", box.x + 125, box.y + box.height + 38);
  context.fillStyle = "#ffff00";
  context.fillRect(box.x + 220, box.y + box.height + 27, 116, 22);
  context.fillStyle = "#ff0000";
  context.fillRect(box.x + 284, box.y + box.height + 27, 52, 22);
  context.fillStyle = "#ffffff";
  context.fillText("KR 64 / 92", box.x + 355, box.y + box.height + 38);
}

export function useUndertaleMouseGameCanvas(
  gameBeatCount: number,
  gameOverAudioRef: RefObject<HTMLAudioElement | null>,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<LoadedImages | null>(null);
  const stateRef = useRef<GameState>(
    createInitialState(MIN_CANVAS_WIDTH, MIN_CANVAS_HEIGHT),
  );

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
    let boneSpeed = getBoneSpeed(beatDurationMs);
    let heartSpeed = getHeartSpeed(beatDurationMs);
    let canvasHeight = MIN_CANVAS_HEIGHT;
    let canvasWidth = MIN_CANVAS_WIDTH;
    let isDisposed = false;
    const pixelRatio = window.devicePixelRatio || 1;
    const pressedKeys = new Set<string>();

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      canvasWidth = Math.max(bounds.width, MIN_CANVAS_WIDTH);
      canvasHeight = Math.max(bounds.height, MIN_CANVAS_HEIGHT);
      canvas.width = Math.floor(canvasWidth * pixelRatio);
      canvas.height = Math.floor(canvasHeight * pixelRatio);
      beatDurationMs = getBeatDurationMs(canvas);
      boneSpeed = getBoneSpeed(beatDurationMs);
      heartSpeed = getHeartSpeed(beatDurationMs);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      stateRef.current = createInitialState(canvasWidth, canvasHeight);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!ARROW_KEYS.has(event.key)) {
        return;
      }

      event.preventDefault();
      pressedKeys.add(event.key);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeys.delete(event.key);
    };

    const moveCursor = (
      state: GameState,
      box: ReturnType<typeof getBattleBox>,
      deltaSeconds: number,
    ) => {
      const horizontal =
        (pressedKeys.has("ArrowRight") ? 1 : 0) -
        (pressedKeys.has("ArrowLeft") ? 1 : 0);
      const vertical =
        (pressedKeys.has("ArrowDown") ? 1 : 0) -
        (pressedKeys.has("ArrowUp") ? 1 : 0);

      if (horizontal === 0 && vertical === 0) {
        return;
      }

      const diagonalScale =
        horizontal !== 0 && vertical !== 0 ? Math.SQRT1_2 : 1;

      state.cursorX = clamp(
        state.cursorX + horizontal * heartSpeed * diagonalScale * deltaSeconds,
        box.x + HEART_SIZE / 2,
        box.x + box.width - HEART_SIZE / 2,
      );
      state.cursorY = clamp(
        state.cursorY + vertical * heartSpeed * diagonalScale * deltaSeconds,
        box.y + HEART_SIZE / 2,
        box.y + box.height - HEART_SIZE / 2,
      );
    };

    const render = (timestamp: number) => {
      const images = imagesRef.current;
      const state = stateRef.current;
      const box = getBattleBox(canvasWidth, canvasHeight);
      const deltaSeconds =
        state.lastTimestamp === null
          ? 0
          : Math.min(
              (timestamp - state.lastTimestamp) / 1000,
              MAX_DELTA_SECONDS,
            );

      state.lastTimestamp = timestamp;
      state.elapsedMs += deltaSeconds * 1000;
      drawUndertaleUi(context, canvasWidth, canvasHeight, box);

      if (!images) {
        drawCenteredText(
          context,
          "LOADING",
          canvasWidth / 2,
          canvasHeight / 2,
          32,
        );
        animationFrame = window.requestAnimationFrame(render);
        return;
      }

      context.drawImage(
        images.sans,
        canvasWidth / 2 - SANS_WIDTH / 2,
        Math.max(18, box.y - SANS_HEIGHT - 28),
        SANS_WIDTH,
        SANS_HEIGHT,
      );

      if (!state.hasDied && !state.hasCleared) {
        moveCursor(state, box, deltaSeconds);

        const heartBox = new DOMRect(
          state.cursorX - HEART_SIZE * 0.24,
          state.cursorY - HEART_SIZE * 0.24,
          HEART_SIZE * 0.48,
          HEART_SIZE * 0.48,
        );

        state.bones = state.bones.map((bone) => ({
          ...bone,
          x: bone.x - boneSpeed * deltaSeconds,
        }));

        state.bones.forEach((bone) => {
          const boneSize = getBoneSize(images.bone, bone);
          const boneBox = new DOMRect(
            bone.x + boneSize.width * 0.22,
            box.y + box.height * bone.yRatio + boneSize.height * 0.22,
            boneSize.width * 0.56,
            boneSize.height * 0.56,
          );

          if (intersects(heartBox, boneBox)) {
            state.hasDied = true;
            playGameOver(gameOverAudioRef);
          }
        });

        if (
          !state.hasDied &&
          !state.hasCleared &&
          state.elapsedMs >= gameBeatCount * beatDurationMs
        ) {
          state.hasCleared = true;
          dispatchClear();
        }
      }

      state.bones.forEach((bone) => {
        const boneSize = getBoneSize(images.bone, bone);
        context.drawImage(
          images.bone,
          bone.x,
          box.y + box.height * bone.yRatio,
          boneSize.width,
          boneSize.height,
        );
      });

      if (state.hasDied) {
        context.drawImage(images.gameOver, 0, 0, canvasWidth, canvasHeight);
      } else {
        context.drawImage(
          images.cursor,
          state.cursorX - HEART_SIZE / 2,
          state.cursorY - HEART_SIZE / 2,
          HEART_SIZE,
          HEART_SIZE,
        );
      }

      animationFrame = window.requestAnimationFrame(render);
    };

    resizeCanvas();
    preloadUndertaleImages()
      .then((images) => {
        if (!isDisposed) {
          imagesRef.current = images;
        }
      })
      .catch((error: unknown) => {
        console.error(error);
      });
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("keyup", handleKeyUp, { capture: true });
    window.addEventListener("resize", resizeCanvas);
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("keyup", handleKeyUp, { capture: true });
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [gameBeatCount, gameOverAudioRef]);

  return canvasRef;
}
