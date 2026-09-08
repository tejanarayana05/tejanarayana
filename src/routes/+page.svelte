<script lang="ts">
	import ContactCTA from '$lib/components/ContactCTA.svelte';
	import Focus from '$lib/components/Focus.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import Signals from '$lib/components/Signals.svelte';
	import { site } from '$lib/data/site';
</script>

<svelte:head>
	<link rel="canonical" href={site.url} />
</svelte:head>

<Hero />
<Focus />
<Signals />
<ContactCTA />
