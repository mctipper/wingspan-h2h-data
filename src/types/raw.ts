export type RawScore = Record<string, number>;

export interface RawGame {
  game_id: number;
  /**
   * Only present when scores are equal.
   * - "hubby" | "wifey" — tiebreaker determined a winner
   * - "draw"            — pure draw, no tiebreaker
   */
  drawResult?: "hubby" | "wifey" | "draw";
  players: {
    hubby: RawScore;
    wifey: RawScore;
  };
}

export type RawGameData = RawGame[];