import * as fs from "fs";

export interface BoardDescription {
    people: PersonDescription[];
}

export interface PersonDescription {
    name: string;
    description: string;
}

export async function readBoard(): Promise<BoardDescription> {
    const filename = "static/guesswho/board.json";
    const data = await fs.promises.readFile(filename, "utf-8");
    return JSON.parse(data) as BoardDescription;
}