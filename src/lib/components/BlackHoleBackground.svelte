<script lang="ts">
	import { onMount } from 'svelte';
	import type { BlackHoleEngine } from '$lib/three/blackHoleEngine';

	let canvas: HTMLCanvasElement | undefined = $state();
	let engine: BlackHoleEngine | null = null;
	let failed = $state(false);

	onMount(() => {
		if (!canvas) return;
		let cancelled = false;

		(async () => {
			try {
				const { createBlackHoleEngine } = await import('$lib/three/blackHoleEngine');
				if (cancelled || !canvas) return;
				engine = createBlackHoleEngine(canvas);
				engine.resize();
			} catch (e) {
				console.error(e);
				failed = true;
			}
		})();

		return () => {
			cancelled = true;
			engine?.dispose();
			engine = null;
		};
	});
</script>

<div class="bh-root" aria-hidden="true">
	{#if !failed}
		<canvas bind:this={canvas} class="bh-canvas"></canvas>
	{/if}
	<!-- Soft edge vignette only — no animated film morph layer -->
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
			radial-gradient(ellipse 78% 68% at 50% 45%, transparent 40%, rgba(0, 0, 0, 0.18) 100%),
			linear-gradient(
				180deg,
				rgba(0, 0, 0, 0.1) 0%,
				transparent 26%,
				transparent 74%,
				rgba(0, 0, 0, 0.28) 100%
			);
		pointer-events: none;
	}
</style>
