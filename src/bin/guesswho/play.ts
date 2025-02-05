import { GuessWho } from "$lib/guesswho";
import { readBoard } from "$lib/guesswho/model";


async function main() {
    const board = await readBoard();
    const game = new GuessWho(board);
    await game.init();
    await game.turn();
}

main().catch(console.error);