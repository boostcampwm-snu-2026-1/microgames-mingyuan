export type FormInstruction = Readonly<{
  alt: string;
  description: string;
  imageSrc: string;
  title: string;
}>;

export const FORM_INSTRUCTIONS = [
  {
    alt: "Space key control form",
    description: "스페이스 입력 타이밍을 박자에 맞춰 성공시키세요.",
    imageSrc: "/games/forms/images/space.png",
    title: "스페이스",
  },
  {
    alt: "Arrow keys control form",
    description: "방향키 입력을 화면 지시에 맞춰 빠르게 처리하세요.",
    imageSrc: "/games/forms/images/arrow-keys.png",
    title: "방향키",
  },
  {
    alt: "WASD keys control form",
    description: "WASD 입력을 화면 지시에 맞춰 빠르게 처리하세요.",
    imageSrc: "/games/forms/images/wasd.png",
    title: "WASD",
  },
  {
    alt: "Arrow keys and space key control form",
    description: "방향키와 스페이스 입력을 함께 처리하세요.",
    imageSrc: "/games/forms/images/arrow-and-space.png",
    title: "방향키 + 스페이스",
  },
  {
    alt: "Mouse control form",
    description: "마우스 조작을 박자 안에 정확히 완료하세요.",
    imageSrc: "/games/forms/images/mouse.png",
    title: "마우스",
  },
  {
    alt: "Scroll control form",
    description: "스크롤 조작을 제한 시간 안에 정확히 완료하세요.",
    imageSrc: "/games/forms/images/scroll.png",
    title: "스크롤",
  },
  {
    alt: "Number keys control form",
    description: "숫자키를 확인하고 제한 시간 안에 입력하세요.",
    imageSrc: "/games/forms/images/number-keys.png",
    title: "숫자키",
  },
  {
    alt: "Korean keyboard control form",
    description: "한글 키 입력을 리듬에 맞춰 처리하세요.",
    imageSrc: "/games/forms/images/korean-keyboard.png",
    title: "한글 타자",
  },
  {
    alt: "Microphone control form",
    description: "마이크 입력을 필요한 순간에 맞춰 사용하세요.",
    imageSrc: "/games/forms/images/microphone.png",
    title: "마이크",
  },
] satisfies FormInstruction[];
