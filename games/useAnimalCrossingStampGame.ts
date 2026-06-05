"use client";

import { useEffect, useRef } from "react";
import { MICROGAME_CLEAR_EVENT } from "@/hooks/useMicrogameInput";
import { drawCenteredText } from "@/lib/canvasUtils";
import { bgmLibrary } from "@/lib/bgmLibrary";

const MIN_CANVAS_HEIGHT = 360;
const MIN_CANVAS_WIDTH = 640;
const MAX_DELTA_MS = 50;
const STAMP_COUNT = 3;
const STAMP_ANIMATION_MS = 420;
const ANIMAL_CROSSING_ASSETS = {
  background: "/games/animal-crossing/images/background.png",
  stamp: "/games/animal-crossing/images/stamp.png",
} as const;

type GameState = {
  hasCleared: boolean;
  lastPointer: Point | null;
  lastTimestamp: number | null;
  stampPulseMs: number;
  stamps: number;
};

type LoadedImages = Partial<
  Record<keyof typeof ANIMAL_CROSSING_ASSETS, HTMLImageElement>
>;

type Point = {
  x: number;
  y: number;
};

function dispatchClear() {
  window.dispatchEvent(new CustomEvent(MICROGAME_CLEAR_EVENT));
}

function playStampSound() {
  bgmLibrary.playSoundEffect("animalCrossingStamp").catch((error: unknown) => {
    console.error(error);
  });
}

function createInitialState() {
  return {
    hasCleared: false,
    lastPointer: null,
    lastTimestamp: null,
    stampPulseMs: 0,
    stamps: 0,
  } satisfies GameState;
}

