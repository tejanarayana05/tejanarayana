<script lang="ts">
	import { site } from '$lib/data/site';

	const year = 2026;

	const links = [
		{ href: site.social.github, label: 'Github' },
		{ href: site.social.linkedin, label: 'LinkedIn' },
		{ href: `mailto:${site.email}`, label: 'Email' }
	] as const;
</script>

<footer class="border-t border-line">
	<div
		class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"
	>
		<p class="text-sm text-mute">
			© {year}
			<span class="font-display font-semibold text-ink">{site.name}</span>
		</p>

		<nav class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1" aria-label="Social">
			{#each links as link (link.href)}
				<a
					href={link.href}
					class="flex min-h-11 items-center text-sm font-medium text-mute no-underline transition-colors duration-200 hover:text-signal sm:px-3"
					rel={link.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
					target={link.href.startsWith('mailto:') ? undefined : '_blank'}
				>
					{link.label}
				</a>
			{/each}
		</nav>
	</div>
</footer>
