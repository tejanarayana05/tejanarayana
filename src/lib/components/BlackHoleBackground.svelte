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
	<!-- Permanent film / CRT morph veil from the GARGANTUA #fx layer -->
	<div class="bh-fx"></div>
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

	.bh-fx {
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0.55;
		mix-blend-mode: screen;
		background:
			repeating-linear-gradient(
				0deg,
				rgba(255, 255, 255, 0.025) 0px,
				rgba(255, 255, 255, 0.025) 1px,
				transparent 1px,
				transparent 3px
			),
			radial-gradient(ellipse at center, transparent 0%, transparent 55%, rgba(0, 0, 0, 0.55) 100%);
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

	@media (prefers-reduced-motion: reduce) {
		.bh-fx {
			opacity: 0.35;
		}
	}
</style>
