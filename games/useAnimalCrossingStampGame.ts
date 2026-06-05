"use client";

import { useEffect, useRef } from "react";
import { MICROGAME_CLEAR_EVENT } from "@/hooks/useMicrogameInput";
import { drawCenteredText } from "@/lib/canvasUtils";

const MIN_CANVAS_HEIGHT = 360;
const MIN_CANVAS_WIDTH = 640;
const MAX_DELTA_MS = 50;
const STAMP_COUNT = 3;
const STAMP_PULSE_MS = 260;

type GameState = {
  hasCleared: boolean;
  lastPointer: Point | null;
  lastTimestamp: number | null;
  stampPulseMs: number;
  stamps: number;
};

type Point = {
  x: number;
  y: number;
};

function dispatchClear() {
  window.dispatchEvent(new CustomEvent(MICROGAME_CLEAR_EVENT));
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

function drawLeaf(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
) {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.fillStyle = "rgba(22, 163, 74, 0.26)";
  context.beginPath();
  context.ellipse(0, 0, size * 0.48, size, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(21, 128, 61, 0.22)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(0, -size * 0.72);
  context.lineTo(0, size * 0.72);
  context.stroke();
  context.restore();
}

function drawStamp(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  pulseRatio: number,
) {
  const pulseScale = 1 + pulseRatio * 0.18;

  context.save();
  context.translate(x, y);
  context.rotate(-0.16);
  context.scale(pulseScale, pulseScale);
  context.globalAlpha = 0.95;
  context.fillStyle = "#ef4444";
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#991b1b";
  context.lineWidth = 5;
  context.stroke();

  context.strokeStyle = "rgba(255, 255, 255, 0.9)";
  context.lineWidth = 4;
  context.beginPath();
  context.arc(0, 0, radius * 0.58, 0, Math.PI * 2);
  context.stroke();

  context.fillStyle = "#fff7ed";
  context.font = `900 ${radius * 0.72}px Arial, Helvetica, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("OK", 0, 1);
  context.restore();
}

function drawScene(
  context: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
) {
  const gradient = context.createLinearGradient(0, 0, 0, height);

  gradient.addColorStop(0, "#d9f99d");
  gradient.addColorStop(0.42, "#bbf7d0");
  gradient.addColorStop(1, "#fef3c7");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  Array.from({ length: 18 }, (_, index) => {
    const x = ((index * 149) % width) + 18;
    const y = 28 + ((index * 83) % Math.max(height - 80, 1));

    drawLeaf(context, x, y, 24 + (index % 4) * 7, index * 0.58);
  });

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
    const pulseRatio = isNewest
      ? Math.max(state.stampPulseMs / STAMP_PULSE_MS, 0)
      : 0;

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
      drawStamp(context, x, slotY, slotRadius * 0.78, pulseRatio);
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
      26 + (state.stampPulseMs / STAMP_PULSE_MS) * 22,
      0,
      Math.PI * 2,
    );
    context.stroke();
  }
}

export function useAnimalCrossingStampGameCanvas() {
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
      state.stampPulseMs = STAMP_PULSE_MS;
      state.stamps += 1;

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
      drawScene(context, state, canvasWidth, canvasHeight);
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
