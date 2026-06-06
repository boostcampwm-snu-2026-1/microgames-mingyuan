"use client";

import { useEffect, useRef } from "react";
import {
  MICROGAME_CLEAR_EVENT,
  MICROGAME_FAILURE_EVENT,
} from "@/hooks/useMicrogameInput";
import { bgmLibrary } from "@/lib/bgmLibrary";

const ANIMATION_DURATION_MS = 138;
const BOARD_SIZE = 4;
const GOAL_TILE = 32;
const MIN_CANVAS_HEIGHT = 360;
const MIN_CANVAS_WIDTH = 640;
const SPAWN_POSITIONS = [
  { column: 3, row: 3 },
  { column: 3, row: 2 },
  { column: 2, row: 3 },
  { column: 2, row: 2 },
  { column: 3, row: 1 },
  { column: 1, row: 3 },
  { column: 0, row: 0 },
  { column: 1, row: 0 },
  { column: 2, row: 0 },
  { column: 3, row: 0 },
] as const;
const TILE_COLORS: Record<number, { background: string; text: string }> = {
  0: { background: "#cdc1b4", text: "#776e65" },
  2: { background: "#eee4da", text: "#776e65" },
  4: { background: "#ede0c8", text: "#776e65" },
  8: { background: "#f2b179", text: "#f9f6f2" },
  16: { background: "#f59563", text: "#f9f6f2" },
  32: { background: "#f67c5f", text: "#f9f6f2" },
  64: { background: "#f65e3b", text: "#f9f6f2" },
};

type Direction = "down" | "left" | "right" | "up";

type Position = Readonly<{
  column: number;
  row: number;
}>;

type Tile = Position &
  Readonly<{
    id: number;
    value: number;
  }>;

type MovingTile = Readonly<{
  from: Position;
  id: number;
  to: Position;
  value: number;
}>;

type MoveResult = Readonly<{
  hasMoved: boolean;
  movingTiles: MovingTile[];
  nextTileId: number;
  nextTiles: Tile[];
  reachedGoal: boolean;
}>;

type MoveAnimation = Readonly<{
  movingTiles: MovingTile[];
  nextTiles: Tile[];
  nextTileId: number;
  startedAt: number;
  willClear: boolean;
}>;

type GameState = {
  animation: MoveAnimation | null;
  hasCleared: boolean;
  hasFailed: boolean;
  nextTileId: number;
  spawnIndex: number;
  tiles: Tile[];
};

type BoardLayout = Readonly<{
  cellGap: number;
  length: number;
  tileSize: number;
  x: number;
  y: number;
}>;

function dispatchClear() {
  window.dispatchEvent(new CustomEvent(MICROGAME_CLEAR_EVENT));
}

function dispatchFailure() {
  window.dispatchEvent(new CustomEvent(MICROGAME_FAILURE_EVENT));
}

function createInitialTiles() {
  return [
    { column: 0, id: 1, row: 3, value: 2 },
    { column: 1, id: 2, row: 3, value: 2 },
  ] satisfies Tile[];
}

function createInitialState() {
  return {
    animation: null,
    hasCleared: false,
    hasFailed: false,
    nextTileId: 3,
    spawnIndex: 0,
    tiles: createInitialTiles(),
  } satisfies GameState;
}

function playSwipeSound() {
  bgmLibrary
    .playSoundEffect("twentyFortyEightSwipe")
    .catch((error: unknown) => {
      console.error(error);
    });
}

function getDirection(event: KeyboardEvent): Direction | null {
  if (event.key === "ArrowDown") {
    return "down";
  }

  if (event.key === "ArrowLeft") {
    return "left";
  }

  if (event.key === "ArrowRight") {
    return "right";
  }

  if (event.key === "ArrowUp") {
    return "up";
  }

  return null;
}

function isSamePosition(first: Position, second: Position) {
  return first.column === second.column && first.row === second.row;
}

function getTileAt(tiles: readonly Tile[], position: Position) {
  return tiles.find((tile) => isSamePosition(tile, position)) ?? null;
}

function getLinePositions(direction: Direction, lineIndex: number) {
  return Array.from({ length: BOARD_SIZE }, (_, index) => {
    if (direction === "left") {
      return { column: index, row: lineIndex };
    }

    if (direction === "right") {
      return { column: BOARD_SIZE - 1 - index, row: lineIndex };
    }

    if (direction === "up") {
      return { column: lineIndex, row: index };
    }

    return { column: lineIndex, row: BOARD_SIZE - 1 - index };
  }) satisfies Position[];
}

