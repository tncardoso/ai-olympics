import type { PersonState } from "$lib/guesswho/board";

export interface Message {
    player: string;
    position: "A" | "B" | "Referee";
    content: string;
    state: PersonState[] | undefined
}