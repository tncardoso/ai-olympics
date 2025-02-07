import { Rating } from "ts-trueskill";

export class GuessWhoStats {
    wins: number;
    matches: number;
    playerAMatches: number;
    playerBMatches: number;
    playerAWins: number;
    playerBWins: number;
    averageTurns: number;

    constructor() {
        this.wins = 0;
        this.matches = 0;
        this.playerAMatches = 0;
        this.playerBMatches = 0;
        this.playerAWins = 0;
        this.playerBWins = 0;
        this.averageTurns = 0;
    }
}

export interface RankingEntry {
    model: string;
    ranking: number;
    trueskill: Rating;
    stats: GuessWhoStats;
}

export interface Ranking {
    task: string;
    ranking: RankingEntry[];
}