<script lang="ts">
    import { base } from "$app/paths";
</script>

<nav class="bg-pastel-blue text-gray-700 p-4 shadow-md flex items-center">
    <ul class="flex space-x-6">
        <li><a href={base + "/"} class="hover:text-gray-500">Home</a></li>
        <li><a href={base + "/ranking"} class="hover:text-gray-500">Ranking</a></li>
        <li><a href={base + "/replays"} class="hover:text-gray-500">Replays</a></li>
    </ul>
</nav>