import * as fs from "fs";
import { GuessWho } from "$lib/guesswho";
import { readBoard, type BoardDescription } from "$lib/guesswho/model";
import { Agent } from "$lib/guesswho/agent";
import { BoardState } from "$lib/guesswho/board";
import type { LanguageModel } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

function getAgent(board: BoardDescription, id: string): Agent | null {
    let model: LanguageModel | null = null;
    switch(id) {
        case "gpt-4o-mini": model = openai(id); break;
        case "claude-3-5-sonnet-20241022": model = anthropic(id); break;
    }
    if (model) {
        return new Agent(id, model, new BoardState(board));
    } else {
        return null;
    }
}

async function main() {
    const board = await readBoard();

    // Parse command line arguments
    const args = process.argv.slice(2);
    if (args.length !== 2) {
        console.error("Usage: play.js <modelA> <modelB>");
        console.error("Available models: gpt-4o-mini, claude-3-5-sonnet-20241022");
        process.exit(1);
    }

    const [modelA, modelB] = args;
    const playerA = getAgent(board, modelA);
    const playerB = getAgent(board, modelB);

    if (!playerA || !playerB) {
        console.error("Invalid model name(s). Available models: gpt-4o-mini, claude-3-5-sonnet-20241022");
        process.exit(1);
    }

    //const game = new GuessWho(board, claude_3_5_sonnet, gpt_4o_mini);
    const game = new GuessWho(board, playerA, playerB);
    await game.init();
    const replay = await game.run();
    console.log(replay);

    const filename = replay.date.toISOString()
        .replace("T","-")
        .replaceAll(":","-")
        .substring(0, 19)
        .replaceAll("-", "");
    fs.writeFile(`static/guesswho/runs/${filename}.json`, JSON.stringify(replay), console.error)
}

main().catch(console.error);

