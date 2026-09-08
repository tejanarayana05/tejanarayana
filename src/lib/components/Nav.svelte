<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { fly } from 'svelte/transition';
	import { navLinks, site } from '$lib/data/site';

	let open = $state(false);

	afterNavigate(() => {
		open = false;
	});

	$effect(() => {
		if (!open) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previous;
		};
	});

	function closeOnEscape(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			open = false;
		}
	}

	function isActive(href: string) {
		if (href === '/') {
			return page.url.pathname === '/' && page.url.hash === '';
		}
		if (href.startsWith('#')) {
			return page.url.hash === href;
		}
		return page.url.pathname === href;
	}

	function toggle() {
		open = !open;
	}

	function close() {
		open = false;
	}
</script>

<svelte:window onkeydown={closeOnEscape} />

<header
	class="nav-shell fixed inset-x-0 top-0 z-50 border-b border-line bg-paper/80 backdrop-blur-md"
>
	<div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
		<a
			href="/"
			class="group flex min-h-11 items-center gap-2.5 font-display no-underline"
			aria-label="{site.name} — home"
		>
			<span
				class="flex size-10 items-center justify-center border border-line bg-field text-sm font-semibold tracking-wide text-ink transition-colors duration-200 group-hover:border-signal group-hover:text-signal"
			>
				TN
			</span>
			<span class="text-lg font-semibold tracking-tight text-ink sm:text-xl">
				{site.name}
			</span>
		</a>

		<nav class="hidden items-center gap-1 md:flex" aria-label="Primary">
			{#each navLinks as link (link.href)}
				<a
					href={link.href}
					class={[
						'nav-link relative flex min-h-11 items-center px-3 text-sm font-medium text-mute no-underline transition-colors duration-200 hover:text-ink',
						isActive(link.href) && 'active'
					]}
					aria-current={isActive(link.href) ? 'page' : undefined}
				>
					{link.label}
				</a>
			{/each}
		</nav>

		<button
			type="button"
			class="relative flex size-11 items-center justify-center text-ink md:hidden"
			aria-expanded={open}
			aria-controls="mobile-nav"
			aria-label={open ? 'Close menu' : 'Open menu'}
			onclick={toggle}
		>
			<span class="flex w-5 flex-col gap-1.5" aria-hidden="true">
				<span
					class={[
						'block h-0.5 w-full origin-center bg-ink transition-transform duration-200',
						open && 'translate-y-2 rotate-45'
					]}
				></span>
				<span
					class={[
						'block h-0.5 w-full bg-ink transition-opacity duration-200',
						open && 'opacity-0'
					]}
				></span>
				<span
					class={[
						'block h-0.5 w-full origin-center bg-ink transition-transform duration-200',
						open && '-translate-y-2 -rotate-45'
					]}
				></span>
			</span>
		</button>
	</div>

	{#if open}
		<div
			id="mobile-nav"
			class="border-t border-line bg-paper md:hidden"
			transition:fly={{ y: -8, duration: 200 }}
			role="dialog"
			aria-modal="true"
			aria-label="Mobile navigation"
		>
			<nav class="mx-auto flex max-w-6xl flex-col px-4 py-3 sm:px-6" aria-label="Mobile primary">
				{#each navLinks as link (link.href)}
					<a
						href={link.href}
						class={[
							'nav-link relative flex min-h-11 items-center border-b border-line py-3 text-base font-medium text-mute no-underline last:border-b-0 hover:text-ink',
							isActive(link.href) && 'active'
						]}
						aria-current={isActive(link.href) ? 'page' : undefined}
						onclick={close}
					>
						{link.label}
					</a>
				{/each}
			</nav>
		</div>
	{/if}
</header>

<div class="h-16" aria-hidden="true"></div>

<style>
	.nav-shell {
		animation: nav-enter 0.45s ease-out both;
	}

	@keyframes nav-enter {
		from {
			opacity: 0;
			transform: translateY(-0.5rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.nav-link::after {
		content: '';
		position: absolute;
		left: 0.75rem;
		right: 0.75rem;
		bottom: 0.55rem;
		height: 2px;
		background: var(--color-signal);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 0.2s ease;
	}

	.nav-link:hover::after,
	.nav-link.active::after {
		transform: scaleX(1);
	}

	.nav-link.active {
		color: var(--color-ink);
	}

	@media (max-width: 767px) {
		.nav-link::after {
			left: 0;
			right: auto;
			width: 1.25rem;
			bottom: 0.7rem;
		}
	}
</style>
