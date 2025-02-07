import * as fs from "fs";
import { createCanvas, Image, loadImage } from "@napi-rs/canvas";
import type { BoardDescription } from "./model";

export interface PersonState {
    idx: number;
    name: string;
    active: boolean;
    image: Image;
}

export class BoardState {
    boardDescription: BoardDescription;
    myCard: string;
    myCardImage: Image | null;
    board: PersonState[];

    constructor(boardDescription: BoardDescription) {
        this.myCard = "";
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
        const filename = `static/guesswho/images/${name}.jpg`;
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