function moveTiles(tiles: readonly Tile[], direction: Direction) {
  const movingTiles: MovingTile[] = [];
  const nextTiles: Tile[] = [];
  let hasMoved = false;
  let nextTileId =
    Math.max(0, ...tiles.map((tile) => tile.id), tiles.length) + 1;

  Array.from({ length: BOARD_SIZE }, (_, lineIndex) => {
    const positions = getLinePositions(direction, lineIndex);
    const lineTiles = positions
      .map((position) => getTileAt(tiles, position))
      .filter((tile): tile is Tile => tile !== null);
    let targetIndex = 0;

    for (let index = 0; index < lineTiles.length; index += 1) {
      const currentTile = lineTiles[index];
      const nextTile = lineTiles[index + 1];
      const targetPosition = positions[targetIndex];

      if (nextTile && currentTile.value === nextTile.value) {
        const mergedTile = {
          ...targetPosition,
          id: nextTileId,
          value: currentTile.value * 2,
        } satisfies Tile;

        nextTileId += 1;
        nextTiles.push(mergedTile);
        movingTiles.push(
          {
            from: currentTile,
            id: currentTile.id,
            to: targetPosition,
            value: currentTile.value,
          },
          {
            from: nextTile,
            id: nextTile.id,
            to: targetPosition,
            value: nextTile.value,
          },
        );
        hasMoved = true;
        index += 1;
        targetIndex += 1;
        continue;
      }

      nextTiles.push({
        ...targetPosition,
        id: currentTile.id,
        value: currentTile.value,
      });

      if (!isSamePosition(currentTile, targetPosition)) {
        movingTiles.push({
          from: currentTile,
          id: currentTile.id,
          to: targetPosition,
          value: currentTile.value,
        });
        hasMoved = true;
      }

      targetIndex += 1;
    }
  });

  return {
    hasMoved,
    movingTiles,
    nextTileId,
    nextTiles,
    reachedGoal: nextTiles.some((tile) => tile.value >= GOAL_TILE),
  } satisfies MoveResult;
}

function getEmptyPositions(tiles: readonly Tile[]) {
  return Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, column) => ({ column, row })),
  )
    .flat()
    .filter((position) => !getTileAt(tiles, position));
}

function addSpawnTile(
  tiles: readonly Tile[],
  nextTileId: number,
  spawnIndex: number,
) {
  const emptyPositions = getEmptyPositions(tiles);

  if (emptyPositions.length === 0) {
    return { nextSpawnIndex: spawnIndex, nextTileId, tiles: [...tiles] };
  }

  const spawnPosition =
    SPAWN_POSITIONS.slice(spawnIndex).find((position) =>
      emptyPositions.some((emptyPosition) =>
        isSamePosition(emptyPosition, position),
      ),
    ) ??
    SPAWN_POSITIONS.find((position) =>
      emptyPositions.some((emptyPosition) =>
        isSamePosition(emptyPosition, position),
      ),
    ) ??
    emptyPositions[0];

  return {
    nextSpawnIndex: (spawnIndex + 1) % SPAWN_POSITIONS.length,
    nextTileId: nextTileId + 1,
    tiles: [
      ...tiles,
      {
        ...spawnPosition,
        id: nextTileId,
        value: 2,
      },
    ],
  };
}

function hasAvailableMove(tiles: readonly Tile[]) {
  return (["down", "left", "right", "up"] as const).some(
    (direction) => moveTiles(tiles, direction).hasMoved,
  );
}

function getTilePalette(value: number) {
  return TILE_COLORS[value] ?? { background: "#edcf72", text: "#f9f6f2" };
}

function getBoardLayout(width: number, height: number) {
  const boardLength = Math.min(width, height) * 0.72;
  const clampedBoardLength = Math.min(Math.max(boardLength, 320), 560);
  const cellGap = clampedBoardLength * 0.025;

  return {
    cellGap,
    length: clampedBoardLength,
    tileSize: (clampedBoardLength - cellGap * (BOARD_SIZE + 1)) / BOARD_SIZE,
    x: (width - clampedBoardLength) / 2,
    y: (height - clampedBoardLength) / 2 + height * 0.04,
  } satisfies BoardLayout;
}

function getTilePoint(position: Position, layout: BoardLayout) {
  return {
    x:
      layout.x +
      layout.cellGap +
      position.column * (layout.tileSize + layout.cellGap),
    y:
      layout.y +
      layout.cellGap +
      position.row * (layout.tileSize + layout.cellGap),
  };
}

