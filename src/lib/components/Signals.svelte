<script lang="ts">
	import { signals } from '$lib/data/site';
</script>

<section
	id="signals"
	class="section-cinematic scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28 lg:px-12"
	aria-labelledby="signals-heading"
>
	<div class="mx-auto max-w-5xl">
		<header class="max-w-2xl">
			<h2 id="signals-heading" class="font-display text-3xl tracking-tight text-ink sm:text-4xl">
				Signals
			</h2>
			<p class="mt-3 text-base leading-relaxed text-mute sm:text-lg">
				Selected work and writing that mark the path.
			</p>
		</header>

		<ul class="mt-12 sm:mt-16">
			{#each signals as signal (signal.id)}
				<li class="signal-row border-t border-line last:border-b">
					{#if 'href' in signal && signal.href}
						<a
							href={signal.href}
							target="_blank"
							rel="noopener noreferrer"
							class="group flex flex-col gap-2 py-6 transition-colors duration-200 sm:grid sm:grid-cols-[7rem_1fr_auto] sm:items-baseline sm:gap-6 sm:py-7"
						>
							<span
								class="text-xs font-medium tracking-[0.18em] text-mute uppercase transition-colors duration-200 group-hover:text-signal"
							>
								{signal.label}
							</span>
							<span class="min-w-0">
								<span
									class="block font-display text-xl tracking-tight text-ink transition-colors duration-200 group-hover:text-signal sm:text-2xl"
								>
									{signal.title}
								</span>
								<span class="mt-2 block max-w-xl text-sm leading-relaxed text-mute sm:text-base">
									{signal.detail}
								</span>
							</span>
							<span class="text-sm text-mute sm:pt-1 sm:text-right">{signal.meta}</span>
						</a>
					{:else}
						<div
							class="flex flex-col gap-2 py-6 sm:grid sm:grid-cols-[7rem_1fr_auto] sm:items-baseline sm:gap-6 sm:py-7"
						>
							<span class="text-xs font-medium tracking-[0.18em] text-mute uppercase">
								{signal.label}
							</span>
							<span class="min-w-0">
								<span class="block font-display text-xl tracking-tight text-ink sm:text-2xl">
									{signal.title}
								</span>
								<span class="mt-2 block max-w-xl text-sm leading-relaxed text-mute sm:text-base">
									{signal.detail}
								</span>
							</span>
							<span class="text-sm text-mute sm:pt-1 sm:text-right">{signal.meta}</span>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
</section>
