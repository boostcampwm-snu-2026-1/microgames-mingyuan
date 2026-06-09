"use client";

import { useEffect, useRef } from "react";
import {
  MICROGAME_CLEAR_EVENT,
  MICROGAME_FAILURE_EVENT,
} from "@/hooks/useMicrogameInput";

const BACKGROUND_IMAGE_SRC =
  "/games/a-dance-of-fire-and-ice/images/background.png";
const COUNTDOWN_BEATS = 2;
const DEFAULT_BEAT_DURATION_MS = 500;
const INPUT_BEATS = 6;
const INPUT_GRACE_BEATS = 0.34;
const PERFECT_WINDOW_BEATS = 0.13;
const MAX_DELTA_MS = 50;
const MIN_CANVAS_HEIGHT = 360;
const MIN_CANVAS_WIDTH = 640;
const ORB_RADIUS = 24;

type TimingFeedback = "early" | "great" | "late" | "none";

type GameState = {
  feedback: TimingFeedback;
  feedbackMs: number;
  hasCleared: boolean;
  hasFailed: boolean;
  hitCount: number;
  lastTimestamp: number | null;
  startTimestamp: number | null;
};

type Point = Readonly<{
  x: number;
  y: number;
}>;

function dispatchClear() {
  window.dispatchEvent(new CustomEvent(MICROGAME_CLEAR_EVENT));
}

function dispatchFailure() {
  window.dispatchEvent(new CustomEvent(MICROGAME_FAILURE_EVENT));
}

function createInitialState() {
  return {
    feedback: "none",
    feedbackMs: 0,
    hasCleared: false,
    hasFailed: false,
    hitCount: 0,
    lastTimestamp: null,
    startTimestamp: null,
  } satisfies GameState;
}

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

function getTrackPoints(width: number, height: number) {
  const trackWidth = Math.min(width * 0.72, 760);
  const startX = (width - trackWidth) / 2;
  const centerY = height * 0.56;

  return Array.from({ length: INPUT_BEATS + 1 }, (_, index) => {
    const progress = index / INPUT_BEATS;

    return {
      x: startX + trackWidth * progress,
      y: centerY + Math.sin(progress * Math.PI * 2) * height * 0.095,
    };
  });
}

function drawTrack(
  context: CanvasRenderingContext2D,
  points: readonly Point[],
  hitCount: number,
  pulse: number,
) {
  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowBlur = 22;
  context.shadowColor = "rgba(196, 181, 253, 0.7)";
  context.strokeStyle = "rgba(221, 214, 254, 0.42)";
  context.lineWidth = 12;
  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(point.x, point.y);
      return;
    }

    context.lineTo(point.x, point.y);
  });
  context.stroke();

  points.forEach((point, index) => {
    const isReached = index <= hitCount;
    const isCurrent = index === hitCount;
    const radius = isCurrent ? 15 + pulse * 3 : 12;

    context.beginPath();
    context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    context.fillStyle = isReached ? "#f8fafc" : "rgba(76, 29, 149, 0.9)";
    context.shadowBlur = isReached ? 24 : 10;
    context.shadowColor = isReached ? "#ffffff" : "#8b5cf6";
    context.fill();
    context.strokeStyle = isReached ? "#ddd6fe" : "#a78bfa";
    context.lineWidth = 4;
    context.stroke();
  });
  context.restore();
}

function drawOrb(
  context: CanvasRenderingContext2D,
  point: Point,
  color: string,
  glowColor: string,
  radius: number,
) {
  const gradient = context.createRadialGradient(
    point.x - radius * 0.3,
    point.y - radius * 0.35,
    radius * 0.12,
    point.x,
    point.y,
    radius,
  );

  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.22, color);
  gradient.addColorStop(1, glowColor);

  context.save();
  context.shadowBlur = 34;
  context.shadowColor = color;
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(255, 255, 255, 0.72)";
  context.lineWidth = 3;
  context.stroke();
  context.restore();
}