function drawCenteredText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color: string,
) {
  context.fillStyle = color;
  context.font = `700 ${fontSize}px Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, x, y);
}

function drawTile(
  context: CanvasRenderingContext2D,
  value: number,
  x: number,
  y: number,
  tileSize: number,
) {
  const palette = getTilePalette(value);

  context.fillStyle = palette.background;
  context.beginPath();
  context.roundRect(x, y, tileSize, tileSize, tileSize * 0.08);
  context.fill();
  drawCenteredText(
    context,
    String(value),
    x + tileSize / 2,
    y + tileSize / 2 + tileSize * 0.02,
    Math.floor(tileSize * 0.36),
    palette.text,
  );
}

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - progress, 3);
}

function drawBoardBackground(
  context: CanvasRenderingContext2D,
  layout: BoardLayout,
) {
  context.fillStyle = "#bbada0";
  context.beginPath();
  context.roundRect(
    layout.x,
    layout.y,
    layout.length,
    layout.length,
    layout.cellGap * 1.4,
  );
  context.fill();

  Array.from({ length: BOARD_SIZE }, (_, row) => {
    Array.from({ length: BOARD_SIZE }, (_, column) => {
      const point = getTilePoint({ column, row }, layout);

      context.fillStyle = TILE_COLORS[0].background;
      context.beginPath();
      context.roundRect(
        point.x,
        point.y,
        layout.tileSize,
        layout.tileSize,
        layout.tileSize * 0.08,
      );
      context.fill();
    });
  });
}

function drawStaticTiles(
  context: CanvasRenderingContext2D,
  tiles: readonly Tile[],
  layout: BoardLayout,
) {
  tiles.forEach((tile) => {
    const point = getTilePoint(tile, layout);

    drawTile(context, tile.value, point.x, point.y, layout.tileSize);
  });
}

function drawMovingTiles(
  context: CanvasRenderingContext2D,
  movingTiles: readonly MovingTile[],
  progress: number,
  layout: BoardLayout,
) {
  const easedProgress = easeOutCubic(progress);

  movingTiles.forEach((tile) => {
    const from = getTilePoint(tile.from, layout);
    const to = getTilePoint(tile.to, layout);
    const x = from.x + (to.x - from.x) * easedProgress;
    const y = from.y + (to.y - from.y) * easedProgress;

    drawTile(context, tile.value, x, y, layout.tileSize);
  });
}

function drawScene(
  context: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
  timestamp: number,
) {
  context.fillStyle = "#faf8ef";
  context.fillRect(0, 0, width, height);

  const layout = getBoardLayout(width, height);

  drawCenteredText(
    context,
    "2048",
    width / 2,
    Math.max(48, layout.y * 0.52),
    54,
    "#776e65",
  );
  drawBoardBackground(context, layout);

  if (state.animation) {
    const movingIds = new Set(
      state.animation.movingTiles.map((tile) => tile.id),
    );
    const progress = Math.min(
      (timestamp - state.animation.startedAt) / ANIMATION_DURATION_MS,
      1,
    );

    drawStaticTiles(
      context,
      state.tiles.filter((tile) => !movingIds.has(tile.id)),
      layout,
    );
    drawMovingTiles(context, state.animation.movingTiles, progress, layout);
  } else {
    drawStaticTiles(context, state.tiles, layout);
  }

  if (state.hasFailed) {
    context.fillStyle = "rgba(238, 228, 218, 0.72)";
    context.fillRect(layout.x, layout.y, layout.length, layout.length);
    drawCenteredText(context, "NO MOVE", width / 2, height / 2, 52, "#776e65");
  }
}

function failGame(state: GameState) {
  if (state.hasCleared || state.hasFailed) {
    return;
  }

  state.hasFailed = true;
  dispatchFailure();
}

function finishAnimation(state: GameState) {
  const animation = state.animation;

  if (!animation) {
    return;
  }

  state.animation = null;
  state.nextTileId = animation.nextTileId;
  state.tiles = animation.nextTiles;

  if (animation.willClear) {
    dispatchClear();
    return;
  }

  const spawned = addSpawnTile(state.tiles, state.nextTileId, state.spawnIndex);

  state.nextTileId = spawned.nextTileId;
  state.spawnIndex = spawned.nextSpawnIndex;
  state.tiles = spawned.tiles;

  if (!hasAvailableMove(state.tiles)) {
    failGame(state);
  }
}

export function useTwoThousandFortyEightBossGameCanvas() {
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

    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = getDirection(event);

      if (!direction) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      const state = stateRef.current;

      if (state.animation || state.hasCleared || state.hasFailed) {
        return;
      }

      const moveResult = moveTiles(state.tiles, direction);

      if (!moveResult.hasMoved) {
        return;
      }

      playSwipeSound();

      if (moveResult.reachedGoal) {
        state.hasCleared = true;
      }

      state.animation = {
        movingTiles: moveResult.movingTiles,
        nextTileId: moveResult.nextTileId,
        nextTiles: moveResult.nextTiles,
        startedAt: window.performance.now(),
        willClear: moveResult.reachedGoal,
      };
    };

    const render = (timestamp: number) => {
      const state = stateRef.current;

      if (
        state.animation &&
        timestamp - state.animation.startedAt >= ANIMATION_DURATION_MS
      ) {
        finishAnimation(state);
      }

      drawScene(context, state, canvasWidth, canvasHeight, timestamp);
      animationFrame = window.requestAnimationFrame(render);
    };

    stateRef.current = createInitialState();
    resizeCanvas();
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("resize", resizeCanvas);
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return canvasRef;
}
