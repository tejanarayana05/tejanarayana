<script lang="ts">
	import { onMount } from 'svelte';
	import type { NeonTrailEngine } from '$lib/three/neonTrailEngine';

	let canvas: HTMLCanvasElement | undefined = $state();
	let failed = $state(false);

	function randomColors(count: number) {
		return Array.from(
			{ length: count },
			() => '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
		);
	}

	onMount(() => {
		if (!canvas) return;

		let cancelled = false;
		let engine: NeonTrailEngine | null = null;
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		const onClick = () => {
			if (!engine || reducedMotion) return;
			engine.setColors(randomColors(3));
			engine.setLightsColors(randomColors(4));
		};

		(async () => {
			try {
				const { createNeonTrailEngine } = await import('$lib/three/neonTrailEngine');
				if (cancelled || !canvas) return;

				engine = createNeonTrailEngine(canvas, {
					reducedMotion,
					tubeColors: ['#f967fb', '#53bc28', '#6958d5'],
					lightColors: ['#83f36e', '#fe8a2e', '#ff008a', '#60aed5'],
					lightIntensity: reducedMotion ? 1.2 : 2.4
				});
				engine.resize();
				window.addEventListener('click', onClick);
			} catch (e) {
				console.error('[cursor-trail]', e);
				failed = true;
			}
		})();

		return () => {
			cancelled = true;
			window.removeEventListener('click', onClick);
			engine?.dispose();
			engine = null;
		};
	});
</script>

<div class="trail-root" aria-hidden="true">
	{#if !failed}
		<canvas bind:this={canvas} class="trail-canvas"></canvas>
	{/if}
</div>

<style>
	.trail-root {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		overflow: hidden;
		background: #000;
	}

	.trail-canvas {
		display: block;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
</style>
