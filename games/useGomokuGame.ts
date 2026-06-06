"use client";

import type { RefObject } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { MICROGAME_CLEAR_EVENT } from "@/hooks/useMicrogameInput";

export type GomokuStoneColor = "black" | "white";

export type GomokuPoint = Readonly<{
  column: number;
  row: number;
}>;

export type GomokuStone = Readonly<
  GomokuPoint & {
    color: GomokuStoneColor;
  }
>;

type GomokuCase = Readonly<{
  target: GomokuPoint;
  stones: readonly GomokuStone[];
}>;

const STONE_PLACED_SOUND_SRC = "/games/gomoku/sounds/stone-placed.mp3";
const GOMOKU_CASES = [
  {
    target: { column: 11, row: 9 },
    stones: [
      { color: "white", column: 7, row: 9 },
      { color: "white", column: 8, row: 9 },
      { color: "white", column: 9, row: 9 },
      { color: "white", column: 10, row: 9 },
      { color: "black", column: 6, row: 8 },
      { color: "black", column: 8, row: 8 },
      { color: "black", column: 10, row: 8 },
      { color: "black", column: 12, row: 8 },
      { color: "black", column: 6, row: 10 },
      { color: "black", column: 7, row: 10 },
      { color: "black", column: 9, row: 10 },
      { color: "black", column: 10, row: 10 },
      { color: "black", column: 12, row: 10 },
    ],
  },
  {
    target: { column: 9, row: 11 },
    stones: [
      { color: "white", column: 9, row: 7 },
      { color: "white", column: 9, row: 8 },
      { color: "white", column: 9, row: 9 },
      { color: "white", column: 9, row: 10 },
      { color: "black", column: 8, row: 6 },
      { color: "black", column: 10, row: 6 },
      { color: "black", column: 8, row: 8 },
      { color: "black", column: 10, row: 8 },
      { color: "black", column: 8, row: 10 },
      { color: "black", column: 10, row: 10 },
      { color: "black", column: 8, row: 12 },
      { color: "black", column: 10, row: 12 },
    ],
  },
  {
    target: { column: 11, row: 11 },
    stones: [
      { color: "white", column: 7, row: 7 },
      { color: "white", column: 8, row: 8 },
      { color: "white", column: 9, row: 9 },
      { color: "white", column: 10, row: 10 },
      { color: "black", column: 7, row: 8 },
      { color: "black", column: 8, row: 7 },
      { color: "black", column: 9, row: 8 },
      { color: "black", column: 8, row: 10 },
      { color: "black", column: 10, row: 9 },
      { color: "black", column: 11, row: 10 },
      { color: "black", column: 10, row: 12 },
      { color: "black", column: 12, row: 10 },
    ],
  },
  {
    target: { column: 11, row: 7 },
    stones: [
      { color: "white", column: 7, row: 11 },
      { color: "white", column: 8, row: 10 },
      { color: "white", column: 9, row: 9 },
      { color: "white", column: 10, row: 8 },
      { color: "black", column: 7, row: 10 },
      { color: "black", column: 8, row: 11 },
      { color: "black", column: 8, row: 9 },
      { color: "black", column: 10, row: 9 },
      { color: "black", column: 9, row: 7 },
      { color: "black", column: 11, row: 8 },
      { color: "black", column: 10, row: 6 },
      { color: "black", column: 12, row: 8 },
    ],
  },
  {
    target: { column: 8, row: 8 },
    stones: [
      { color: "white", column: 6, row: 8 },
      { color: "white", column: 7, row: 8 },
      { color: "white", column: 9, row: 8 },
      { color: "white", column: 10, row: 8 },
      { color: "black", column: 6, row: 7 },
      { color: "black", column: 7, row: 7 },
      { color: "black", column: 9, row: 7 },
      { color: "black", column: 10, row: 7 },
      { color: "black", column: 6, row: 9 },
      { color: "black", column: 8, row: 9 },
      { color: "black", column: 10, row: 9 },
      { color: "black", column: 11, row: 9 },
    ],
  },
  {
    target: { column: 12, row: 6 },
    stones: [
      { color: "white", column: 12, row: 4 },
      { color: "white", column: 12, row: 5 },
      { color: "white", column: 12, row: 7 },
      { color: "white", column: 12, row: 8 },
      { color: "black", column: 11, row: 4 },
      { color: "black", column: 13, row: 4 },
      { color: "black", column: 11, row: 5 },
      { color: "black", column: 13, row: 5 },
      { color: "black", column: 11, row: 7 },
      { color: "black", column: 13, row: 7 },
      { color: "black", column: 11, row: 8 },
      { color: "black", column: 13, row: 8 },
    ],
  },
] satisfies readonly GomokuCase[];

