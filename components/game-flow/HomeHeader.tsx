import Image from "next/image";
import Link from "next/link";

export type HomeView = "home" | "howToPlay" | "microscope";
export type NavigationView = HomeView | "ranking";

const HOME_NAV_ITEMS = [
  { href: "/", label: "홈", view: "home" },
  { href: "/how-to-play", label: "게임 방법", view: "howToPlay" },
  { href: "/microscope", label: "도감", view: "microscope" },
  { href: "/ranking", label: "랭킹", view: "ranking" },
] as const;

export function HomeHeader({
  currentView,
  isStarting = false,
}: Readonly<{
  currentView: NavigationView;
  isStarting?: boolean;
}>) {
  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 ${
        isStarting ? "main-screen-exit-up" : ""
      }`}
    >
      <nav className="w-full bg-white/10 px-2 py-3 shadow-[0_0_28px_rgba(103,232,249,0.18)] backdrop-blur-xl sm:px-6">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <Link
            className="flex shrink-0 items-center gap-2 px-1 text-sm font-black tracking-normal text-cyan-50 drop-shadow-[0_0_12px_rgba(103,232,249,0.72)] sm:px-3 sm:text-base"
            href="/"
          >
            <Image
              alt=""
              aria-hidden="true"
              className="size-7 object-contain drop-shadow-[0_0_10px_rgba(103,232,249,0.5)]"
              height={28}
              src="/games/game-flow/images/timer.png"
              unoptimized
              width={28}
            />
            <span className="hidden sm:inline">캣타워 오르기</span>
          </Link>
          <div className="grid grid-cols-4 gap-1 rounded-md border border-white/10 bg-black/20 p-1">
            {HOME_NAV_ITEMS.map((item) => {
              const isActive = currentView === item.view;

              return (
                <Link
                  className={`rounded px-2 py-2 text-center text-[0.68rem] font-black transition sm:min-w-20 sm:px-3 sm:text-sm ${
                    isActive
                      ? "bg-cyan-100 text-black shadow-[0_0_18px_rgba(103,232,249,0.38)]"
                      : "text-cyan-50/78 hover:bg-white/10 hover:text-white"
                  }`}
                  href={item.href}
                  key={item.view}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}
