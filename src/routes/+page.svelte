<script lang="ts">
	import ContactCTA from '$lib/components/ContactCTA.svelte';
	import Focus from '$lib/components/Focus.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import Signals from '$lib/components/Signals.svelte';
	import { site } from '$lib/data/site';
</script>

<svelte:head>
	<title>{site.name} — {site.role}</title>
	<meta name="description" content={site.description} />
	<meta property="og:title" content="{site.name} — {site.role}" />
	<meta property="og:description" content={site.description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={site.url} />
	<link rel="canonical" href={site.url} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=Syne:wght@500;600;700;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<Hero />
<Focus />
<Signals />
<ContactCTA />
