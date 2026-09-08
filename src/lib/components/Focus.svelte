<script lang="ts">
	import { pillars } from '$lib/data/site';
</script>

<section id="focus" class="section-cinematic scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28 lg:px-12" aria-labelledby="focus-heading">
	<div class="mx-auto max-w-5xl">
		<header class="max-w-2xl">
			<h2 id="focus-heading" class="font-display text-3xl tracking-tight text-ink sm:text-4xl">
				Focus
			</h2>
			<p class="mt-3 text-base leading-relaxed text-mute sm:text-lg">
				Three threads that shape how I build.
			</p>
		</header>

		<ul class="mt-12 divide-y divide-line border-y border-line sm:mt-16 sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:border-x sm:border-y-0">
			{#each pillars as pillar (pillar.id)}
				<li class="pillar group py-8 sm:px-6 sm:py-2 sm:first:pl-0 sm:last:pr-0 lg:px-8">
					<p
						class="font-display text-xs font-medium tracking-[0.2em] text-signal uppercase transition-colors duration-200 group-hover:text-signal-hot"
					>
						{pillar.title}
					</p>
					<p class="mt-4 text-base leading-relaxed text-ink/90 sm:text-[1.05rem]">
						{pillar.line}
					</p>
				</li>
			{/each}
		</ul>
	</div>
</section>
