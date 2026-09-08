<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import BlackHoleBackground from '$lib/components/BlackHoleBackground.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import { site } from '$lib/data/site';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Syne:wght@500;600;700;800&display=swap"
		rel="stylesheet"
	/>
	<meta name="theme-color" content="#000000" />
	<title>{site.name} — {site.role}</title>
	<meta name="description" content={site.description} />
	<meta name="author" content={site.name} />
	<meta property="og:title" content="{site.name} — {site.role}" />
	<meta property="og:description" content={site.description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={site.url} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="{site.name} — {site.role}" />
	<meta name="twitter:description" content={site.description} />
</svelte:head>

<BlackHoleBackground />

<div class="relative z-10">
	<a
		href="#main"
		class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
	>
		Skip to content
	</a>
	<Nav />
	<main id="main">{@render children()}</main>
	<Footer />
</div>
