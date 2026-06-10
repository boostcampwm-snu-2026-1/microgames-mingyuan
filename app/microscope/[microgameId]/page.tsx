import { notFound } from "next/navigation";
import { PracticeGameScreen } from "@/components/game-flow/PracticeGameScreen";
import { MICROGAMES } from "@/data/microgames";

export default async function MicrogamePracticePage({
  params,
}: Readonly<{
  params: Promise<{ microgameId: string }>;
}>) {
  const { microgameId } = await params;
  const microgame = MICROGAMES.find(
    (candidate) => candidate.id === microgameId,
  );

  if (!microgame) {
    notFound();
  }

  return <PracticeGameScreen microgame={microgame} />;
}
