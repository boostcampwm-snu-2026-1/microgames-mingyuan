import { FORM_INSTRUCTIONS } from "@/data/formInstructions";

export const ALL_GAME_PRELOAD_ASSETS = [
  "/games/game-flow/images/main-elevator-1.png",
  "/games/game-flow/images/main-elevator-2.png",
  "/games/game-flow/images/main-elevator-fail-1.png",
  "/games/game-flow/images/main-elevator-fail-2.png",
  "/games/game-flow/images/main-elevator-success-1.png",
  "/games/game-flow/images/main-elevator-success-2.png",
  "/games/game-flow/images/game-main-logo.png",
  "/games/game-flow/images/life-active.png",
  "/games/game-flow/images/life-deactive.png",
  "/games/game-flow/images/loading-spinner.png",
  "/games/game-flow/images/timer.png",
  ...FORM_INSTRUCTIONS.map(({ imageSrc }) => imageSrc),
  "/games/game-flow/sounds/fail.mp3",
  "/games/game-flow/sounds/game-over.mp3",
  "/games/game-flow/sounds/intermission.mp3",
  "/games/game-flow/sounds/results-and-main.mp3",
  "/games/game-flow/sounds/success.mp3",
];
