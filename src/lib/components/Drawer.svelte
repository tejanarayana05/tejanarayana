<script>
  import { fly, fade } from 'svelte/transition';

  /**
   * @typedef {Object} DrawerProps
   * @property {boolean} [isOpen]
   * @property {import('../data/resumeData.js').DeepDiveItem | null} [data]
   * @property {() => void} [onclose]
   */

  /** @type {DrawerProps} */
  let { isOpen = false, data = null, onclose } = $props();

  function close() {
    if (onclose) onclose();
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.key === 'Escape' && isOpen) {
      close();
    }
  }

  // Fallback helper to pull bullet list from either `details` or `bullets`
  let bulletItems = $derived(data?.details ?? data?.bullets ?? []);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div class="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
    <!-- Backdrop Overlay -->
    <button 
      type="button"
      transition:fade={{ duration: 200 }} 
      onclick={close} 
      class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm w-full h-full border-none cursor-default"
      aria-label="Close modal backdrop"
    ></button>

    <!-- Slide-over Drawer Panel -->
    <div 
      transition:fly={{ x: 600, duration: 300 }} 
      class="fixed inset-y-0 right-0 max-w-2xl w-full bg-white shadow-2xl border-l border-gray-200 flex flex-col z-10"
    >
      <!-- Header -->
      <div class="p-6 sm:p-8 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div>
          <span class="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-semibold">
            {data?.tag ?? 'Project Deep Dive'}
          </span>
          <h2 class="text-2xl font-bold font-serif text-gray-900 mt-0.5">
            {data?.title ?? 'Details'}
          </h2>
          {#if data?.subtitle}
            <p class="text-xs text-gray-600 font-medium mt-1">{data.subtitle}</p>
          {/if}
        </div>
        <button 
          type="button"
          onclick={close} 
          class="w-9 h-9 rounded-full bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-all cursor-pointer"
          aria-label="Close panel"
        >
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <!-- Content Body -->
      <div class="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-gray-700 text-xs sm:text-sm leading-relaxed">
        
        <!-- Tech Stack Tags -->
        {#if data?.techStack && data.techStack.length > 0}
          <div class="space-y-2">
            <h4 class="font-bold text-gray-900 uppercase tracking-wider text-[11px]">Tech Stack</h4>
            <div class="flex flex-wrap gap-2">
              {#each data.techStack as tech}
                <span class="px-2.5 py-1 text-xs font-mono font-medium rounded border border-gray-200 bg-gray-100 text-gray-800">
                  {tech}
                </span>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Project Links (Optional GitHub / Live Demo) -->
        {#if data?.links && (data.links.github || data.links.demo)}
          <div class="flex items-center gap-3 pt-1">
            {#if data.links.github}
              <a 
                href={data.links.github} 
                target="_blank" 
                rel="noopener noreferrer" 
                class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded border border-gray-300 bg-white text-gray-800 text-xs font-semibold hover:bg-gray-100 transition-colors"
              >
                <i class="fa-brands fa-github text-sm"></i>
                <span>Source Code</span>
              </a>
            {/if}
            {#if data.links.demo}
              <a 
                href={data.links.demo} 
                target="_blank" 
                rel="noopener noreferrer" 
                class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors"
              >
                <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                <span>Live Demo</span>
              </a>
            {/if}
          </div>
        {/if}

        <!-- Overview Block -->
        {#if data?.overview}
          <div class="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
            <h4 class="font-bold text-gray-900 uppercase tracking-wider text-[11px]">Overview</h4>
            <p>{data.overview}</p>
          </div>
        {/if}

        <!-- Key Highlights / Bullets -->
        {#if bulletItems.length > 0}
          <div class="space-y-3">
            <h3 class="text-base font-bold text-gray-900 font-serif">Key Highlights</h3>
            <ul class="space-y-2.5 list-disc list-inside text-gray-700">
              {#each bulletItems as item}
                <li>{item}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
        <button 
          type="button"
          onclick={close} 
          class="px-5 py-2 rounded bg-gray-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-gray-800 transition-colors cursor-pointer"
        >
          Close Panel
        </button>
      </div>
    </div>
  </div>
{/if}