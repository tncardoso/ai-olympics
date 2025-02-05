<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';

	let { children } = $props();
</script>

<div class="h-screen flex flex-col">
	<Navbar />
	{@render children()}
</div>
