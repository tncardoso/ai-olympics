<script lang="ts">
    import { Play, StepForward } from "lucide-svelte";
</script>

<div class="w-1/3 flex flex-col border-r border-gray-300">
    <div class="p-4 overflow-auto flex-grow">
        <div class="space-y-2">
            <div class="bg-gray-200 p-3 rounded-lg max-w-xs">
                <span class="font-bold text-sm">Alice:</span>
                <p>Hello! How are you?</p>
            </div>
            <div class="bg-blue-500 text-white p-3 rounded-lg max-w-xs ml-auto">
                <span class="font-bold text-sm">Bob:</span>
                <p>I'm good, thanks! And you?</p>
            </div>
            <div class="bg-gray-200 p-3 rounded-lg max-w-full mx-auto text-center">
                <span class="font-bold text-sm">Bob:</span>
                <p>I'm good, thanks! And you?</p>
            </div>
            <div class="bg-gray-200 p-3 rounded-lg max-w-xs">
                <span class="font-bold text-sm">Alice:</span>
                <p>Doing great! What's new?</p>
            </div>
            <div class="bg-blue-500 text-white p-3 rounded-lg max-w-xs ml-auto text-right">
                <span class="font-bold text-sm">Bob:</span>
                <p>Just working on a project.</p>
            </div>
        </div>
    </div>
    
    <!-- Toolbar -->
    <div class="p-4 border-t border-gray-300 flex justify-end bg-gray-100">
        <button class="p-2 bg-gray-300 rounded-full hover:bg-gray-400 mx-2" >
            <StepForward />
        </button>
        <button class="p-2 bg-gray-300 rounded-full hover:bg-gray-400 mx-2" >
            <Play />
        </button>
    </div>
</div>