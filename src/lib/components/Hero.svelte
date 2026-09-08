<script lang="ts">
	import { site } from '$lib/data/site';
</script>

<section
	class="hero relative isolate flex min-h-dvh flex-col justify-end overflow-hidden px-5 pb-16 pt-28 sm:justify-center sm:px-8 sm:pb-20 sm:pt-24 lg:px-12"
	aria-labelledby="hero-brand"
>
	<div class="hero-copy relative mx-auto w-full max-w-5xl">
		<p class="hero-role mb-4 text-xs font-medium tracking-[0.22em] text-mute uppercase sm:text-sm">
			{site.role}
		</p>

		<h1
			id="hero-brand"
			class="font-display text-[clamp(2.75rem,12vw,6.5rem)] leading-[0.92] tracking-tight text-ink text-balance"
		>
			{site.name}
		</h1>

		<p
			class="hero-headline mt-6 max-w-xl text-lg leading-snug text-ink/90 sm:mt-8 sm:text-2xl sm:leading-snug"
		>
			{site.headline}
		</p>

		<p class="hero-tagline mt-3 max-w-lg text-base leading-relaxed text-mute sm:text-lg">
			{site.tagline}
		</p>

		<div class="hero-cta mt-9 flex flex-wrap items-center gap-3 sm:mt-11 sm:gap-4">
			<a
				href="#contact"
				class="inline-flex min-h-11 items-center justify-center bg-signal px-6 py-3 text-sm font-medium tracking-wide text-paper transition-colors duration-300 hover:bg-ink hover:text-paper focus-visible:outline-offset-4"
			>
				Get in touch
			</a>
			<a
				href="#focus"
				class="inline-flex min-h-11 items-center justify-center border border-line-strong px-6 py-3 text-sm font-medium tracking-wide text-ink transition-colors duration-300 hover:border-ink hover:bg-field"
			>
				See focus
			</a>
		</div>
	</div>
</section>

<style>
	.hero-copy {
		/* soft exit as the camera dives — scroll-driven when supported */
		animation: hero-exit linear both;
		animation-timeline: scroll();
		animation-range: 0vh 85vh;
	}

	.hero-copy > * {
		animation: rise 1.35s cubic-bezier(0.16, 1, 0.3, 1) both;
		text-shadow: 0 2px 28px rgba(0, 0, 0, 0.55);
	}

	.hero-role {
		animation-delay: 0.12s;
		letter-spacing: 0.26em;
	}

	#hero-brand {
		animation-delay: 0.28s;
		text-shadow:
			0 2px 40px rgba(0, 0, 0, 0.7),
			0 0 80px rgba(0, 0, 0, 0.35);
	}

	.hero-headline {
		animation-delay: 0.48s;
	}

	.hero-tagline {
		animation-delay: 0.62s;
	}

	.hero-cta {
		animation-delay: 0.8s;
		text-shadow: none;
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(1.6rem);
			filter: blur(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
			filter: blur(0);
		}
	}

	@keyframes hero-exit {
		from {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
		to {
			opacity: 0.15;
			transform: translateY(-1.5rem) scale(0.985);
		}
	}

	@supports not (animation-timeline: scroll()) {
		.hero-copy {
			animation: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-copy,
		.hero-copy > * {
			animation: none !important;
			filter: none !important;
			opacity: 1 !important;
			transform: none !important;
		}
	}
</style>
