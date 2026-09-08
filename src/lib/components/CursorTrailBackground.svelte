<script lang="ts">
	/**
	 * Global neon tubes cursor trail — FreeFrontend TubesCursor demo.
	 * Licence CC BY-NC-SA 4.0 — Kevin Levron / threejs-components@0.0.19
	 */
	import { onMount } from 'svelte';

	type TubesApp = {
		tubes: {
			setColors: (colors: string[]) => void;
			setLightsColors: (colors: string[]) => void;
		};
		dispose?: () => void;
	};

	let canvas: HTMLCanvasElement | undefined = $state();
	let failed = $state(false);

	function randomColors(count: number) {
		return new Array(count)
			.fill(0)
			.map(() => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
	}

	onMount(() => {
		if (!canvas) return;

		let cancelled = false;
		let app: TubesApp | null = null;

		const onClick = () => {
			if (!app) return;
			const colors = randomColors(3);
			const lightsColors = randomColors(4);
			app.tubes.setColors(colors);
			app.tubes.setLightsColors(lightsColors);
		};

		(async () => {
			try {
				const { default: TubesCursor } = await import('$lib/vendor/tubes1.min.js');
				if (cancelled || !canvas) return;

				// FreeFrontend TubesCursor — high lerp = snappy follow
				app = TubesCursor(canvas, {
					tubes: {
						colors: ['#f967fb', '#53bc28', '#6958d5'],
						lerp: 0.75,
						noise: 0.03,
						minTubularSegments: 48,
						maxTubularSegments: 180,
						lights: {
							intensity: 200,
							colors: ['#83f36e', '#fe8a2e', '#ff008a', '#60aed5']
						}
					}
				});

				document.body.addEventListener('click', onClick);
			} catch (e) {
				console.error('[tubes-cursor]', e);
				failed = true;
			}
		})();

		return () => {
			cancelled = true;
			document.body.removeEventListener('click', onClick);
			try {
				app?.dispose?.();
			} catch {
				/* ignore */
			}
			app = null;
		};
	});
</script>

<div class="trail-root" aria-hidden="true">
	{#if !failed}
		<canvas bind:this={canvas} id="canvas" class="trail-canvas"></canvas>
	{/if}
</div>

<style>
	.trail-root {
		position: fixed;
		inset: 0;
		z-index: 0;
		overflow: hidden;
		background: #000;
		pointer-events: none;
	}

	/* Matches FreeFrontend #canvas — full viewport, under UI */
	.trail-canvas {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		display: block;
		width: 100%;
		height: 100%;
		overflow: hidden;
		pointer-events: none;
	}
</style>