function getOrbPoints(
  points: readonly Point[],
  hitCount: number,
  elapsedMs: number,
  beatDurationMs: number,
) {
  const elapsedBeats = elapsedMs / beatDurationMs;

  if (elapsedBeats < 1) {
    const anchor = points[0];
    const countdownAngle = -Math.PI / 2 + elapsedBeats * Math.PI * 2;
    const orbitRadius = ORB_RADIUS * 2.35;

    return {
      blue: {
        x: anchor.x + Math.cos(countdownAngle) * orbitRadius,
        y: anchor.y + Math.sin(countdownAngle) * orbitRadius,
      },
      red: anchor,
    };
  }

  if (hitCount >= INPUT_BEATS) {
    const anchor = points[INPUT_BEATS];

    return {
      blue: { x: anchor.x + ORB_RADIUS * 1.15, y: anchor.y },
      red: { x: anchor.x - ORB_RADIUS * 1.15, y: anchor.y },
    };
  }

  const anchor = points[Math.min(hitCount, INPUT_BEATS)];
  const next = points[Math.min(hitCount + 1, INPUT_BEATS)];
  const targetBeat = COUNTDOWN_BEATS + hitCount;
  const previousBeat = targetBeat - 1;
  const orbitProgress = Math.min(
    Math.max(elapsedMs / beatDurationMs - previousBeat, 0),
    1,
  );
  const angle = Math.PI * orbitProgress;
  const midpoint = {
    x: (anchor.x + next.x) / 2,
    y: (anchor.y + next.y) / 2,
  };
  const halfDistance = Math.hypot(next.x - anchor.x, next.y - anchor.y) / 2;
  const baseAngle = Math.atan2(next.y - anchor.y, next.x - anchor.x);
  const orbitRadius = Math.max(halfDistance, ORB_RADIUS * 1.8);
  const movingAngle = baseAngle + Math.PI + angle;
  const moving = {
    x: midpoint.x + Math.cos(movingAngle) * orbitRadius,
    y: midpoint.y + Math.sin(movingAngle) * orbitRadius,
  };

  return hitCount % 2 === 0
    ? { blue: moving, red: anchor }
    : { blue: anchor, red: moving };
}

function getCueText(state: GameState, elapsedBeats: number) {
  if (state.hasFailed) {
    return "MISS";
  }

  if (state.hasCleared) {
    return "ON BEAT!";
  }

  if (elapsedBeats < 1) {
    return "READY";
  }

  if (elapsedBeats < COUNTDOWN_BEATS) {
    return "GO!";
  }

  if (state.feedback === "early") {
    return "조금 빨라!";
  }

  if (state.feedback === "late") {
    return "조금 늦어!";
  }

  if (state.feedback === "great") {
    return "좋아!";
  }

  return "SPACE";
}

function getCueColor(state: GameState, elapsedBeats: number) {
  if (state.hasFailed) {
    return "#fb7185";
  }

  if (state.hasCleared || state.feedback === "great") {
    return "#fef08a";
  }

  if (state.feedback === "early") {
    return "#7dd3fc";
  }

  if (state.feedback === "late") {
    return "#fda4af";
  }

  return elapsedBeats < COUNTDOWN_BEATS ? "#ffffff" : "#e9d5ff";
}

