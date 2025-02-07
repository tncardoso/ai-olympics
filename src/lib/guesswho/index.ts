import * as fs from "fs";
import { generateObject, generateText, type LanguageModel } from "ai";
import { openai } from "@ai-sdk/openai";
import { createCanvas, Image, loadImage } from "@napi-rs/canvas";
import { z } from "zod";
import type { BoardDescription, PersonDescription } from "./model";
import type { Replay, ReplayTurn, GameResult } from "./replay";
import { Referee } from "./referee";
import { BoardState, type PersonState } from "./board";
import { Agent } from "./agent";
import { List } from "immutable";
import crypto from "crypto";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from '@ai-sdk/google';

function getRandomInt(max: number): number {
    return Math.floor(Math.random() * max);
}

// Return two different cards, one for each player
function getRandomCards(max: number): [number, number] {
    const cardA = getRandomInt(max);
    let cardB: number;
    do {
        cardB = getRandomInt(max);
    } while (cardA == cardB);
    return [cardA, cardB];
}

export class GuessWho {
    board: BoardDescription;
    playerA: Agent;
    playerB: Agent;
    referee: Referee;
    turns: ReplayTurn[];
    // Index of current player. Number because we could create a team match.
    current: number;

    constructor(board: BoardDescription, playerA: Agent, playerB: Agent) {
        // create board and player states
        this.board = board;
        this.turns = [];
        // start with playerA
        this.current = 0;

        // create a referee with multiple models to vote
        this.referee = new Referee([
            openai("gpt-4o"),
            anthropic("claude-3-5-sonnet-20241022"),
            google("gemini-2.0-flash-exp"),
        ]);

        this.playerA = playerA;
        this.playerB = playerB;
    }

    async init() {
        this.current = 0;
        this.turns = [];

        // choose each player cards
        const cards = getRandomCards(this.board.people.length);
        this.playerA.state.myCard = this.board.people[cards[0]].name;
        this.playerB.state.myCard = this.board.people[cards[1]].name;

        await this.playerA.init();
        console.log(this.playerA.id + ": CARD " + this.playerA.state.myCard);
        await this.playerB.init();
        console.log(this.playerB.id + ": CARD " + this.playerB.state.myCard);
    }

    copyState(people: PersonState[]): List<PersonState> {
        return List(people.map(person => ({
            idx: person.idx,
            name: person.name,
            active: person.active,
            image: person.image
        })));
    }

    async turn(askPlayer: Agent, ansPlayer: Agent) {
        const question = await askPlayer.chooseQuestion();
        // the referee is used for answering to avoid errors
        console.log(askPlayer.id + ": " + question);
        const answer = await this.referee.answer(ansPlayer.state.myCard, ansPlayer.state.myCardImage, question);
        console.log("Referee: " + answer);

        // update state for player that asked removing non compliant profiles
        await askPlayer.updateState(question, answer);
        await askPlayer.state.boardImage();

        // save replay turn
        const turn: ReplayTurn = {
            playerID: askPlayer.id,
            playerQuestion: question,
            refereeAnswer: answer,
            playerUpdatedState: this.copyState(askPlayer.state.board),
        };
        this.turns.push(turn);
    }

    async run(): Promise<Replay> {
        const MAX_TURNS = 24;

        let result: GameResult | null = null;
        for (var i = 0; i < MAX_TURNS; i++) {
            const askPlayer = this.current == 0 ? this.playerA: this.playerB;
            const ansPlayer = this.current == 0 ? this.playerB: this.playerA;
            await this.turn(askPlayer, ansPlayer);

            if (askPlayer.isFinished()) {
                const guess = askPlayer.state.boardActive()[0];
                if (guess.name == ansPlayer.state.myCard) {
                    console.log("Referee: Finished! Winner is "+askPlayer.id);
                    result = {
                        winner: askPlayer.id,
                        reason: "WIN",
                    }
                } else {
                    console.log("Referee: Finished! Wrong guess by "+askPlayer.id);
                    result = {
                        winner: ansPlayer.id,
                        reason: "WRONG_GUESS",
                    }
                }
                break
            }
        
            // Now change turns. Leaving this way so we can create a group version
            this.current = (this.current + 1) % 2
        }

        if (!result) {
            const winner = this.playerA.state.boardActive().length < this.playerB.state.boardActive().length ?
                this.playerA : this.playerB;
            result = {
                winner: winner.id,
                reason: "MAX_TURNS_REACHED",
            }
        }

        const date = new Date();
        const id = date.toISOString()
        .replace("T","-")
        .replaceAll(":","-")
        .substring(0, 19)
        .replaceAll("-", "");
        const replay: Replay = {
            id: id,
            date: date,
            board: this.board,
            playerA: this.playerA.id,
            playerB: this.playerB.id,
            playerACard: this.playerA.state.myCard,
            playerBCard: this.playerB.state.myCard,
            result: result,
            turns: this.turns,
        };
        return replay;
    }
}