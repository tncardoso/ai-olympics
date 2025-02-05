import * as fs from "fs";
import { createBoardDescription, createCard } from "$lib/guesswho/create";
import { type BoardDescription } from "$lib/guesswho/model";

async function createNewBoard(filename: string): Promise<BoardDescription> {
    const board = await createBoardDescription();
    fs.writeFile(filename, JSON.stringify(board), (err: any) => {
        if (err) {
            console.error("error creating file:");
            console.error(err);
        } else {
            console.log("created board.json");
        }
    });
    return board;
}

async function getBoard(): Promise<BoardDescription> {
    const filename = "static/guesswho/board.json";
    return await new Promise<BoardDescription>((resolve) => {
        fs.readFile(filename, async (err, data) => {
            if (err) {
                resolve(await createNewBoard(filename));
            } else {
                resolve(JSON.parse(data.toString()));
            }
        });
    });
}

async function createImages(board: BoardDescription) {
    for (var person of board.people) {
        const image = await createCard(person);
        const filename = `static/guesswho/${person.name}.jpg`;

        if (fs.existsSync(filename)) {
            console.log(`Image already exists: ${filename}`)
        } else {
            fs.writeFile(filename, image.uint8Array, (err) => {
                if (err) {
                    console.error(`Error writing ${filename}:`, err);
                } else {
                    console.log(`Successfully wrote ${filename}`);
                }
            });
        }
    }
}

async function main() {
    const board = await getBoard();
    await createImages(board);
}

main().catch(console.error);