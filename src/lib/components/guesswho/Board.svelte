<script lang="ts">
	import type { BoardDescription, PersonDescription } from "$lib/guesswho/model";
    import { Set } from "immutable";

    export let board: BoardDescription;
    export let state: Set<string>;
    export let color: string;
    export let model: string
    export let myCard: string;

    $: console.log("new state " + JSON.stringify(state));
    
    // Split characters into rows of 4
    const rows: PersonDescription[][] = [];
    if (board && board.people) {
        for (let i = 0; i < board.people.length; i += 4) {
            rows.push(board.people.slice(i, i + 4));
        }
    }
    
</script>

<div class={"grid gap-2 p-6 " + color} >
    <h1 class="text-lg text-center text-black font-bold mb-4">{model}</h1>
    <div class="w-sm bg-white flex flex-col items-center p-1 border rounded-lg shadow hover:shadow-lg transition-shadow">
        <img 
            src={"/guesswho/"+ myCard + ".jpg"} 
            alt={myCard}
            class="w-full h-16 object-cover rounded-lg mb-1 object-middle"
        />
        <span class="text-black font-bold text-center text-sm">{myCard}</span>
    </div>
    {#each rows as row}
        <div class="grid grid-cols-4 gap-2">
            {#each row as person}
                <div class="bg-white flex flex-col items-center p-1 border rounded-lg shadow hover:shadow-lg transition-shadow"
                    class:opacity-25={state.has(person.name)}>
                    <img 
                        src={"/guesswho/"+ person.name + ".jpg"} 
                        alt={person.name}
                        class="w-full h-14 object-cover rounded-lg mb-1"
                    />
                    <span class="text-black font-bold text-center text-sm">{person.name}</span>
                </div>
            {/each}
        </div>
    {/each}
</div>
