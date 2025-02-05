import { generateObject } from "ai";
import { experimental_generateImage as generateImage } from "ai";
import { openai } from "@ai-sdk/openai";
import { replicate } from "@ai-sdk/replicate";
import { z } from "zod";
import type { BoardDescription, PersonDescription } from "./model";

const BOARD_PROMPT = `
You are a specialist board game designer. Your objective is to create 24 personas
for a game similar to "Guess Who". Each person should have a characteristic description
and the group of people should be as diverse as possible.

## Example characteristics

- Gender
- Race
- Age
- Eye color
- Hair style and color
- Hair accessories
- Glasses
- Clothes
- Facial hair
`;

export async function createBoardDescription(): Promise<BoardDescription> {
    const model = openai("gpt-4-turbo");
    const board = await generateObject<BoardDescription>({
        model: model,
        schema: z.object({
            people: z.array(z.object({
                name: z.string(),
                description: z.string(),
            })),
        }),
        prompt: BOARD_PROMPT,
    });

    return board.object;
}

const IMAGE_PROMPT = `
Realistic mugshot style portrait, only person, no text, blank background, of
`;

export async function createCard(person: PersonDescription) {
    const model = replicate.image("black-forest-labs/flux-schnell");
    const prompt = IMAGE_PROMPT + person.description;
    const { image } = await generateImage({
        model: model,
        aspectRatio: "4:5",
        prompt: prompt,
        seed: 1337,
    });
    return image;
}