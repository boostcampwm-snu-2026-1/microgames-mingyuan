import { RANKING_LIMIT, type Ranking } from "@/lib/rankings";

export function RankingTable({
  rankings,
}: Readonly<{
  rankings: readonly Ranking[];
}>) {
  const emptyRankingCount = Math.max(RANKING_LIMIT - rankings.length, 0);

  return (
    <div className="overflow-hidden rounded-md border border-cyan-100/30 bg-black/38">
      {rankings.map((ranking, index) => (
        <div
          className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 border-b border-white/10 px-4 py-4 last:border-b-0 sm:grid-cols-[4rem_1fr_auto] sm:px-6"
          key={`${ranking.username}-${index}`}
        >
          <span className="text-center text-lg font-black text-cyan-100">
            {index + 1}
          </span>
          <span className="min-w-0 truncate font-black text-white">
            {ranking.username}
          </span>
          <span className="flex items-end gap-1 text-cyan-100">
            <strong className="text-2xl leading-none">{ranking.score}</strong>
            <span className="text-sm font-black">층</span>
          </span>
        </div>
      ))}
      {Array.from({ length: emptyRankingCount }, (_, index) => {
        const rankingPosition = rankings.length + index + 1;

        return (
          <div
            className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 border-b border-white/10 px-4 py-4 last:border-b-0 sm:grid-cols-[4rem_1fr_auto] sm:px-6"
            key={`empty-ranking-${rankingPosition}`}
          >
            <span className="text-center text-lg font-black text-cyan-100/35">
              {rankingPosition}
            </span>
            <span className="font-bold text-white/30">아직 기록 없음</span>
            <span className="pr-2 text-xl font-black text-cyan-100/25">-</span>
          </div>
        );
      })}
    </div>
  );
}
