"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import type { Microgame } from "@/data/microgames";
import {
  type PokemonCardSlot,
  usePokemonTcgPocketGame,
} from "@/games/usePokemonTcgPocketGame";

const SLOT_CLASS =
  "relative flex items-center justify-center rounded-[clamp(.6rem,1.2vw,1rem)] border-2 border-white/45 bg-white/12 shadow-[inset_0_0_28px_rgba(255,255,255,0.14),0_12px_28px_rgba(8,20,45,0.22)]";
const CARD_FRAME_CLASS = "aspect-[100/139] w-[clamp(7rem,23vmin,15rem)]";

function CardImage({
  imageSrc,
  label,
}: Readonly<{ imageSrc: string; label: string }>) {
  return (
    <Image
      alt={`${label} 타입 카드`}
      className="h-full w-full select-none object-contain drop-shadow-[0_12px_12px_rgba(5,12,28,0.4)]"
      draggable={false}
      fill
      priority
      sizes="180px"
      src={imageSrc}
      unoptimized
    />
  );
}

function BattleSlot({
  children,
  hasCard,
  isDragging,
  label,
  slot,
}: Readonly<{
  children?: ReactNode;
  hasCard: boolean;
  isDragging: boolean;
  label: string;
  slot: PokemonCardSlot;
}>) {
  return (
    <div
      className={`${CARD_FRAME_CLASS} ${SLOT_CLASS} ${
        hasCard
          ? "border-white/55"
          : isDragging
            ? "animate-[pokemon-battle-slot-drag_620ms_ease-in-out_infinite] border-yellow-200 bg-yellow-200/25"
            : "animate-[pokemon-battle-slot-pulse_1.25s_ease-in-out_infinite] border-cyan-100 bg-cyan-100/20"
      }`}
      data-card-slot={slot}
    >
      {!hasCard ? (
        <>
          <div className="pointer-events-none absolute -inset-5 -z-10 rounded-[1.8rem] bg-cyan-300/20 blur-xl" />
          <div className="pointer-events-none absolute -top-16 flex flex-col items-center text-white drop-shadow-[0_3px_8px_rgba(0,0,0,.7)]">
            <span className="animate-bounce text-[clamp(1.8rem,4vmin,3rem)] leading-none">
              ↓
            </span>
            <span className="mt-1 whitespace-nowrap rounded-full border border-white/70 bg-slate-950/80 px-4 py-1 text-[clamp(0.75rem,1.5vmin,1rem)] font-black tracking-[0.12em]">
              여기에 놓기
            </span>
          </div>
          <span className="text-center text-[clamp(0.75rem,1.5vmin,1rem)] font-black tracking-[0.12em] text-white/75">
            {label}
          </span>
        </>
      ) : null}
      {children}
    </div>
  );
}

function BenchSlot({ label }: Readonly<{ label: string }>) {
  return (
    <div className={`${CARD_FRAME_CLASS} ${SLOT_CLASS}`}>
      <span className="absolute -top-6 text-[clamp(0.6rem,1vw,0.8rem)] font-black tracking-[0.12em] text-white/75">
        {label}
      </span>
    </div>
  );
}

