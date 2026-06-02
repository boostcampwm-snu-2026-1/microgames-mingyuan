const GAME_FLOW_STEPS = [
  "Start",
  "Instruction",
  "Play",
  "Result",
  "Next Round",
];

const SETUP_ITEMS = [
  "Next.js 16",
  "TypeScript",
  "Tailwind CSS",
  "ESLint",
  "Prettier",
  "Vercel",
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[#f7f4ed] text-[#1e1b18]">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-12 px-6 py-12 sm:px-10 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex rounded-full border border-[#1e1b18] bg-[#fffdf8] px-4 py-2 text-sm font-semibold">
              Web Microgame Project
            </div>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-black leading-none tracking-normal sm:text-6xl">
                빠르게 보고, 바로 반응하는 마이크로게임.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[#514942]">
                음악과 짧은 미션에 맞춰 여러 미니게임을 연속으로 플레이하는 웹
                기반 프로젝트입니다. 초기 개발 환경 설정이 완료되었습니다.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#ff4d2e] px-6 text-base font-bold text-white shadow-[4px_4px_0_#1e1b18] transition-transform hover:-translate-y-0.5"
                href="#flow"
              >
                게임 흐름 보기
              </a>
              <a
                className="inline-flex h-12 items-center justify-center rounded-md border-2 border-[#1e1b18] bg-[#fffdf8] px-6 text-base font-bold transition-transform hover:-translate-y-0.5"
                href="#setup"
              >
                설정 확인
              </a>
            </div>
          </div>

          <div
            className="rounded-lg border-2 border-[#1e1b18] bg-[#fffdf8] p-5 shadow-[8px_8px_0_#1e1b18]"
            aria-label="Microgame preview board"
          >
            <div className="mb-5 flex items-center justify-between border-b-2 border-[#1e1b18] pb-4">
              <span className="text-sm font-black uppercase tracking-wider">
                Round 01
              </span>
              <span className="rounded-full bg-[#2a9d8f] px-3 py-1 text-sm font-bold text-white">
                Ready
              </span>
            </div>
            <div className="grid aspect-square place-items-center rounded-md bg-[#ffd166] p-6 text-center">
              <div className="space-y-4">
                <p className="text-base font-bold uppercase tracking-wider">
                  Mission
                </p>
                <p className="text-4xl font-black leading-tight">
                  Press at the beat
                </p>
                <div className="mx-auto h-4 w-36 rounded-full border-2 border-[#1e1b18] bg-[#fffdf8]">
                  <div className="h-full w-2/3 rounded-full bg-[#ff4d2e]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section
            id="flow"
            className="rounded-lg border-2 border-[#1e1b18] bg-[#fffdf8] p-6"
          >
            <h2 className="mb-5 text-2xl font-black">Game Flow</h2>
            <ol className="grid gap-3 sm:grid-cols-5 lg:grid-cols-1">
              {GAME_FLOW_STEPS.map((step, index) => (
                <li
                  className="flex items-center gap-3 rounded-md bg-[#f7f4ed] px-4 py-3 font-bold"
                  key={step}
                >
                  <span className="grid size-8 place-items-center rounded-full bg-[#1e1b18] text-sm text-white">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>

          <section
            id="setup"
            className="rounded-lg border-2 border-[#1e1b18] bg-[#fffdf8] p-6"
          >
            <h2 className="mb-5 text-2xl font-black">Development Setup</h2>
            <div className="flex flex-wrap gap-3">
              {SETUP_ITEMS.map((item) => (
                <span
                  className="rounded-full border-2 border-[#1e1b18] bg-white px-4 py-2 text-sm font-bold"
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
