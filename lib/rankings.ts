export const RANKING_GAME_ID = "main";
export const RANKING_LIMIT = 10;
export const MAX_USERNAME_LENGTH = 20;

export type Ranking = Readonly<{
  score: number;
  username: string;
}>;
