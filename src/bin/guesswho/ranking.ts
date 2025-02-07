import * as fs from "fs";
import { Rating, rate_1vs1 } from "ts-trueskill";
import { type Replay } from "$lib/guesswho/replay";
import { type Ranking, type RankingEntry, GuessWhoStats } from "$lib/ranking";

async function computeRanking() {
    const dir = "static/guesswho/runs";
    const ratings = new Map<string, Rating>();
    const entries = new Map<string, GuessWhoStats>();

    const getStats = (id: string): GuessWhoStats => {
        if (entries.has(id)) {
            return entries.get(id)!;
        } else {
            const stats = new GuessWhoStats();
            entries.set(id, stats);
            return stats;
        }
    }
    
    const replays = [];
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
        if (file.endsWith('.json')) {
            const filename = `${dir}/${file}`;
            const data = await fs.promises.readFile(filename, 'utf-8');
            const replay = JSON.parse(data) as Replay;
            replay.date = new Date(replay.date);
            replays.push(replay);

            const playerA = replay.playerA;
            const playerB = replay.playerB;
            const winner = replay.result.winner;
            const reason = replay.result.reason;
            console.log(`Processing ${filename} replay. PA= ${playerA} PB= ${playerB}`);

            // Update ratings and stats
            const playerARating = ratings.has(playerA) ? ratings.get(playerA) : new Rating();
            const playerBRating = ratings.has(playerB) ? ratings.get(playerB) : new Rating();
            const playerAStats = getStats(playerA);
            const playerBStats = getStats(playerB);
            
            if (winner == playerA) {
                const [playerANewRating, playerBNewRating] = rate_1vs1(playerARating!, playerBRating!);
                ratings.set(playerA, playerANewRating);
                ratings.set(playerB, playerBNewRating);
                playerAStats.playerAWins += 1;
                playerAStats.wins += 1;
            } else if (winner == playerB) {
                const [playerBNewRating, playerANewRating] = rate_1vs1(playerBRating!, playerARating!);
                ratings.set(playerA, playerANewRating);
                ratings.set(playerB, playerBNewRating);
                playerBStats.playerBWins += 1;
                playerBStats.wins += 1;
            }

            playerAStats.playerAMatches += 1;
            playerAStats.matches += 1;
            playerAStats.averageTurns += replay.turns.length;
            playerBStats.playerBMatches += 1;
            playerBStats.matches += 1;
            playerBStats.averageTurns += replay.turns.length;
        }
    }

    const ranking: Ranking = {
        task: "Guess Who",
        ranking: [],
    };

    for (let [modelID, value] of entries) {
        value.averageTurns = value.averageTurns / value.matches;
        const trueskill = ratings.get(modelID)!;

        const entry: RankingEntry = {
            model: modelID,
            ranking: trueskill.mu,
            trueskill: trueskill,
            stats: value,
        };
        ranking.ranking.push(entry);
    }

    //Sort ranking
    ranking.ranking.sort((a, b) => b.ranking - a.ranking);
    fs.writeFile("static/guesswho/ranking.json", JSON.stringify(ranking), console.error);
    console.log(ranking);

    replays.sort((a, b) => b.date.getTime() - a.date.getTime());
    replays.map((replay) => { replay.turns = []; replay.board = {people: []}; })
    fs.writeFile("static/guesswho/replays.json", JSON.stringify({replays: replays}), console.error);
}

// Read all replay information and compute final ranking
async function main() {
    await computeRanking();
}

main().catch(console.error);