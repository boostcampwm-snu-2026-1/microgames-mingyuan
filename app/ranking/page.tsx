import { HomeHeader } from "@/components/game-flow/HomeHeader";
import { NeonShell } from "@/components/game-flow/NeonShell";
import { RankingTable } from "@/components/ranking/RankingTable";
import { getTopRankings } from "@/lib/supabase/rankings";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const rankingResult = await getTopRankings()
    .then((rankings) => ({ error: null, rankings }))
    .catch((error: unknown) => {
      console.error(error);
      return {
        error: "랭킹을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        rankings: [],
      };
    });

  return (
    <NeonShell>
      <HomeHeader currentView="ranking" />
      <div className="mx-auto mt-16 w-full max-w-3xl rounded-lg border border-cyan-100/70 bg-black/60 p-5 shadow-[0_0_32px_rgba(103,232,249,0.18)] backdrop-blur-sm sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-100">
            Top 10
          </p>
          <h1 className="mt-3 text-4xl font-black text-white drop-shadow-[0_0_16px_rgba(103,232,249,0.58)] sm:text-5xl">
            캣타워 랭킹
          </h1>
          <p className="mt-3 text-sm font-bold text-cyan-50/68">
            플레이어별 최고 기록만 표시됩니다.
          </p>
        </div>
        {rankingResult.error ? (
          <div className="rounded-md border border-red-200/35 bg-red-950/30 px-5 py-8 text-center font-bold text-red-100">
            {rankingResult.error}
          </div>
        ) : (
          <RankingTable rankings={rankingResult.rankings} />
        )}
      </div>
    </NeonShell>
  );
}
