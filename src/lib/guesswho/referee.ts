import * as fs from "fs";
import { generateText, type LanguageModel } from "ai";
import { createCanvas, Image, loadImage } from "@napi-rs/canvas";

const REFEREE_PROMPT = `
Answer the following yes or no question for the provided image. Only output
"yes" or "no" without additional content or quotes. This person name is `;

export class Referee {
    models: LanguageModel[];

    constructor(models: LanguageModel[]) {
        this.models = models;
    }

    async modelAnswer(model: LanguageModel, name: string, personImage: Buffer, question: string): Promise<boolean> {
        const prompt = REFEREE_PROMPT + name + "\n\nQuestion:\n" + question;
        const result = await generateText({
            model: model,
            messages: [
                {role: "user", content: [
                    {type: "text", text: prompt },
                    {type: "image", image: personImage },
                ]}
            ]
        });

        //console.log(`Referee(${model.modelId}) = ${result.text}`);
        if (result.text.trim() == "yes") {
            return true;
        } else if (result.text.trim() == "no") {
            return false;
        } else {
            return Promise.reject("Invalid referee answer: " + result.text);
        }
    }

    async answer(name: string, image: Image | null, question: string): Promise<boolean> {
        return new Promise<boolean>(async (resolve, reject) => {
            if (image) {
                const canvas = createCanvas(image.width, image.height);
                const ctx = canvas.getContext("2d");
                ctx.drawImage(image, 0, 0);
                const buffer = await canvas.encode("jpeg");
                //await fs.writeFile("target.jpg", buffer, console.error);

                let votesYes = 0;
                for (var model of this.models) {
                    if (await this.modelAnswer(this.models[0], name, buffer, question)) {
                        votesYes += 1;
                    }
                }
                resolve(votesYes > (this.models.length / 2));
            } else {
                reject("Invalid card image");
            }
        });
    }
}
