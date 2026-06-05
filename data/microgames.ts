import type { FormInstruction } from "@/data/formInstructions";
import { FORM_INSTRUCTIONS } from "@/data/formInstructions";

export type MicrogameControl =
  | "arrowAndSpace"
  | "arrowKeys"
  | "koreanKeyboard"
  | "microphone"
  | "mouseClick"
  | "numberKeys"
  | "scroll"
  | "space"
  | "wasd";

export type MicrogameType = "boss" | "normal";
export type MicrogameCanvas =
  | "chromeDinoSpace"
  | "courseRegistrationNumber"
  | "default"
  | "superMarioCoins"
  | "undertaleMouse";

export type Microgame = Readonly<{
  beatCount: number;
  canvas: MicrogameCanvas;
  control: MicrogameControl;
  id: string;
  startPrompt: string;
  title: string;
  type: MicrogameType;
}>;

const FORM_INSTRUCTIONS_BY_CONTROL = {
  arrowAndSpace: FORM_INSTRUCTIONS[3],
  arrowKeys: FORM_INSTRUCTIONS[1],
  koreanKeyboard: FORM_INSTRUCTIONS[7],
  microphone: FORM_INSTRUCTIONS[8],
  mouseClick: FORM_INSTRUCTIONS[4],
  numberKeys: FORM_INSTRUCTIONS[6],
  scroll: FORM_INSTRUCTIONS[5],
  space: FORM_INSTRUCTIONS[0],
  wasd: FORM_INSTRUCTIONS[2],
} satisfies Record<MicrogameControl, FormInstruction>;

export const MICROGAMES = [
  {
    beatCount: 8,
    canvas: "superMarioCoins",
    control: "space",
    id: "super-mario-coin-count",
    startPrompt: "코인을 정확한 개수로 모아라!",
    title: "슈퍼 마리오",
    type: "normal",
  },

  {
    beatCount: 8,
    canvas: "chromeDinoSpace",
    control: "space",
    id: "jump-gap",
    startPrompt: "점프해라!",
    title: "점프",
    type: "normal",
  },

  {
    beatCount: 8,
    canvas: "undertaleMouse",
    control: "arrowKeys",
    id: "undertale-bone-dodge",
    startPrompt: "피해라!",
    title: "언더테일",
    type: "normal",
  },

  {
    beatCount: 12,
    canvas: "default",
    control: "scroll",
    id: "boss-overdrive-lift",
    startPrompt: "끌어올려라!",
    title: "보스 오버드라이브",
    type: "boss",
  },
] satisfies Microgame[];

const NORMAL_MICROGAMES = MICROGAMES.filter(
  (microgame) => microgame.type === "normal",
);
const BOSS_MICROGAMES = MICROGAMES.filter(
  (microgame) => microgame.type === "boss",
);

function getSeededMicrogameIndex(
  roundNumber: number,
  sessionSeed: number,
  poolSize: number,
) {
  const seed = Math.sin((roundNumber + 1) * 9301 + sessionSeed * 49297);
  const normalizedSeed = seed - Math.floor(seed);

  return Math.floor(normalizedSeed * poolSize);
}

export function isBossMicrogameRound(roundNumber: number) {
  return roundNumber > 1 && (roundNumber - 1) % 12 === 0;
}

export function getMicrogamePoolForRound(roundNumber: number) {
  return isBossMicrogameRound(roundNumber)
    ? BOSS_MICROGAMES
    : NORMAL_MICROGAMES;
}

export function getMicrogameForRound(roundNumber: number, sessionSeed: number) {
  const microgamePool = getMicrogamePoolForRound(roundNumber);

  return microgamePool[
    getSeededMicrogameIndex(roundNumber, sessionSeed, microgamePool.length)
  ];
}

export function getMicrogameFormInstruction(microgame: Microgame) {
  return FORM_INSTRUCTIONS_BY_CONTROL[microgame.control];
}

export function isMicrogameClearKey(
  control: MicrogameControl,
  event: KeyboardEvent,
) {
  if (control === "arrowKeys") {
    return ["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp"].includes(
      event.key,
    );
  }

  if (control === "space") {
    return event.code === "Space";
  }

  if (control === "wasd") {
    return ["a", "d", "s", "w"].includes(event.key.toLowerCase());
  }

  if (control === "arrowAndSpace") {
    return (
      event.code === "Space" ||
      ["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp"].includes(event.key)
    );
  }

  if (control === "numberKeys") {
    return /^\d$/.test(event.key);
  }

  if (control === "koreanKeyboard") {
    return /^[ㄱ-ㅎㅏ-ㅣ가-힣]$/.test(event.key);
  }

  if (control === "microphone") {
    return event.key.length > 0;
  }

  return false;
}
