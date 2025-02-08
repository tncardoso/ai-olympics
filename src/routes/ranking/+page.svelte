<script lang="ts">
    import { base } from "$app/paths";
    import { onMount } from 'svelte';
    import { type Ranking } from '$lib/ranking';

    let ranking: Ranking;

    onMount(async () => {
        const response = await fetch(`${base}/guesswho/ranking.json`);
        ranking = await response.json();
    });
</script>

<div class="mt-12">
<div class="w-2/3 mx-auto bg-white p-6 rounded-lg shadow-lg">
    <h1 class="text-2xl font-bold text-center mb-4">Guess Who Ranking</h1>
    
    <div class="flex justify-between items-center mb-4">
        <label for="task" class="text-sm font-medium">Task:</label>
        <select id="task" class="border rounded p-2 pr-12">
            <option value="guesswho">Guess Who</option>
        </select>
    </div>

    <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-gray-300">
            <thead class="bg-gray-200">
                <tr>
                    <th class="border border-gray-300 p-2">Rank</th>
                    <th class="border border-gray-300 p-2">Model</th>
                    <th class="border border-gray-300 p-2">Trueskill</th>
                    {#each Object.keys(ranking?.ranking[0]?.stats ?? {}) as statsField}
                        <th class="border border-gray-300 p-2">{statsField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</th>
                    {/each}
                </tr>
            </thead>
            <tbody>
                {#each ranking?.ranking as entry, idx}
                    <tr class:bg-white={idx % 2 == 0} class:bg-gray-100={idx % 2 == 1}>
                        <td class="border border-gray-300 p-2 text-center">{idx}</td>
                        <td class="border border-gray-300 p-2">{entry.model}</td>
                        <td class="border border-gray-300 p-2 text-center">{entry.ranking.toFixed(2)}</td>
                        {#each Object.keys(entry.stats ?? {}) as statsField }
                        <td class="border border-gray-300 p-2 text-center">{entry.stats[statsField]}</td>
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>
</div>