export function PokemonTcgPocketGame({
  microgame,
}: Readonly<{ microgame: Microgame }>) {
  const {
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
  } = usePokemonTcgPocketGame();

  const renderPlacedCard = (slot: PokemonCardSlot) =>
    placedCard && placedSlot === slot ? (
      <div className="absolute inset-0 animate-[pokemon-card-place_380ms_cubic-bezier(.2,.9,.25,1.15)]">
        <CardImage imageSrc={placedCard.imageSrc} label={placedCard.label} />
      </div>
    ) : null;

  return (
    <div
      aria-label={microgame.startPrompt}
      className="relative h-screen w-screen touch-none select-none overflow-hidden bg-[radial-gradient(circle_at_50%_15%,#60a5fa_0%,#2563eb_30%,#102a68_68%,#07142f_100%)]"
      onPointerCancel={handlePointerCancel}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      ref={containerRef}
    >
      <style>{`
        @keyframes pokemon-card-place {
          0% { opacity: .65; transform: translateY(-20px) scale(1.2) rotate(-4deg); }
          55% { transform: translateY(4px) scale(.94) rotate(1deg); }
          100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); }
        }
        @keyframes pokemon-card-deal {
          0% { opacity: 0; transform: translateY(150%) scale(.72) rotate(-18deg); }
          58% { opacity: 1; transform: translateY(-9%) scale(1.06) rotate(3deg); }
          100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); }
        }
        @keyframes pokemon-battle-slot-pulse {
          0%, 100% { box-shadow: inset 0 0 28px rgba(255,255,255,.16), 0 0 18px rgba(103,232,249,.42), 0 14px 32px rgba(8,20,45,.28); }
          50% { box-shadow: inset 0 0 42px rgba(255,255,255,.3), 0 0 42px rgba(103,232,249,.88), 0 18px 38px rgba(8,20,45,.36); }
        }
        @keyframes pokemon-battle-slot-drag {
          0%, 100% { box-shadow: inset 0 0 36px rgba(254,249,195,.3), 0 0 30px rgba(250,204,21,.72); }
          50% { box-shadow: inset 0 0 52px rgba(255,255,255,.48), 0 0 58px rgba(250,204,21,1); }
        }
      `}</style>

      <div className="absolute left-1/2 top-[4%] z-20 -translate-x-1/2 rounded-full border-2 border-white/70 bg-slate-950/75 px-7 py-3 text-center shadow-[0_0_30px_rgba(255,255,255,0.24)] backdrop-blur">
        <p className="text-[clamp(0.7rem,1.1vw,0.95rem)] font-bold tracking-[0.22em] text-blue-200">
          TARGET TYPE
        </p>
        <p
          className="mt-1 text-[clamp(1.25rem,2.3vw,2rem)] font-black"
          style={{ color: target.color }}
        >
          {target.label}
        </p>
      </div>

      <div className="absolute left-1/2 top-[12%] h-[66%] w-[min(96vw,1120px)] -translate-x-1/2 rounded-[2.5rem] border-4 border-cyan-100/45 bg-[linear-gradient(180deg,rgba(147,197,253,.35),rgba(15,118,110,.28))] shadow-[0_24px_60px_rgba(0,0,0,.32),inset_0_0_50px_rgba(255,255,255,.12)]">
        <div className="absolute left-1/2 top-[48%] z-20 -translate-x-1/2 -translate-y-1/2">
          <BattleSlot
            hasCard={placedCard !== null}
            isDragging={drag !== null}
            label="배틀 슬롯"
            slot="active"
          >
            {renderPlacedCard("active")}
          </BattleSlot>
        </div>
        <div className="absolute left-1/2 top-[132%] z-0 flex min-w-max -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-[clamp(1rem,2.5vw,2rem)] opacity-[.5]">
          {[1, 2, 3].map((benchNumber) => (
            <BenchSlot key={benchNumber} label={`벤치 ${benchNumber}`} />
          ))}
        </div>
      </div>

      <div className="absolute bottom-[-14%] left-1/2 h-[48%] w-[min(120vw,1280px)] -translate-x-1/2">
        {cards.map((card, index) => {
          const centerIndex = (cards.length - 1) / 2;
          const offset = index - centerIndex;
          const isPlaced = placedCard?.id === card.id;
          const isDragging = drag?.card.id === card.id;

          if (isPlaced || isDragging) {
            return null;
          }

          return (
            <button
              aria-label={`${card.label} 타입 카드 내기`}
              className={`${CARD_FRAME_CLASS} absolute bottom-0 left-1/2 origin-bottom cursor-grab border-0 bg-transparent p-0 transition-transform duration-150 hover:-translate-y-5 active:cursor-grabbing`}
              key={card.id}
              onPointerDown={(event) => handlePointerDown(event, card)}
              style={{
                marginLeft: `${offset * 7.6}%`,
                transform: `translateX(-50%) rotate(${offset * 8}deg) translateY(${Math.abs(offset) * 8}px)`,
                zIndex: 20 + index,
              }}
              type="button"
            >
              <div
                className="absolute inset-0 animate-[pokemon-card-deal_420ms_cubic-bezier(.18,.85,.24,1.08)] [animation-fill-mode:both]"
                style={{ animationDelay: `${index * 85}ms` }}
              >
                <CardImage imageSrc={card.imageSrc} label={card.label} />
              </div>
            </button>
          );
        })}
      </div>

      {drag ? (
        <div
          className={`${CARD_FRAME_CLASS} pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-1/2 scale-110`}
          style={{ left: drag.x, top: drag.y }}
        >
          <CardImage imageSrc={drag.card.imageSrc} label={drag.card.label} />
        </div>
      ) : null}
    </div>
  );
}
