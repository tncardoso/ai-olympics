import * as fs from "fs";
import { generateObject, generateText, type LanguageModel } from "ai";
import { openai } from "@ai-sdk/openai";
import { createCanvas, Image, loadImage } from "@napi-rs/canvas";
import { z } from "zod";
import type { BoardDescription, PersonDescription } from "./model";
import { Referee } from "./referee";

interface PersonState {
    idx: number;
    name: string;
    active: boolean;
    image: Image;
}

class BoardState {
    boardDescription: BoardDescription;
    myCard: string;
    myCardImage: Image | null;
    board: PersonState[];

    constructor(myCard: string, boardDescription: BoardDescription) {
        this.myCard = myCard;
        this.myCardImage = null;
        this.boardDescription = boardDescription;
        this.board = [];
    }

    async init() {
        this.board = [];
        for (const [idx, person] of this.boardDescription.people.entries()) {
            // I already know myCard is not possible for the adversary
            const state = person.name == this.myCard ? false : true;
            const personState: PersonState = {
                idx: idx,
                name: person.name,
                active: state,
                image: await this.loadImage(person.name),
            }
            if (person.name == this.myCard) {
                this.myCardImage = personState.image;
            }
            this.board.push(personState);
        }
        //console.log(this.board);
    }

    boardActive(): PersonState[] {
        let result: PersonState[] = [];
        for (var person of this.board) {
            if (person.active) {
                result.push(person);
            }
        }
        return result;
    }

    isFinished(): boolean {
        return this.boardActive().length == 1;
    }

    async loadImage(name: string): Promise<Image> {
        const filename = `static/guesswho/${name}.jpg`;
        return await loadImage(filename);
    }

    // Assemble board image for agent inspection.
    // 4 rows x 6 columns grid
    async boardImage(): Promise<Buffer> {
        const ROWS = 4;
        const COLUMNS = 6;
        const GUTTER = 12;
        const IMAGE_WIDTH = 896 / 4;
        const IMAGE_HEIGHT = 1088 / 4;
        const NAME_HEIGHT = 20;
        const canvasWidth = (IMAGE_WIDTH * COLUMNS) + GUTTER * (COLUMNS + 1);
        const canvasHeight = (IMAGE_HEIGHT * ROWS) + GUTTER * (ROWS + 1);

        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext("2d")

        for (const [idx, person] of this.board.entries()) {
            const row = Math.floor(idx / COLUMNS);
            const col = idx % COLUMNS;
            const x = GUTTER * (col + 1) + IMAGE_WIDTH * col;
            const y = GUTTER * (row + 1) + IMAGE_HEIGHT * row;
            //console.log(row, col, x, y);

            if (person.active) {
                // this person was not excluded yet
                ctx.drawImage(person.image, x, y, IMAGE_WIDTH, IMAGE_HEIGHT);
                const xName = x + (IMAGE_WIDTH / 2);
                const yName = y + IMAGE_HEIGHT - NAME_HEIGHT;
                ctx.fillStyle = "yellow";
                ctx.fillRect(x, yName, IMAGE_WIDTH, NAME_HEIGHT);
                ctx.font = "bold 18px";
                ctx.fillStyle = "black";
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                ctx.fillText(person.name, xName, yName + 2);
            } else {
                // this person was already excluded
                ctx.fillStyle = "red";
                ctx.fillRect(x, y, IMAGE_WIDTH, IMAGE_HEIGHT);
            }
        }
        
        const data = await canvas.encode("jpeg");
        await fs.writeFile(this.myCard + "_status.jpg", data, console.error);
        //return await canvas.toDataURL("image/jpeg");
        return data;
    }
}

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

const QUESTION_PROMPT = `
You are playing a "Guess Who" game with another player. In this game your objective
is guess which person is your oponent's card. You can only ask yes or no questions relative
to the individuals, until only one is left. Your output should only have the desired question
that will help you isolate one individual.

## Instructions

- Your output should have only one question
- Your question should eliminate the largest number of individuals possible

## Example questions

- Is this person old?
- Is this person wearing a hat?
- Does this person have a moustache?
- Is this person bald?

## Previous questions
`;

interface QeA {
    question: string;
    answer: boolean;
}

export class Agent {
    name: string;
    model: LanguageModel;
    // Agent's internal referee that only uses its model.
    // Used to choose which names should be excluded.
    referee: Referee;
    state: BoardState;
    questions: QeA[];

