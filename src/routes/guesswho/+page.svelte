<script lang="ts">
    import Chat from "$lib/components/Chat.svelte";

    function turn() {        
    }
</script>


<div class="flex flex-1">
    <!-- Chat Section (1/3 of the page) -->
    <Chat />
    
    <!-- Main Content (Black Background) -->
    <div class="flex-1 bg-black text-white p-4">Main Content</div>
</div>