"use client";

import { useCallback, useRef, useState } from "react";
import type { PointerEvent, RefObject } from "react";
import { MICROGAME_CLEAR_EVENT } from "@/hooks/useMicrogameInput";

export type PokemonCardSlot = "active";

export type PokemonCard = Readonly<{
  color: string;
  id: PokemonCardType;
  imageSrc: string;
  label: string;
}>;

type PokemonCardType =
  | "electricity"
  | "fighting"
  | "fire"
  | "grass"
  | "psychic"
  | "water";

type DragState = Readonly<{
  card: PokemonCard;
  pointerId: number;
  x: number;
  y: number;
}>;

const CARD_POOL = [
  {
    color: "#facc15",
    id: "electricity",
    imageSrc: "/games/pokemon-tcg-pocket/images/electricity-card.png",
    label: "번개",
  },
  {
    color: "#c08457",
    id: "fighting",
    imageSrc: "/games/pokemon-tcg-pocket/images/fighting-card.png",
    label: "격투",
  },
  {
    color: "#fb7185",
    id: "fire",
    imageSrc: "/games/pokemon-tcg-pocket/images/fire-card.png",
    label: "불꽃",
  },
  {
    color: "#86efac",
    id: "grass",
    imageSrc: "/games/pokemon-tcg-pocket/images/grass-card.png",
    label: "풀",
  },
  {
    color: "#e879f9",
    id: "psychic",
    imageSrc: "/games/pokemon-tcg-pocket/images/psychic-card.png",
    label: "초",
  },
  {
    color: "#67e8f9",
    id: "water",
    imageSrc: "/games/pokemon-tcg-pocket/images/water-card.png",
    label: "물",
  },
] as const satisfies readonly PokemonCard[];
const GRAB_SOUND_SRC = "/games/pokemon-tcg-pocket/sounds/grab.mp3";
const PLACE_SOUND_SRC =
  "/games/pokemon-tcg-pocket/sounds/place common card.mp3";

function dispatchClear() {
  window.dispatchEvent(new CustomEvent(MICROGAME_CLEAR_EVENT));
}

function shuffle<T>(items: readonly T[]) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const currentItem = nextItems[index];
    const swapItem = nextItems[swapIndex];

    nextItems[index] = swapItem;
    nextItems[swapIndex] = currentItem;
  }

  return nextItems;
}

function createRound() {
  const cards = shuffle(CARD_POOL).slice(0, 5);
  const target = cards[Math.floor(Math.random() * cards.length)];

  if (!target) {
    throw new Error("Pokemon card hand must include a target.");
  }

  return { cards, target };
}

function playOneShot(src: string) {
  const audio = new Audio(src);

  audio.volume = 0.92;
  audio.play().catch(() => {
    // Pointer input unlocks audio in browsers that block autoplay.
  });
}

function getSlotAtPoint(clientX: number, clientY: number) {
  const elements = document.elementsFromPoint(clientX, clientY);
  const slotElement = elements.find((element) =>
    element.hasAttribute("data-card-slot"),
  );
  const slot = slotElement?.getAttribute("data-card-slot");

  if (slot === "active") {
    return slot;
  }

  return null;
}

export function usePokemonTcgPocketGame(): Readonly<{
  cards: readonly PokemonCard[];
  containerRef: RefObject<HTMLDivElement | null>;
  drag: DragState | null;
  handlePointerCancel: () => void;
  handlePointerDown: (
    event: PointerEvent<HTMLButtonElement>,
    card: PokemonCard,
  ) => void;
  handlePointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  handlePointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  placedCard: PokemonCard | null;
  placedSlot: PokemonCardSlot | null;
  target: PokemonCard;
}> {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasSubmittedRef = useRef(false);
  const [{ cards, target }] = useState(createRound);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [placedCard, setPlacedCard] = useState<PokemonCard | null>(null);
  const [placedSlot, setPlacedSlot] = useState<PokemonCardSlot | null>(null);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>, card: PokemonCard) => {
      if (hasSubmittedRef.current) {
        return;
      }

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      playOneShot(GRAB_SOUND_SRC);
      setDrag({
        card,
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      });
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      setDrag((currentDrag) => {
        if (!currentDrag || currentDrag.pointerId !== event.pointerId) {
          return currentDrag;
        }

        return {
          ...currentDrag,
          x: event.clientX,
          y: event.clientY,
        };
      });
    },
    [],
  );

  const handlePointerCancel = useCallback(() => {
    setDrag(null);
  }, []);

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      const slot = getSlotAtPoint(event.clientX, event.clientY);

      if (!slot) {
        setDrag(null);
        return;
      }

      hasSubmittedRef.current = true;
      setPlacedCard(drag.card);
      setPlacedSlot(slot);
      setDrag(null);
      playOneShot(PLACE_SOUND_SRC);

      if (drag.card.id === target.id) {
        dispatchClear();
      }
    },
    [drag, target.id],
  );

  return {
    cards,
    containerRef,
    drag,
    handlePointerCancel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    placedCard,
    placedSlot,
    target,
  };
}
