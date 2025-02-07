import type { BoardDescription, PersonDescription } from "./model";
import { BoardState, type PersonState } from "./board";
import { Agent } from "./agent";
import { List } from "immutable";

export interface GameResult {
    winner: string;
    reason: "WIN" | "WRONG_GUESS" | "MAX_TURNS_REACHED";
}

export interface ReplayTurn {
    playerID: string;
    playerQuestion: string;
    refereeAnswer: boolean;
    playerUpdatedState: List<PersonState>;
}

export interface Replay {
    id: string;
    date: Date;
    board: BoardDescription,
    playerA: string;
    playerB: string;
    playerACard: string;
    playerBCard: string;
    result: GameResult;
    turns: ReplayTurn[];
}
