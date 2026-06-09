"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useScoreSubmission } from "@/hooks/useScoreSubmission";
import { MAX_USERNAME_LENGTH } from "@/lib/rankings";

function getStatusMessage(
  status: ReturnType<typeof useScoreSubmission>["status"],
) {
  if (status === "submitting") {
    return "최고 기록을 전송하는 중입니다.";
  }

  if (status === "submitted") {
    return "최고 기록이 랭킹에 등록되었습니다.";
  }

  if (status === "skipped") {
    return "이미 전송한 최고 기록보다 높을 때만 갱신됩니다.";
  }

  return "닉네임은 이 브라우저에 저장되며 최고 기록만 전송됩니다.";
}

export function ScoreSubmissionPanel({
  score,
}: Readonly<{
  score: number;
}>) {
  const { errorMessage, isReady, setUsername, status, submitScore, username } =
    useScoreSubmission(score);
  const isSubmitting = status === "submitting";

  const submitUsername = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitScore(username);
  };

  return (
    <div className="mx-auto mb-6 max-w-xl rounded-md border border-cyan-100/35 bg-black/45 p-4 text-left">
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={submitUsername}
      >
        <label className="min-w-0 flex-1">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
            랭킹 닉네임
          </span>
          <input
            className="mt-2 min-h-11 w-full rounded-md border border-white/30 bg-black/65 px-3 font-bold text-white outline-none transition placeholder:text-white/35 focus:border-cyan-100"
            disabled={!isReady || isSubmitting}
            maxLength={MAX_USERNAME_LENGTH}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="닉네임 입력"
            type="text"
            value={username}
          />
        </label>
        <button
          className="min-h-11 rounded-md border border-cyan-200 bg-cyan-200 px-4 font-black text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
          disabled={!isReady || isSubmitting}
          type="submit"
        >
          {isSubmitting ? "전송 중" : "기록 전송"}
        </button>
      </form>
      <div className="mt-3 flex flex-col gap-2 text-sm font-bold sm:flex-row sm:items-center sm:justify-between">
        <p className={errorMessage ? "text-red-100" : "text-cyan-50/68"}>
          {errorMessage ?? getStatusMessage(status)}
        </p>
        <Link
          className="shrink-0 font-black text-cyan-100 underline decoration-cyan-100/45 underline-offset-4 hover:text-white"
          href="/ranking"
        >
          Top 10 보기
        </Link>
      </div>
    </div>
  );
}
