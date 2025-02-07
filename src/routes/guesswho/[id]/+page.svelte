<script lang="ts">
    import type { PageProps } from "./$types";
    import { type Message } from "$lib/components/guesswho/chat";
    import type { BoardDescription, PersonDescription } from "$lib/guesswho/model";
    import Chat from "$lib/components/guesswho/Chat.svelte";
    import Board from "$lib/components/guesswho/Board.svelte";
    import { Set } from "immutable";

    let { data }: PageProps = $props();
    let messages: Message[] = $state([]);
    let messagesByTurn: Message[][] = [];
    let running = false;
    let turn = 0;
    let intervalId: NodeJS.Timeout | null = null;

    // State in two variables to make reactivity easier
    let playerAState = $state(Set<string>([data.playerACard]));
    let playerBState = $state(Set<string>([data.playerBCard]));

    console.log(data);

    async function step() {
        console.log("step", turn);
        if (turn >= data.turns.length) {
            handlePause();
            return;
        }

        const turnMessages: Message[] = [];
        const turnData = data.turns[turn];

        if (!turnData) {
            return;
        }

        const player = turnData.playerID == data.playerA ? data.playerA : data.playerB; 
        const other = turnData.playerID == data.playerA ? data.playerB : data.playerA;
        const positionPlayer = turnData.playerID == data.playerA ? "A" : "B";
        const positionOther = other == data.playerA ? "A" : "B";

        if (turn == 0) {
            turnMessages.push({
                player: "Referee",
                position: "Referee",
                content: "Starting a new match!<br /><b>" + data.playerA + "</b> vs <b>" + data.playerB + "</b>",
                state: undefined,
            });
        }

        turnMessages.push({
            player: turnData.playerID,
            position: positionPlayer,
            content: turnData.playerQuestion,
            state: undefined,
        });

        turnMessages.push({
            player: other + " <span class='text-xs'>(via Referee)</span>",
            position: positionOther,
            content: turnData.refereeAnswer ? "Yes" : "No",
            state: undefined,
        });        

        // update state
        let playerState = turnData.playerID == data.playerA ? playerAState : playerBState; 
        let oldState = playerState;
        for (var person of turnData.playerUpdatedState) {
            if (!person.active) {
                playerState = playerState.add(person.name);
            }
        }

        const diff = playerState.subtract(oldState);
        turnMessages.push({
            player: turnData.playerID,
            position: positionPlayer,
            content: "Removing " + diff.join(", "),
            state: turnData.playerUpdatedState,
        });

        // force render
        if (turnData.playerID == data.playerA) {
            playerAState = playerState;
            console.log(playerAState);
        } else {
            playerBState = playerState;
        }

        if (turn == data.turns.length - 1) {
            turnMessages.push({
                player: "Referee",
                position: "Referee",
                content: "Finished match: " + data.result.winner + " won with reason " + data.result.reason,
                state: undefined,
            });
        }

        messages.push(...turnMessages);
        messagesByTurn.push(turnMessages);
        turn += 1;
    }

    function handlePause() {
        running = false;
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    function handleStep() {
        handlePause();
        if (turn < data.turns.length - 1) {
            step();
        }
    }

    function handlePlay() {
        running = true;
        if (!intervalId) {
            intervalId = setInterval(step, 1000);
        }
    }
</script>


<div class="flex flex-1">
    <!-- Chat Section (1/3 of the page) -->
    <Chat {messages} {handlePlay} {handleStep} {handlePause} />
    
    <!-- Main Content (Black Background) -->
    <div class="flex-1 bg-gray-400 text-white p-4">
        <div class="w-full max-w-7xl mx-auto p-4">
            <div class="grid grid-cols-2 gap-8">
                <Board 
                    model={data.playerA}
                    myCard={data.playerACard}
                    state={playerAState}
                    color="bg-rose-400"
                    board={data.board} />
                <Board
                    model={data.playerB}
                    myCard={data.playerBCard}
                    state={playerBState}
                    color="bg-orange-400"
                    board={data.board}/>
            </div>
        </div>
    </div>
</div>