    constructor(name: string, model: LanguageModel, state: BoardState) {
        this.name = name;
        this.model = model;
        this.referee = new Referee([this.model]);
        this.state = state;
        this.questions = [];
    }

    async init() {
        this.questions = [];
        await this.state.init();
    }

    async chooseQuestion(): Promise<string> {
        let prompt: string = QUESTION_PROMPT;

        for (var qa of this.questions) {
            prompt += "- " + qa.question + " : " + qa.answer + "\n";
        }

        const image = await this.state.boardImage();
        const result = await generateText({
            model: this.model,
            messages: [
                {role: "user", content: [
                    {type: "text", text: prompt },
                    {type: "image", image: image},
                ]}
            ],
        });
        const question = await result.text;
        return question;
    }

    async updateState(question: string, answer: boolean) {
        console.log(this.name + ": Updating state");
        this.questions.push({ question: question, answer: answer });
        for (const [idx, person] of this.state.board.entries()) {
            if (person.active) {
                const ans = await this.referee.answer(person.name, person.image, question);
                console.log("checking "+person.name + " " + ans);
                if (ans == answer) {
                    // the opponent answer is the same for this person, keep active
                } else {
                    // since this is not we are looking for, deactivate
                    this.state.board[idx].active = false;
                    console.log(`${this.name}: Removing ${person.name}`)
                }
            }
        }
    }

    isFinished(): boolean {
        return this.state.isFinished();
    }
}

interface GameResult {
    winner: string;
    reason: "WIN" | "WRONG_GUESS" | "MAX_TURNS_REACHED";
}

export class GuessWho {
    board: BoardDescription;
    playerA: Agent;
    playerB: Agent;
    referee: Referee;
    // Index of current player. Number because we could create a team match.
    current: number;

    constructor(board: BoardDescription) {
        // create board and player states
        this.board = board;
        // start with playerA
        this.current = 0;
        // choose each player cards
        const cards = getRandomCards(board.people.length);

        // create a referee with multiple models to vote
        this.referee = new Referee([
            openai("gpt-4-turbo"),
        ]);

        // create state for each player
        this.playerA = new Agent(
            "Joao",
            openai("gpt-4-turbo"),
            new BoardState(board.people[cards[0]].name, board)
        );
        this.playerB = new Agent(
            "Pedro",
            openai("gpt-4-turbo"),
            new BoardState(board.people[cards[1]].name, board)
        );
    }

    async init() {
        this.current = 0;
        await this.playerA.init();
        console.log(this.playerA.name + ": CARD " + this.playerA.state.myCard);
        await this.playerB.init();
        console.log(this.playerB.name + ": CARD " + this.playerB.state.myCard);
    }

    async turn(askPlayer: Agent, ansPlayer: Agent) {
        const question = await askPlayer.chooseQuestion();
        // the referee is used for answering to avoid errors
        console.log(askPlayer.name + ": " + question);
        const answer = await this.referee.answer(ansPlayer.state.myCard, ansPlayer.state.myCardImage, question);
        console.log("Referee: " + answer);

        // update state for player that asked removing non compliant profiles
        await askPlayer.updateState(question, answer);
        await askPlayer.state.boardImage();
    }

    async run(): Promise<GameResult> {
        const MAX_TURNS = 20;

        for (var i = 0; i < MAX_TURNS; i++) {
            const askPlayer = this.current == 0 ? this.playerA: this.playerB;
            const ansPlayer = this.current == 0 ? this.playerB: this.playerA;
            await this.turn(askPlayer, ansPlayer);

            if (askPlayer.isFinished()) {
                const guess = askPlayer.state.boardActive()[0];
                if (guess.name == ansPlayer.state.myCard) {
                    console.log("Referee: Finished! Winner is "+askPlayer.name);
                    return {
                        winner: askPlayer.name,
                        reason: "WIN",
                    }
                } else {
                    console.log("Referee: Finished! Wrong guess by "+askPlayer.name);
                    return {
                        winner: ansPlayer.name,
                        reason: "WRONG_GUESS",
                    }
                }
            }
        
            // Now change turns. Leaving this way so we can create a group version
            this.current = (this.current + 1) % 2
        }

        const winner = this.playerA.state.boardActive().length < this.playerB.state.boardActive().length ?
            this.playerA : this.playerB;

        return {
            winner: winner.name,
            reason: "MAX_TURNS_REACHED",
        }
    }
}