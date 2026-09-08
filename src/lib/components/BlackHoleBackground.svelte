<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { BlackHoleEngine } from '$lib/three/blackHoleEngine';

	let canvas: HTMLCanvasElement | undefined = $state();
	let engine: BlackHoleEngine | null = null;
	let failed = $state(false);

	/** Zoom + orbit tracks the full page length — slow, not 2–3 wheel ticks. */
	function syncScroll() {
		if (!engine || !browser) return;
		const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
		engine.setScrollProgress(window.scrollY / max);
	}

	onMount(() => {
		if (!canvas) return;
		let cancelled = false;

		(async () => {
			try {
				const { createBlackHoleEngine } = await import('$lib/three/blackHoleEngine');
				if (cancelled || !canvas) return;
				engine = createBlackHoleEngine(canvas);
				syncScroll();
				engine.resize();
			} catch (e) {
				console.error(e);
				failed = true;
			}
		})();

		const onScroll = () => syncScroll();
		const onResize = () => {
			engine?.resize();
			syncScroll();
		};

		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onResize);

		return () => {
			cancelled = true;
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onResize);
			engine?.dispose();
			engine = null;
		};
	});
</script>

<div class="bh-root" aria-hidden="true">
	{#if !failed}
		<canvas bind:this={canvas} class="bh-canvas"></canvas>
	{/if}
	<div class="bh-veil"></div>
</div>

<style>
	.bh-root {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		overflow: hidden;
		background: #000;
	}

	.bh-canvas {
		display: block;
		width: 100%;
		height: 100%;
	}

	.bh-veil {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse 75% 65% at 50% 45%, transparent 35%, rgba(0, 0, 0, 0.22) 100%),
			linear-gradient(180deg, rgba(0, 0, 0, 0.12) 0%, transparent 28%, transparent 72%, rgba(0, 0, 0, 0.3) 100%);
		pointer-events: none;
	}
</style>