function drawScene(
  context: CanvasRenderingContext2D,
  state: GameState,
  backgroundImage: HTMLImageElement | null,
  width: number,
  height: number,
  elapsedMs: number,
  beatDurationMs: number,
) {
  if (isImageReady(backgroundImage)) {
    drawCoverImage(context, backgroundImage, width, height);
  } else {
    const fallback = context.createLinearGradient(0, 0, width, height);

    fallback.addColorStop(0, "#170633");
    fallback.addColorStop(1, "#4c1d6f");
    context.fillStyle = fallback;
    context.fillRect(0, 0, width, height);
  }

  context.fillStyle = "rgba(10, 3, 30, 0.28)";
  context.fillRect(0, 0, width, height);

  const elapsedBeats = elapsedMs / beatDurationMs;
  const beatPulse = 1 - (elapsedBeats % 1);
  const points = getTrackPoints(width, height);
  const orbPoints = getOrbPoints(
    points,
    state.hitCount,
    elapsedMs,
    beatDurationMs,
  );

  drawTrack(context, points, state.hitCount, beatPulse);

  const pulseRadius = ORB_RADIUS + beatPulse * 3;

  drawOrb(context, orbPoints.red, "#fb7185", "#be123c", pulseRadius);
  drawOrb(context, orbPoints.blue, "#67e8f9", "#0369a1", pulseRadius);

  const cueText = getCueText(state, elapsedBeats);
  const cueY = height * 0.22;

  context.save();
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `900 ${Math.min(66, width * 0.075)}px Arial, sans-serif`;
  context.fillStyle = getCueColor(state, elapsedBeats);
  context.shadowBlur = 28;
  context.shadowColor = context.fillStyle;
  context.fillText(cueText, width / 2, cueY);

  context.shadowBlur = 0;
  context.font = `800 ${Math.min(24, width * 0.029)}px Arial, sans-serif`;
  context.fillStyle = "rgba(255, 255, 255, 0.82)";
  context.fillText(
    `${state.hitCount} / ${INPUT_BEATS}`,
    width / 2,
    cueY + Math.min(72, height * 0.11),
  );
  context.restore();
}

function failGame(state: GameState) {
  if (state.hasCleared || state.hasFailed) {
    return;
  }

  state.hasFailed = true;
  dispatchFailure();
}

export function useFireAndIceDanceGameCanvas(gameBeatCount: number) {
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(createInitialState());

  useEffect(() => {
    const image = new Image();

    image.src = BACKGROUND_IMAGE_SRC;
    backgroundImageRef.current = image;
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      const state = stateRef.current;

      if (
        state.startTimestamp === null ||
        state.hasCleared ||
        state.hasFailed
      ) {
        return;
      }

      const elapsedMs = performance.now() - state.startTimestamp;
      const targetMs = (COUNTDOWN_BEATS + state.hitCount) * beatDurationMs;
      const timingOffsetMs = elapsedMs - targetMs;
      const graceMs = INPUT_GRACE_BEATS * beatDurationMs;

      if (Math.abs(timingOffsetMs) > graceMs) {
        failGame(state);
        return;
      }

      const perfectWindowMs = PERFECT_WINDOW_BEATS * beatDurationMs;

      state.feedback =
        Math.abs(timingOffsetMs) <= perfectWindowMs
          ? "great"
          : timingOffsetMs < 0
            ? "early"
            : "late";
      state.feedbackMs = beatDurationMs * 0.58;
      state.hitCount += 1;

      if (state.hitCount >= INPUT_BEATS) {
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
      state.startTimestamp ??= timestamp;
      state.feedbackMs = Math.max(state.feedbackMs - deltaMs, 0);

      if (state.feedbackMs === 0) {
        state.feedback = "none";
      }

      const elapsedMs = timestamp - state.startTimestamp;
      const graceMs = INPUT_GRACE_BEATS * beatDurationMs;
      const nextTargetMs = (COUNTDOWN_BEATS + state.hitCount) * beatDurationMs;

      if (
        !state.hasCleared &&
        !state.hasFailed &&
        state.hitCount < INPUT_BEATS &&
        elapsedMs > nextTargetMs + graceMs
      ) {
        failGame(state);
      }

      if (
        !state.hasCleared &&
        !state.hasFailed &&
        elapsedMs >= gameBeatCount * beatDurationMs
      ) {
        failGame(state);
      }

      drawScene(
        context,
        state,
        backgroundImageRef.current,
        canvasWidth,
        canvasHeight,
        elapsedMs,
        beatDurationMs,
      );
      animationFrame = window.requestAnimationFrame(render);
    };

    stateRef.current = createInitialState();
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [gameBeatCount]);

  return canvasRef;
}
