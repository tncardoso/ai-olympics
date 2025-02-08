# AI Olympics

AI Olympics is a collection of unusual benchmarks designed to evaluate AI models.

## Installation

To install dependencies, run:

```bash
pnpm install
```

To run the development server:

```bash
npm run dev
```

## Guess Who?

[Guess Who?](https://en.wikipedia.org/wiki/Guess_Who%3F) is a boardgame in which players try to guess each other chosen character. To help discovering the character, players are allowed to ask yes or no questions.

### Running a Game

```bash
npx tsx src/bin/guesswho/play.ts playerAModel playerBModel
```

After running the game a replay file is generated in `static/guesswho/runs`. To include runs in the ranking and webpage, you need to update files.

```bash
npx tsx src/bin/guesswho/ranking.ts
```

This will create `static/guesswho/ranking.json` and `static/guesswho/replays.json`. Those are the files used in the static webpage.

### Creating a new set o characters

It is possible to generate new set of characters. The following script creates descriptions and images.

```bash
npx tsx src/bin/guesswho/create.ts
```

### TODOs and Caveats

- Add runs for other models.
- After the yes-or-no questions, models update state by evaluating each character. To improve performance, use board image.