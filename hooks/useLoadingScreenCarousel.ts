"use client";

import { useEffect, useState } from "react";

export function useLoadingScreenCarousel({
  isPaused,
  messageCount,
  tipCount,
}: Readonly<{
  isPaused: boolean;
  messageCount: number;
  tipCount: number;
}>) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (isPaused || messageCount <= 1) {
      return;
    }

    const messageTimer = window.setInterval(() => {
      setMessageIndex(
        (currentMessageIndex) => (currentMessageIndex + 1) % messageCount,
      );
    }, 1400);

    return () => {
      window.clearInterval(messageTimer);
    };
  }, [isPaused, messageCount]);

  useEffect(() => {
    if (isPaused || tipCount <= 1) {
      return;
    }

    const tipTimer = window.setInterval(() => {
      setTipIndex((currentTipIndex) => (currentTipIndex + 1) % tipCount);
    }, 2400);

    return () => {
      window.clearInterval(tipTimer);
    };
  }, [isPaused, tipCount]);

  return {
    messageIndex,
    tipIndex,
  };
}
