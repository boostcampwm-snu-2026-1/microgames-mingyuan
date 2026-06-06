"use client";

import type { ChangeEvent, CompositionEvent, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { MICROGAME_CLEAR_EVENT } from "@/hooks/useMicrogameInput";

const MAPLESTORY_LIE_DETECTOR_OPTIONS = [
  {
    answer: "루팡주황버섯",
    imageSrc:
      "/games/maplestory-lie-detector/images/lupang-orange-mushroom.png",
  },
  {
    answer: "리본돼지옥토퍼스",
    imageSrc: "/games/maplestory-lie-detector/images/ribbon-pig-octopus.png",
  },
  {
    answer: "빨간달팽이슬라임",
    imageSrc: "/games/maplestory-lie-detector/images/red-snail-slime.png",
  },
  {
    answer: "뿔버섯페어리루팡",
    imageSrc:
      "/games/maplestory-lie-detector/images/horn-mushroom-fairy-lupang.png",
  },
  {
    answer: "슬라임스텀프",
    imageSrc: "/games/maplestory-lie-detector/images/slime-stump.png",
  },
  {
    answer: "초록버섯이블아이",
    imageSrc:
      "/games/maplestory-lie-detector/images/green-mushroom-evil-eye.png",
  },
  {
    answer: "파란달팽이슬라임",
    imageSrc: "/games/maplestory-lie-detector/images/blue-snail-slime.png",
  },
] as const;

type LieDetectorOption = (typeof MAPLESTORY_LIE_DETECTOR_OPTIONS)[number];

type LieDetectorInputHandlers = Readonly<{
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCompositionEnd: (event: CompositionEvent<HTMLInputElement>) => void;
  onCompositionStart: () => void;
}>;

function dispatchClear() {
  window.dispatchEvent(new CustomEvent(MICROGAME_CLEAR_EVENT));
}

function createTargetOption() {
  return MAPLESTORY_LIE_DETECTOR_OPTIONS[
    Math.floor(Math.random() * MAPLESTORY_LIE_DETECTOR_OPTIONS.length)
  ];
}

function normalizeLieDetectorInput(value: string) {
  return value.normalize("NFC").replaceAll(/[^\uAC00-\uD7A3]/g, "");
}

export function useMaplestoryLieDetectorGame(): Readonly<{
  inputHandlers: LieDetectorInputHandlers;
  inputRef: RefObject<HTMLInputElement | null>;
  targetOption: LieDetectorOption;
  typedValue: string;
}> {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hasClearedRef = useRef(false);
  const isComposingRef = useRef(false);
  const [targetOption] = useState(createTargetOption);
  const [typedValue, setTypedValue] = useState("");

  const updateTypedValue = (value: string) => {
    const nextTypedValue = normalizeLieDetectorInput(value);

    setTypedValue(nextTypedValue);

    if (
      hasClearedRef.current ||
      nextTypedValue !== targetOption.answer.normalize("NFC")
    ) {
      return;
    }

    hasClearedRef.current = true;
    inputRef.current?.blur();
    dispatchClear();
  };
  const syncTypedValueFromInput = () => {
    const input = inputRef.current;

    if (input) {
      updateTypedValue(input.value);
    }
  };

  const inputHandlers = {
    onChange: (event) => {
      if (isComposingRef.current) {
        return;
      }

      updateTypedValue(event.currentTarget.value);
    },
    onCompositionEnd: () => {
      isComposingRef.current = false;
      window.requestAnimationFrame(syncTypedValueFromInput);
    },
    onCompositionStart: () => {
      isComposingRef.current = true;
    },
  } satisfies LieDetectorInputHandlers;

  useEffect(() => {
    const focusInput = () => {
      if (!hasClearedRef.current) {
        inputRef.current?.focus({ preventScroll: true });
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key === "Backspace" || event.key.length === 1) {
        focusInput();
      }
    };

    focusInput();
    window.addEventListener("pointerdown", focusInput);
    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener("pointerdown", focusInput);
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []);

  return {
    inputHandlers,
    inputRef,
    targetOption,
    typedValue,
  };
}
