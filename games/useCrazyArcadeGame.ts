"use client";

import { useEffect, useRef } from "react";
import { RHYTHM_DURATION_MS } from "@/hooks/useSynchronizedRhythm";
import {
  MICROGAME_CLEAR_EVENT,
  MICROGAME_FAILURE_EVENT,
} from "@/hooks/useMicrogameInput";
import { bgmLibrary } from "@/lib/bgmLibrary";

const MIN_CANVAS_HEIGHT = 360;
const MIN_CANVAS_WIDTH = 640;
const MAX_DELTA_SECONDS = 1 / 30;
const ROUND_END_SAFETY_MS = 90;
const GRID_COLUMNS = 17;
const GRID_ROWS = 11;
const SOURCE_GRID_X = 67;
const SOURCE_GRID_Y = 70;
const SOURCE_CELL_SIZE = 73;
const CRAZY_ARCADE_ASSETS = {
  background: "/games/crazy-arcade/images/background.png",
  bomb: "/games/crazy-arcade/images/water-bomb.png",
  playerDown: "/games/crazy-arcade/images/player-down.png",
  playerLeft: "/games/crazy-arcade/images/player-left.png",
  playerRight: "/games/crazy-arcade/images/player-right.png",
  playerUp: "/games/crazy-arcade/images/player-up.png",
} as const;

type AssetKey = keyof typeof CRAZY_ARCADE_ASSETS;
type Direction = "down" | "left" | "right" | "up";

type Cell = Readonly<{
  column: number;
  row: number;
}>;

type BackgroundLayout = Readonly<{
  height: number;
  scale: number;
  width: number;
  x: number;
  y: number;
}>;

type GameState = {
  bombCells: Set<string>;
  elapsedMs: number;
  hasResolved: boolean;
  lastDirection: Direction;
  lastTimestamp: number | null;
  playerCell: Cell;
  targetCell: Cell;
};

const KEY_TO_DIRECTION = {
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
} satisfies Record<string, Direction>;

function isDirectionKey(key: string): key is keyof typeof KEY_TO_DIRECTION {
  return key in KEY_TO_DIRECTION;
}

function dispatchClear() {
  window.dispatchEvent(new CustomEvent(MICROGAME_CLEAR_EVENT));
}

function dispatchFailure() {
  window.dispatchEvent(new CustomEvent(MICROGAME_FAILURE_EVENT));
}

function getBeatDurationMs(canvas: HTMLCanvasElement) {
  const rawDuration = window
    .getComputedStyle(canvas)
    .getPropertyValue("--game-rhythm-duration")
    .trim();
  const parsedDuration = Number.parseFloat(rawDuration);

  return Number.isFinite(parsedDuration) && parsedDuration > 0
    ? parsedDuration
    : RHYTHM_DURATION_MS;
}

function getCellKey(cell: Cell) {
  return `${cell.column}:${cell.row}`;
}

function getRandomCell() {
  return {
    column: Math.floor(Math.random() * GRID_COLUMNS),
    row: Math.floor(Math.random() * GRID_ROWS),
  } satisfies Cell;
}

function getManhattanDistance(first: Cell, second: Cell) {
  return (
    Math.abs(first.column - second.column) + Math.abs(first.row - second.row)
  );
}

function createInitialState() {
  const playerCell = getRandomCell();
  const targetCell = getRandomCell();

  if (getManhattanDistance(playerCell, targetCell) < 5) {
    return createInitialState();
  }

  return {
    bombCells: new Set<string>(),
    elapsedMs: 0,
    hasResolved: false,
    lastDirection: "down",
    lastTimestamp: null,
    playerCell,
    targetCell,
  } satisfies GameState;
}

function preloadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to preload ${src}`));
    image.src = src;
  });
}

async function preloadCrazyArcadeImages() {
  const entries = await Promise.all(
    Object.entries(CRAZY_ARCADE_ASSETS).map(async ([key, src]) => {
      const image = await preloadImage(src);

      return [key, image] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<AssetKey, HTMLImageElement>;
}

function getCoverLayout(
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const scale = Math.max(
    width / image.naturalWidth,
    height / image.naturalHeight,
  );
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;

  return {
    height: drawHeight,
    scale,
    width: drawWidth,
    x: (width - drawWidth) / 2,
    y: (height - drawHeight) / 2,
  } satisfies BackgroundLayout;
}

function getGridLayout(layout: BackgroundLayout) {
  return {
    cellSize: SOURCE_CELL_SIZE * layout.scale,
    x: layout.x + SOURCE_GRID_X * layout.scale,
    y: layout.y + SOURCE_GRID_Y * layout.scale,
  };
}

function getCellCenter(cell: Cell, layout: BackgroundLayout) {
  const grid = getGridLayout(layout);

  return {
    x: grid.x + (cell.column + 0.5) * grid.cellSize,
    y: grid.y + (cell.row + 0.5) * grid.cellSize,
  };
}

function drawFallbackBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const gradient = context.createLinearGradient(0, 0, width, height);

  gradient.addColorStop(0, "#0284c7");
  gradient.addColorStop(1, "#0f766e");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

function drawBackground(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  width: number,
  height: number,
) {
  if (!image) {
    drawFallbackBackground(context, width, height);
    return null;
  }

  const layout = getCoverLayout(image, width, height);

  context.drawImage(image, layout.x, layout.y, layout.width, layout.height);
  return layout;
}

function drawTarget(
  context: CanvasRenderingContext2D,
  cell: Cell,
  layout: BackgroundLayout,
  elapsedMs: number,
) {
  const grid = getGridLayout(layout);
  const center = getCellCenter(cell, layout);
  const pulse = 0.5 + Math.sin(elapsedMs / 150) * 0.5;
  const radius = grid.cellSize * (0.34 + pulse * 0.06);

  context.save();
  context.globalAlpha = 0.92;
  context.fillStyle = "rgba(250, 204, 21, 0.28)";
  context.strokeStyle = "#fde047";
  context.lineWidth = Math.max(3, grid.cellSize * 0.06);
  context.beginPath();
  context.arc(center.x, center.y, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.strokeStyle = "rgba(255, 255, 255, 0.9)";
  context.lineWidth = Math.max(2, grid.cellSize * 0.028);
  context.beginPath();
  context.moveTo(center.x - radius * 0.58, center.y);
  context.lineTo(center.x + radius * 0.58, center.y);
  context.moveTo(center.x, center.y - radius * 0.58);
  context.lineTo(center.x, center.y + radius * 0.58);
  context.stroke();
  context.restore();
}

function drawBomb(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | undefined,
  cell: Cell,
  layout: BackgroundLayout,
) {
  const grid = getGridLayout(layout);
  const center = getCellCenter(cell, layout);
  const width = grid.cellSize * 0.58;
  const height = width * 1.64;

  context.save();
  context.shadowBlur = 16;
  context.shadowColor = "rgba(34, 211, 238, 0.58)";

  if (image) {
    context.drawImage(
      image,
      center.x - width / 2,
      center.y - height * 0.56,
      width,
      height,
    );
  } else {
    context.fillStyle = "#22d3ee";
    context.beginPath();
    context.arc(center.x, center.y, width * 0.42, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
}

function drawPlayer(
  context: CanvasRenderingContext2D,
  images: Partial<Record<AssetKey, HTMLImageElement>>,
  state: GameState,
  layout: BackgroundLayout,
) {
  const image =
    images[
      state.lastDirection === "up"
        ? "playerUp"
        : state.lastDirection === "left"
          ? "playerLeft"
          : state.lastDirection === "right"
            ? "playerRight"
            : "playerDown"
    ];
  const grid = getGridLayout(layout);
  const center = getCellCenter(state.playerCell, layout);
  const width = grid.cellSize * 0.68;
  const height = width * 1.18;

  context.save();
  context.shadowBlur = 14;
  context.shadowColor = "rgba(255, 255, 255, 0.46)";

  if (image) {
    context.drawImage(
      image,
      center.x - width / 2,
      center.y - height * 0.64,
      width,
      height,
    );
  } else {
    context.fillStyle = "#f8fafc";
    context.beginPath();
    context.arc(center.x, center.y, width * 0.38, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
}

function drawScene(
  context: CanvasRenderingContext2D,
  images: Partial<Record<AssetKey, HTMLImageElement>>,
  state: GameState,
  width: number,
  height: number,
) {
  const layout = drawBackground(
    context,
    images.background ?? null,
    width,
    height,
  );

  if (!layout) {
    return;
  }

  drawTarget(context, state.targetCell, layout, state.elapsedMs);
  Array.from(state.bombCells).forEach((cellKey) => {
    const [column, row] = cellKey.split(":").map(Number);

    drawBomb(context, images.bomb, { column, row }, layout);
  });
  drawPlayer(context, images, state, layout);
}

function getMovedCell(cell: Cell, direction: Direction) {
  if (direction === "up") {
    return { ...cell, row: cell.row - 1 };
  }

  if (direction === "down") {
    return { ...cell, row: cell.row + 1 };
  }

  if (direction === "left") {
    return { ...cell, column: cell.column - 1 };
  }

  return { ...cell, column: cell.column + 1 };
}

function isCellInBounds(cell: Cell) {
  return (
    cell.column >= 0 &&
    cell.column < GRID_COLUMNS &&
    cell.row >= 0 &&
    cell.row < GRID_ROWS
  );
}

function playBombInstallSound() {
  bgmLibrary
    .playSoundEffect("crazyArcadeBombInstall")
    .catch((error: unknown) => {
      console.error(error);
    });
}

export function useCrazyArcadeGameCanvas(gameBeatCount: number) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const imagesRef = useRef<Partial<Record<AssetKey, HTMLImageElement>>>({});
  const stateRef = useRef<GameState>(createInitialState());

  useEffect(() => {
    preloadCrazyArcadeImages()
      .then((images) => {
        imagesRef.current = images;
      })
      .catch((error: unknown) => {
        console.error(error);
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

    const beatDurationMs = getBeatDurationMs(canvas);
    const roundDurationMs = gameBeatCount * beatDurationMs;

    const resizeCanvas = () => {
      const width = Math.max(window.innerWidth, MIN_CANVAS_WIDTH);
      const height = Math.max(window.innerHeight, MIN_CANVAS_HEIGHT);
      const pixelRatio = window.devicePixelRatio || 1;

      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const resolveRound = () => {
      if (stateRef.current.hasResolved) {
        return;
      }

      const hasTargetBomb = stateRef.current.bombCells.has(
        getCellKey(stateRef.current.targetCell),
      );

      stateRef.current = {
        ...stateRef.current,
        hasResolved: true,
      };

      if (hasTargetBomb) {
        dispatchClear();
        return;
      }

      dispatchFailure();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (stateRef.current.hasResolved) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        event.stopImmediatePropagation();

        const cellKey = getCellKey(stateRef.current.playerCell);

        if (!stateRef.current.bombCells.has(cellKey)) {
          stateRef.current = {
            ...stateRef.current,
            bombCells: new Set([...stateRef.current.bombCells, cellKey]),
          };
          playBombInstallSound();
        }
        return;
      }

      if (!isDirectionKey(event.key)) {
        return;
      }

      const direction = KEY_TO_DIRECTION[event.key];

      event.preventDefault();
      event.stopImmediatePropagation();

      const nextCell = getMovedCell(stateRef.current.playerCell, direction);

      stateRef.current = {
        ...stateRef.current,
        lastDirection: direction,
      };

      if (
        !isCellInBounds(nextCell) ||
        stateRef.current.bombCells.has(getCellKey(nextCell))
      ) {
        return;
      }

      stateRef.current = {
        ...stateRef.current,
        playerCell: nextCell,
      };
    };

    const render = (timestamp: number) => {
      const pixelRatio = window.devicePixelRatio || 1;
      const width = canvas.width / pixelRatio;
      const height = canvas.height / pixelRatio;
      const previousTimestamp = stateRef.current.lastTimestamp ?? timestamp;
      const deltaSeconds = Math.min(
        (timestamp - previousTimestamp) / 1000,
        MAX_DELTA_SECONDS,
      );
      const elapsedMs = stateRef.current.elapsedMs + deltaSeconds * 1000;

      stateRef.current = {
        ...stateRef.current,
        elapsedMs,
        lastTimestamp: timestamp,
      };

      drawScene(context, imagesRef.current, stateRef.current, width, height);

      if (elapsedMs >= roundDurationMs - ROUND_END_SAFETY_MS) {
        resolveRound();
      }

      frameRef.current = window.requestAnimationFrame(render);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    frameRef.current = window.requestAnimationFrame(render);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [gameBeatCount]);

  return canvasRef;
}