function getPointerPoint(canvas: HTMLCanvasElement, event: PointerEvent) {
  const bounds = canvas.getBoundingClientRect();

  return {
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
  };
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

function isImageReady(
  image: HTMLImageElement | undefined,
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

function drawStamp(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | undefined,
  x: number,
  y: number,
  radius: number,
  animationRatio: number,
) {
  const easedDrop = 1 - Math.pow(1 - animationRatio, 3);
  const impact = Math.max(0, 1 - Math.abs(animationRatio - 0.34) / 0.34);
  const settle = Math.max(0, 1 - animationRatio);
  const yOffset = -radius * 0.42 * settle;
  const scaleX = 1 + impact * 0.18;
  const scaleY = 1 - impact * 0.16;
  const opacity = Math.min(1, 0.2 + easedDrop * 1.35);

  context.save();
  context.translate(x, y);
  context.rotate(-0.12 + impact * 0.08);
  context.scale(scaleX, scaleY);
  context.globalAlpha = opacity;

  if (isImageReady(image)) {
    const size = radius * 2.38;

    context.drawImage(image, -size / 2, -size / 2 + yOffset, size, size);
  } else {
    context.fillStyle = "#ef4444";
    context.beginPath();
    context.arc(0, yOffset, radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#991b1b";
    context.lineWidth = 5;
    context.stroke();
    context.fillStyle = "#fff7ed";
    context.font = `900 ${radius * 0.72}px Arial, Helvetica, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("OK", 0, yOffset + 1);
  }

  context.restore();
}

function drawInkBurst(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  animationRatio: number,
) {
  const impact = Math.max(0, 1 - Math.abs(animationRatio - 0.34) / 0.34);

  if (impact <= 0) {
    return;
  }

  context.save();
  context.globalAlpha = impact * 0.52;
  context.strokeStyle = "#dc2626";
  context.lineWidth = Math.max(3, radius * 0.08 * impact);
  context.beginPath();
  context.arc(x, y, radius * (0.62 + impact * 0.46), 0, Math.PI * 2);
  context.stroke();

  context.fillStyle = "#b91c1c";
  Array.from({ length: 8 }, (_, index) => {
    const angle = index * ((Math.PI * 2) / 8);
    const burstRadius = radius * (0.72 + impact * 0.52);
    const dotSize = radius * 0.045 * impact;

    context.beginPath();
    context.arc(
      x + Math.cos(angle) * burstRadius,
      y + Math.sin(angle) * burstRadius,
      dotSize,
      0,
      Math.PI * 2,
    );
    context.fill();
  });
  context.restore();
}

function drawScene(
  context: CanvasRenderingContext2D,
  state: GameState,
  images: LoadedImages,
  width: number,
  height: number,
) {
  if (isImageReady(images.background)) {
    drawCoverImage(context, images.background, width, height);
  } else {
    const gradient = context.createLinearGradient(0, 0, 0, height);

    gradient.addColorStop(0, "#d9f99d");
    gradient.addColorStop(0.42, "#bbf7d0");
    gradient.addColorStop(1, "#fef3c7");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  context.fillStyle = "rgba(255, 251, 235, 0.2)";
  context.fillRect(0, 0, width, height);

  const cardWidth = Math.min(width * 0.78, 760);
  const cardHeight = Math.min(height * 0.52, 390);
  const cardX = (width - cardWidth) / 2;
  const cardY = height * 0.18;

  context.shadowColor = "rgba(22, 101, 52, 0.24)";
  context.shadowBlur = 24;
  context.shadowOffsetY = 14;
  context.fillStyle = "#fff7ed";
  drawRoundedRect(context, cardX, cardY, cardWidth, cardHeight, 26);
  context.fill();
  context.shadowBlur = 0;
  context.shadowOffsetY = 0;
  context.strokeStyle = "#92400e";
  context.lineWidth = 4;
  context.stroke();

  drawCenteredText(
    context,
    "STAMP CARD",
    width / 2,
    cardY + cardHeight * 0.18,
    Math.min(42, cardWidth / 12),
    "#713f12",
  );

  const slotGap = cardWidth * 0.08;
  const slotRadius = Math.min(cardWidth * 0.115, cardHeight * 0.22, 74);
  const totalSlotWidth = slotRadius * 2 * STAMP_COUNT + slotGap * 2;
  const firstSlotX = width / 2 - totalSlotWidth / 2 + slotRadius;
  const slotY = cardY + cardHeight * 0.58;

  Array.from({ length: STAMP_COUNT }, (_, index) => {
    const x = firstSlotX + index * (slotRadius * 2 + slotGap);
    const isStamped = index < state.stamps;
    const isNewest = isStamped && index === state.stamps - 1;
    const animationRatio = isNewest
      ? 1 - Math.max(state.stampPulseMs / STAMP_ANIMATION_MS, 0)
      : 1;

    context.fillStyle = "#fffbeb";
    context.beginPath();
    context.arc(x, slotY, slotRadius, 0, Math.PI * 2);
    context.fill();
    context.setLineDash([10, 8]);
    context.strokeStyle = "#d97706";
    context.lineWidth = 4;
    context.stroke();
    context.setLineDash([]);

    if (isStamped) {
      drawInkBurst(context, x, slotY, slotRadius, animationRatio);
      drawStamp(
        context,
        images.stamp,
        x,
        slotY,
        slotRadius * 0.78,
        animationRatio,
      );
    }
  });

  const counterText = `${Math.min(state.stamps, STAMP_COUNT)} / ${STAMP_COUNT}`;

  drawCenteredText(
    context,
    counterText,
    width / 2,
    cardY + cardHeight - 42,
    34,
    "#14532d",
  );

  if (state.lastPointer && !state.hasCleared) {
    context.strokeStyle = "rgba(239, 68, 68, 0.55)";
    context.lineWidth = 5;
    context.beginPath();
    context.arc(
      state.lastPointer.x,
      state.lastPointer.y,
      26 + (state.stampPulseMs / STAMP_ANIMATION_MS) * 22,
      0,
      Math.PI * 2,
    );
    context.stroke();
  }
}

export function useAnimalCrossingStampGameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<LoadedImages>({});
  const stateRef = useRef<GameState>(createInitialState());

  useEffect(() => {
    imagesRef.current = (
      Object.keys(ANIMAL_CROSSING_ASSETS) as Array<
        keyof typeof ANIMAL_CROSSING_ASSETS
      >
    ).reduce<LoadedImages>((nextImages, assetKey) => {
      const image = new Image();

      image.src = ANIMAL_CROSSING_ASSETS[assetKey];

      return {
        ...nextImages,
        [assetKey]: image,
      };
    }, {});
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

    const handlePointerDown = (event: PointerEvent) => {
      const state = stateRef.current;

      if (state.hasCleared) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      state.lastPointer = getPointerPoint(canvas, event);
      state.stampPulseMs = STAMP_ANIMATION_MS;
      state.stamps += 1;
      playStampSound();

      if (state.stamps >= STAMP_COUNT) {
        state.hasCleared = true;
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
      state.stampPulseMs = Math.max(state.stampPulseMs - deltaMs, 0);
      drawScene(context, state, imagesRef.current, canvasWidth, canvasHeight);
      animationFrame = window.requestAnimationFrame(render);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointerdown", handlePointerDown, {
      capture: true,
    });
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointerdown", handlePointerDown, {
        capture: true,
      });
    };
  }, []);

  return canvasRef;
}
