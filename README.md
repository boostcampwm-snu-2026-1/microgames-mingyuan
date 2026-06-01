# Web Microgame Project

음악과 리듬에 맞춰 짧은 미션형 미니게임이 연속으로 등장하는 웹 기반 마이크로게임 프로젝트입니다.
각 라운드마다 서로 다른 조작법과 게임 규칙이 빠르게 제시되며, 플레이어는 제한 시간 안에 즉각적으로 반응해야 합니다.

## Overview

이 프로젝트는 WarioWare류의 짧고 빠른 마이크로게임 경험을 웹에서 구현하는 것을 목표로 합니다.

게임은 다음과 같은 흐름으로 진행됩니다.

1. 음악과 함께 게임 시작
2. 랜덤 마이크로게임 선택
3. 짧은 조작 안내 표시
4. 제한 시간 내 미션 수행
5. 성공 / 실패 판정
6. 다음 마이크로게임으로 전환
7. 난이도 및 속도 점진 증가

## Key Features

- 랜덤 마이크로게임 진행
- 음악 BPM 또는 타이밍에 맞춘 게임 전환
- 짧고 직관적인 조작 안내
- 키보드 / 마우스 기반 입력
- 게임별 독립적인 상태 관리
- 빠른 에셋 로딩을 위한 사전 로드 구조
- Next.js 기반 웹 배포
- Vercel 배포 최적화

## Tech Stack

- **Framework**: Next.js
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **State Management**: React state / custom hooks
- **Asset Handling**: Next.js static assets, preloading strategy

## Project Structure

```bash
.
├── public/
│   ├── images/
│   ├── sounds/
│   └── games/
├── src/
│   ├── app/
│   ├── components/
│   ├── games/
│   │   ├── GameA/
│   │   ├── GameB/
│   │   └── GameC/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── styles/
├── README.md
└── package.json
```

## Microgame Design

각 마이크로게임은 독립적인 모듈로 관리됩니다.

하나의 마이크로게임은 다음 요소를 가집니다.

```ts
type Microgame = {
  id: string;
  title: string;
  instruction: string;
  duration: number;
  preloadAssets?: string[];
  start: () => void;
  update?: () => void;
  end: () => void;
};
```

## Game Flow

```txt
Start
  ↓
Preload Assets
  ↓
Select Random Microgame
  ↓
Show Instruction
  ↓
Play Microgame
  ↓
Check Success / Failure
  ↓
Next Round
  ↓
Game Over
```

## Asset Preloading

웹 환경에서는 이미지와 사운드 로딩 지연이 게임 경험을 크게 해칠 수 있습니다.
따라서 게임 시작 전에 주요 에셋을 미리 로드합니다.

- 자주 등장하는 이미지 선로딩
- 사운드 파일 선로딩
- 다음 후보 게임의 에셋 미리 준비
- 로딩 실패 시 fallback 처리

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run development server

```bash
npm run dev
```

### 3. Open browser

```bash
http://localhost:3000
```

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build production bundle
npm run start    # Start production server
npm run lint     # Run lint
```

## Development Notes

- 각 마이크로게임은 가능한 한 독립적인 컴포넌트로 작성합니다.
- 게임 간 공유 상태는 최소화합니다.
- 입력 처리, 타이머, 성공/실패 판정은 공통 hook으로 분리합니다.
- 이미지와 사운드는 게임 시작 전에 preload합니다.
- 랜덤 게임 선택 시 같은 게임이 지나치게 반복되지 않도록 history를 관리합니다.
- 게임 전환 애니메이션은 짧고 명확하게 유지합니다.

## Roadmap

- [ ] 기본 게임 루프 구현
- [ ] 마이크로게임 등록 시스템 구현
- [ ] 에셋 프리로딩 구현
- [ ] 음악 타이밍 기반 라운드 전환
- [ ] 점수 및 콤보 시스템
- [ ] 난이도 증가 시스템
- [ ] 게임 오버 화면
- [ ] 모바일 입력 대응
- [ ] 애니메이션 강화
- [ ] 사운드 이펙트 추가

## License

This project is for educational and experimental purposes.
