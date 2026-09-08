<script lang="ts">
	import { site } from '$lib/data/site';

	const mailto = `mailto:${site.email}`;
</script>

<section
	id="contact"
	class="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28 lg:px-12"
	aria-labelledby="contact-heading"
>
	<div class="mx-auto max-w-5xl border-t border-line pt-16 sm:pt-20">
		<h2 id="contact-heading" class="font-display text-3xl tracking-tight text-ink sm:text-5xl">
			Let's build something useful
		</h2>
		<p class="mt-4 max-w-xl text-base leading-relaxed text-mute sm:text-lg">
			Open to conversations on product, AI, and engineering — sharp problems welcome.
		</p>

		<div class="mt-9 flex flex-wrap items-center gap-3 sm:mt-11 sm:gap-4">
			<a
				href={mailto}
				class="inline-flex min-h-11 items-center justify-center bg-signal px-6 py-3 text-sm font-medium tracking-wide text-paper transition-colors duration-200 hover:bg-ink"
			>
				Email {site.email}
			</a>
			<a
				href={site.social.github}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex min-h-11 items-center justify-center border border-line-strong px-5 py-3 text-sm font-medium text-ink transition-colors duration-200 hover:border-ink hover:bg-paper/60"
			>
				GitHub
			</a>
			<a
				href={site.social.linkedin}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex min-h-11 items-center justify-center border border-line-strong px-5 py-3 text-sm font-medium text-ink transition-colors duration-200 hover:border-ink hover:bg-paper/60"
			>
				LinkedIn
			</a>
		</div>
	</div>
</section>
