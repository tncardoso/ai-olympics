import { generateText, type LanguageModel } from "ai";
import { Referee } from "./referee";
import { BoardState } from "./board";

const QUESTION_PROMPT = `
You are playing a "Guess Who" game with another player. In this game your objective
is guess which person is your oponent's card. You can only ask yes or no questions relative
to the individuals, until only one is left. Your output should only have the desired question
that will help you isolate one individual.

## Instructions

- Your output should have only one question
- Do not add any additional information, only the question
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
    id: string;
    model: LanguageModel;
    // Agent's internal referee that only uses its model.
    // Used to choose which names should be excluded.
    referee: Referee;
    state: BoardState;
    questions: QeA[];

    constructor(id: string, model: LanguageModel, state: BoardState) {
        this.id = id;
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
        console.log(this.id + ": Updating state");
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
                    console.log(`${this.id}: Removing ${person.name}`)
                }
            }
        }
    }

    isFinished(): boolean {
        return this.state.isFinished();
    }
}