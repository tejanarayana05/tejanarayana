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
	<!-- Cinematic atmosphere: reading scrim left, letterbox, depth falloff -->
	<div class="bh-veil"></div>
	<div class="bh-letterbox"></div>
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
			/* left reading key — keeps hero type legible without flattening the hole */
			linear-gradient(
				95deg,
				rgba(0, 0, 0, 0.55) 0%,
				rgba(0, 0, 0, 0.28) 28%,
				rgba(0, 0, 0, 0.06) 52%,
				transparent 72%
			),
			radial-gradient(ellipse 85% 70% at 55% 48%, transparent 32%, rgba(0, 0, 0, 0.28) 100%),
			linear-gradient(
				180deg,
				rgba(0, 0, 0, 0.22) 0%,
				transparent 18%,
				transparent 62%,
				rgba(0, 0, 0, 0.42) 100%
			);
		pointer-events: none;
	}

	.bh-letterbox {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			180deg,
			rgba(0, 0, 0, 0.35) 0%,
			transparent 7%,
			transparent 93%,
			rgba(0, 0, 0, 0.45) 100%
		);
		opacity: 0.85;
		pointer-events: none;
	}
</style>
