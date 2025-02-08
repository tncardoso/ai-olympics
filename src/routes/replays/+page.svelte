<script lang="ts">
    import { base } from "$app/paths";
    import type { PageProps } from "./$types";

    let { data }: PageProps = $props();
</script>

<div class="mt-12">
<div class="w-2/3 mx-auto bg-white p-6 rounded-lg shadow-lg">
    <h1 class="text-2xl font-bold text-center mb-4">Guess Who Replays</h1>
    
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
                    <th class="border border-gray-300 p-2">Date</th>
                    <th class="border border-gray-300 p-2">Player A</th>
                    <th class="border border-gray-300 p-2">Player B</th>
                    <th class="border border-gray-300 p-2">Winner</th>
                    <th class="border border-gray-300 p-2">Reason</th>
                </tr>
            </thead>
            <tbody>
                {#each data!.replays as replay, idx}
                    <tr class:bg-white={idx % 2 == 0} class:bg-gray-100={idx % 2 == 1}>
                        <td class="border border-gray-300 p-2 text-center">
                            <a class="underline text-blue-600 hover:text-blue-800 visited:text-purple-600" href={base + "/guesswho/" + replay.id}>{replay.date}</a></td>
                        <td class="border border-gray-300 p-2">{replay.playerA}</td>
                        <td class="border border-gray-300 p-2 text-center">{replay.playerB}</td>
                        <td class="border border-gray-300 p-2 text-center">{replay.result.winner}</td>
                        <td class="border border-gray-300 p-2 text-center">{replay.result.reason}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>
</div>