function dispatchClear() {
  window.dispatchEvent(new CustomEvent(MICROGAME_CLEAR_EVENT));
}

function isSamePoint(first: GomokuPoint, second: GomokuPoint) {
  return first.column === second.column && first.row === second.row;
}

function isOccupied(point: GomokuPoint, stones: readonly GomokuStone[]) {
  return stones.some((stone) => isSamePoint(stone, point));
}

function hasStoneAt(
  point: GomokuPoint,
  stones: readonly GomokuStone[],
  color: GomokuStoneColor,
) {
  return stones.some(
    (stone) => stone.color === color && isSamePoint(stone, point),
  );
}

function countContiguousStones(
  origin: GomokuPoint,
  stones: readonly GomokuStone[],
  color: GomokuStoneColor,
  deltaColumn: number,
  deltaRow: number,
) {
  let count = 0;
  let point = {
    column: origin.column + deltaColumn,
    row: origin.row + deltaRow,
  } satisfies GomokuPoint;

  while (hasStoneAt(point, stones, color)) {
    count += 1;
    point = {
      column: point.column + deltaColumn,
      row: point.row + deltaRow,
    };
  }

  return count;
}

function createsFiveInARow(
  point: GomokuPoint,
  stones: readonly GomokuStone[],
  color: GomokuStoneColor,
) {
  const directions = [
    { column: 1, row: 0 },
    { column: 0, row: 1 },
    { column: 1, row: 1 },
    { column: 1, row: -1 },
  ] satisfies GomokuPoint[];

  return directions.some(({ column, row }) => {
    const lineLength =
      1 +
      countContiguousStones(point, stones, color, column, row) +
      countContiguousStones(point, stones, color, -column, -row);

    return lineLength >= 5;
  });
}

function playStoneSound(audioRef: RefObject<HTMLAudioElement | null>) {
  if (!audioRef.current) {
    audioRef.current = new Audio(STONE_PLACED_SOUND_SRC);
  }

  audioRef.current.currentTime = 0;
  audioRef.current.play().catch(() => {
    // Browsers can reject audio until a trusted gesture fully unlocks playback.
  });
}

export function useGomokuGame() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasResolvedRef = useRef(false);
  const [gomokuCase] = useState(
    () => GOMOKU_CASES[Math.floor(Math.random() * GOMOKU_CASES.length)],
  );
  const [placedStone, setPlacedStone] = useState<GomokuStone | null>(null);

  const stones = useMemo(
    () =>
      placedStone ? [...gomokuCase.stones, placedStone] : gomokuCase.stones,
    [gomokuCase.stones, placedStone],
  );

  const playAtPoint = useCallback(
    (point: GomokuPoint) => {
      if (hasResolvedRef.current || isOccupied(point, gomokuCase.stones)) {
        return;
      }

      const nextStone = {
        color: "white",
        ...point,
      } satisfies GomokuStone;

      hasResolvedRef.current = true;
      setPlacedStone(nextStone);
      playStoneSound(audioRef);

      if (
        createsFiveInARow(point, [...gomokuCase.stones, nextStone], "white")
      ) {
        dispatchClear();
      }
    },
    [gomokuCase.stones],
  );

  return {
    playAtPoint,
    stones,
  };
}
