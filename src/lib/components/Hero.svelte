<script lang="ts">
	import { site } from '$lib/data/site';
</script>

<section
	class="hero relative isolate flex min-h-dvh flex-col justify-end overflow-hidden px-5 pb-16 pt-28 sm:justify-center sm:px-8 sm:pb-20 sm:pt-24 lg:px-12"
	aria-labelledby="hero-brand"
>
	<!-- Full-bleed visual plane: soft field + SVG mesh + signal graph -->
	<div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
		<div class="hero-glow hero-glow--teal absolute -right-24 -top-16 h-[55vmax] w-[55vmax] rounded-full"></div>
		<div class="hero-glow hero-glow--spark absolute -bottom-32 -left-20 h-[42vmax] w-[42vmax] rounded-full"></div>
		<div class="absolute inset-0 mesh-grid opacity-80"></div>
		<svg class="absolute inset-0 h-full w-full opacity-[0.35]" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<pattern id="hero-mesh" width="72" height="72" patternUnits="userSpaceOnUse">
					<path
						d="M72 0H0V72"
						fill="none"
						stroke="currentColor"
						stroke-width="0.6"
						class="text-ink/15"
					/>
					<circle cx="0" cy="0" r="1.2" class="fill-signal/40" />
				</pattern>
				<linearGradient id="hero-fade" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stop-color="#e7edf2" stop-opacity="0.15" />
					<stop offset="55%" stop-color="#d5e4ec" stop-opacity="0.05" />
					<stop offset="100%" stop-color="#f3efe6" stop-opacity="0" />
				</linearGradient>
			</defs>
			<rect width="100%" height="100%" fill="url(#hero-mesh)" />
			<rect width="100%" height="100%" fill="url(#hero-fade)" />
		</svg>
		<svg
			class="hero-graph absolute right-[-8%] top-[12%] hidden h-[70%] w-[58%] sm:block"
			viewBox="0 0 640 520"
			xmlns="http://www.w3.org/2000/svg"
		>
			<g fill="none" stroke="#0d9488" stroke-width="1.25" opacity="0.55">
				<path d="M80 420 L220 300 L340 340 L460 180 L580 220" class="hero-path" />
				<path d="M220 300 L260 160 L400 120" opacity="0.7" />
				<path d="M340 340 L420 420 L540 380" opacity="0.55" />
			</g>
			<g fill="#0d9488">
				<circle cx="80" cy="420" r="5" class="hero-node" />
				<circle cx="220" cy="300" r="7" class="hero-node" />
				<circle cx="340" cy="340" r="5" class="hero-node" />
				<circle cx="460" cy="180" r="8" class="hero-node" />
				<circle cx="580" cy="220" r="5" class="hero-node" />
				<circle cx="260" cy="160" r="4" fill="#ea580c" class="hero-node" />
				<circle cx="400" cy="120" r="5" fill="#ea580c" class="hero-node" />
				<circle cx="420" cy="420" r="4" class="hero-node" />
				<circle cx="540" cy="380" r="5" class="hero-node" />
			</g>
		</svg>
	</div>

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
				class="inline-flex min-h-11 items-center justify-center bg-signal px-6 py-3 text-sm font-medium tracking-wide text-paper transition-colors duration-200 hover:bg-ink focus-visible:outline-offset-4"
			>
				Get in touch
			</a>
			<a
				href="#focus"
				class="inline-flex min-h-11 items-center justify-center border border-line-strong px-6 py-3 text-sm font-medium tracking-wide text-ink transition-colors duration-200 hover:border-ink hover:bg-paper/60"
			>
				See focus
			</a>
		</div>
	</div>
</section>

<style>
	.hero-glow {
		filter: blur(64px);
		animation: drift 18s ease-in-out infinite alternate;
	}

	.hero-glow--teal {
		background: radial-gradient(circle, rgba(13, 148, 136, 0.28) 0%, transparent 70%);
	}

	.hero-glow--spark {
		background: radial-gradient(circle, rgba(234, 88, 12, 0.16) 0%, transparent 70%);
		animation-duration: 22s;
		animation-delay: -4s;
	}

	.hero-copy > * {
		animation: rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	.hero-role {
		animation-delay: 0.05s;
	}

	#hero-brand {
		animation-delay: 0.12s;
	}

	.hero-headline {
		animation-delay: 0.28s;
	}

	.hero-tagline {
		animation-delay: 0.38s;
	}

	.hero-cta {
		animation-delay: 0.5s;
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(1.1rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes drift {
		from {
			transform: translate3d(0, 0, 0) scale(1);
		}
		to {
			transform: translate3d(-4%, 5%, 0) scale(1.08);
		}
	}

	.hero-path {
		stroke-dasharray: 12 10;
		animation: dash 18s linear infinite;
	}

	.hero-node {
		transform-box: fill-box;
		transform-origin: center;
		animation: pulse-node 3.6s ease-in-out infinite;
	}

	.hero-node:nth-child(odd) {
		animation-delay: 0.6s;
	}

	@keyframes dash {
		to {
			stroke-dashoffset: -220;
		}
	}

	@keyframes pulse-node {
		0%,
		100% {
			opacity: 0.45;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.25);
		}
	}

	.hero-graph {
		animation: rise 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.35s both;
	}
</style>
