<script lang="ts">
    import { Play, StepForward, StepBack, Pause } from "lucide-svelte";
    import { type Message } from "$lib/components/guesswho/chat";
	import { tick } from "svelte";

    const { messages = [], handlePlay, handleStepBack, handleStep, handlePause } = $props<{
        messages: Message[];
        handlePlay: () => void;
        handleStepBack: () => void;
        handleStep: () => void;
        handlePause: () => void;
    }>();

    let element: any;


    $effect(() => {
        messages.length;
        if (messages && element) {
            element.scroll({ top: element.scrollHeight + 500, behavior: 'smooth' });
        }
	});

</script>

<div class="w-1/3 flex flex-col border-r border-gray-300">
    <div class="p-4 overflow-y-auto flex-grow max-h-[85vh]">
        <div bind:this={element} class="h-full max-h-full overflow-scroll space-y-2">
            {#each messages as { player, position, content }}
                <div class={position === "A" ?
                        "bg-rose-400 p-3 rounded-lg max-w-xs" :
                        position == "B" ?
                        "bg-orange-400 text-black p-3 rounded-lg max-w-xs ml-auto text-right":
                        "bg-slate-800 text-white p-3 rounded-lg max-w-full mx-auto text-center"}>
                    <span class="font-bold text-sm">{@html player}</span>
                    <p>{@html content}</p>
                </div>
            {/each}
        </div>
    </div>
    
    <!-- Toolbar -->
    <div class="p-4 border-t border-gray-00 flex justify-end bg-gray-100">
        <button class="p-2 bg-gray-300 rounded-full hover:bg-gray-400 mx-2" onclick={handlePause} >
            <Pause />
        </button>
        <button class="p-2 bg-gray-300 rounded-full hover:bg-gray-400 mx-2" onclick={handleStepBack} >
            <StepBack />
        </button>
        <button class="p-2 bg-gray-300 rounded-full hover:bg-gray-400 mx-2" onclick={handleStep} >
            <StepForward />
        </button>
        <button class="p-2 bg-gray-300 rounded-full hover:bg-gray-400 mx-2" onclick={handlePlay} >
            <Play />
        </button>
    </div>
</div>