<script>
  import Drawer from "#lib/components/Drawer.svelte";

  import { resumeData } from "#lib/data/resumeData.js";

  /** @type {import('#lib/data/resumeData.js').DeepDiveItem | null} */

  let selectedSection = $state(null);

  let isDrawerOpen = $state(false);

  let isCopied = $state(false);

  /** @param {string} key */

  function handleOpenDrawer(key) {
    if (resumeData.deepDives[key]) {
      selectedSection = resumeData.deepDives[key];

      isDrawerOpen = true;
    }
  }

  function handleCloseDrawer() {
    isDrawerOpen = false;
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(resumeData.personal.email);

      isCopied = true;

      setTimeout(() => {
        isCopied = false;
      }, 2000);
    } catch (err) {
      console.error("Failed to copy email: ", err);
    }
  }
</script>

<svelte:head>
  <title>{resumeData.personal.name}'s space</title>
</svelte:head>

<main
  class="max-w-6xl mx-auto my-0 sm:my-8 bg-white shadow-2xl sm:border border-warm-border min-h-screen flex flex-col"
>
  <div class="grid grid-cols-1 md:grid-cols-12 flex-1">
    <!-- LEFT SIDEBAR -->

    <aside
      class="md:col-span-4 border-r border-warm-border flex flex-col justify-between"
    >
      <div>
        <!-- Profile Image -->

        <div
          class="w-full aspect-square overflow-hidden bg-espresso-500/10 relative group border-b border-warm-border"
        >
          <img
            src={resumeData.personal.photoUrl}
            alt={resumeData.personal.name}
            class="w-full h-full object-cover object-center grayscale hover:grayscale-0 transition-all duration-700"
          />
        </div>

        <!-- Mobile Name Header -->
        <header class="md:hidden p-6 border-b border-warm-border">
          <h1
            class="text-3xl font-black uppercase tracking-tight text-espresso-900 leading-none font-serif"
          >
            {resumeData.personal.firstName}<br />
            {resumeData.personal.lastName}
          </h1>

          <p class="text-xs text-espresso-700 leading-relaxed pt-3">
            {resumeData.personal.summary}
          </p>
        </header>

        <div class="p-8 space-y-8">
          <!-- CONTACT DETAILS -->

          <div class="space-y-4">
            <h2 class="text-lg font-bold text-espresso-900 font-serif">
              Contact
            </h2>

            <div class="space-y-2 text-xs sm:text-sm text-espresso-700">
              <p class="font-medium text-espresso-900">
                {resumeData.personal.address}
              </p>

              <p>{resumeData.personal.phone}</p>

              <button
                type="button"
                onclick={copyEmail}
                class="text-espresso-900 hover:underline text-left block"
              >
                {resumeData.personal.email}
              </button>

              <p>
                <a
                  href={resumeData.personal.website}
                  target="_blank"
                  rel="noreferrer"
                  class="hover:underline">{resumeData.personal.website}</a
                >
              </p>

              <!-- Social Media Links (Bigger icons) -->

              <div
                class="flex items-center gap-4 pt-3 text-2xl text-espresso-700"
              >
                {#if resumeData.socials?.linkedin}
                  <a
                    href={resumeData.socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn Profile"
                    class="hover:text-espresso-900 transition-colors"
                  >
                    <i class="fa-brands fa-linkedin"></i>
                  </a>
                {/if}

                {#if resumeData.socials?.github}
                  <a
                    href={resumeData.socials.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub Profile"
                    class="hover:text-espresso-900 transition-colors"
                  >
                    <i class="fa-brands fa-github"></i>
                  </a>
                {/if}

                {#if resumeData.socials?.x}
                  <a
                    href={resumeData.socials.x}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="X (Twitter) Profile"
                    class="hover:text-espresso-900 transition-colors"
                  >
                    <i class="fa-brands fa-x-twitter"></i>
                  </a>
                {/if}

                {#if resumeData.socials?.instagram}
                  <a
                    href={resumeData.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram Profile"
                    class="hover:text-espresso-900 transition-colors"
                  >
                    <i class="fa-brands fa-instagram"></i>
                  </a>
                {/if}
              </div>

              <!-- Download PDF Button -->

              <div class="pt-3">
                <a
                  href={resumeData.personal.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded border border-warm-border bg-espresso-800 hover:bg-espresso-900 text-cream-100 text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
                >
                  <i class="fa-solid fa-file-pdf text-sm"></i>

                  <span>Download Resume</span>
                </a>
              </div>
            </div>
          </div>

          <hr class="border-t border-warm-border" />

          <!-- Skills Summary -->

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-bold text-espresso-900 font-serif">
                Skills
              </h2>

              <button
                type="button"
                onclick={() => handleOpenDrawer("skills")}
                class="text-[11px] uppercase tracking-wider font-semibold text-espresso-500 hover:text-espresso-900 flex items-center gap-1 transition-colors"
              >
                Expand <i
                  class="fa-solid fa-arrow-up-right-from-square text-[9px]"
                ></i>
              </button>
            </div>

            <ul
              class="space-y-2 text-xs text-espresso-800 list-disc list-inside"
            >
              {#each resumeData.skills.highlights as skill}
                <li>{skill}</li>
              {/each}
            </ul>
          </div>

          <hr class="border-t border-warm-border" />

          <!-- Education Summary -->

          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-bold text-espresso-900 font-serif">
                Education
              </h2>

              <button
                type="button"
                onclick={() => handleOpenDrawer("education")}
                class="text-[11px] uppercase tracking-wider font-semibold text-espresso-500 hover:text-espresso-900 flex items-center gap-1 transition-colors"
              >
                Expand <i
                  class="fa-solid fa-arrow-up-right-from-square text-[9px]"
                ></i>
              </button>
            </div>

            <div class="space-y-3 text-xs">
              {#each resumeData.education as edu}
                <div>
                  <h3 class="font-bold text-espresso-900">{edu.institution}</h3>

                  <p class="text-espresso-700 font-medium">{edu.degree}</p>

                  <p class="text-espresso-500 text-[11px] mt-0.5">
                    — {edu.date}
                  </p>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar Copy Email Button Block -->

      <div class="p-6 border-t border-warm-border bg-[#F5EFE1]/50 text-center">
        <button
          type="button"
          onclick={copyEmail}
          class="text-xs font-semibold text-espresso-800 hover:text-espresso-900 flex items-center justify-center gap-2 w-full py-2 px-3 rounded border border-warm-border bg-white/50 hover:bg-white transition-all cursor-pointer"
        >
          {#if isCopied}
            <i class="fa-solid fa-check text-green-700"></i>

            <span class="text-green-700">Email Copied!</span>
          {:else}
            <i class="fa-regular fa-envelope"></i>

            <span>Copy Email Address</span>
          {/if}
        </button>
      </div>
    </aside>

    <!-- RIGHT MAIN CONTENT -->

    <section class="md:col-span-8 p-6 sm:p-8 space-y-5 flex flex-col">
      <div class="space-y-5">
        <!-- NAME & SUMMARY HEADER -->

        <header class="hidden md:block space-y-3 pb-2">
          <h1
            class="text-3xl sm:text-4xl font-black uppercase tracking-tight text-espresso-900 leading-none font-serif"
          >
            {resumeData.personal.firstName}<br />{resumeData.personal.lastName}
          </h1>

          <p class="text-xs sm:text-sm text-espresso-700 leading-relaxed pt-1">
            {resumeData.personal.summary}
          </p>
        </header>

        <!-- Work Experience Section -->

        <div class="space-y-4 pt-3">
          <div
            class="flex items-center justify-between border-b border-warm-border pb-2"
          >
            <h2 class="text-2xl font-bold text-espresso-900 font-serif">
              Work Experience
            </h2>

            <span class="text-xs text-espresso-500 font-mono"
              >2040 — Present</span
            >
          </div>

          {#each resumeData.experience as role}
            <button
              type="button"
              onclick={() => handleOpenDrawer(role.id)}
              class="w-full text-left p-4 rounded-lg border border-transparent hover:border-warm-border interactive-card space-y-2 cursor-pointer group block"
            >
              <div
                class="flex flex-col sm:flex-row sm:items-center justify-between gap-1"
              >
                <h3
                  class="text-base font-bold text-espresso-900 group-hover:text-espresso-700"
                >
                  {role.title}

                  <span class="font-normal text-espresso-600"
                    >| {role.company}</span
                  >
                </h3>

                <span class="text-xs font-semibold text-espresso-700 font-mono"
                  >{role.dates}</span
                >
              </div>

              <ul
                class="space-y-2 text-xs sm:text-sm text-espresso-800 list-disc list-inside"
              >
                {#each role.bullets as bullet}
                  <li>{bullet}</li>
                {/each}
              </ul>

              <div
                class="pt-2 flex items-center justify-end text-xs font-semibold text-espresso-700"
              >
                <span>View Full Details</span>

                <i class="fa-solid fa-arrow-right ml-1.5 text-[10px]"></i>
              </div>
            </button>
          {/each}
        </div>

        <!-- Projects Section -->

        <div class="space-y-6 pt-6">
          <div
            class="flex items-center justify-between border-b border-warm-border pb-2"
          >
            <h2 class="text-2xl font-bold text-espresso-900 font-serif">
              Projects
            </h2>
          </div>

          {#each resumeData.projects as project}
            <button
              type="button"
              onclick={() => handleOpenDrawer(project.id)}
              class="w-full text-left p-5 rounded-lg border border-transparent hover:border-warm-border interactive-card space-y-3 cursor-pointer group block"
            >
              <div
                class="flex flex-col sm:flex-row sm:items-center justify-between gap-1"
              >
                <h3
                  class="text-base font-bold text-espresso-900 group-hover:text-espresso-700"
                >
                  {project.title}

                  {#if project.subtitle}
                    <span class="font-normal text-espresso-600">
                      | {project.subtitle}</span
                    >
                  {/if}
                </h3>

                <span class="text-xs font-semibold text-espresso-700 font-mono"
                  >{project.dates}</span
                >
              </div>

              <ul
                class="space-y-2 text-xs sm:text-sm text-espresso-800 list-disc list-inside"
              >
                {#each project.bullets as bullet}
                  <li>{bullet}</li>
                {/each}
              </ul>

              <div
                class="pt-2 flex items-center justify-end text-xs font-semibold text-espresso-700"
              >
                <span>View Details & Tech Stack</span>

                <i class="fa-solid fa-arrow-right ml-1.5 text-[10px]"></i>
              </div>
            </button>
          {/each}
        </div>
      </div>
    </section>
  </div>
</main>

<Drawer
  isOpen={isDrawerOpen}
  data={selectedSection}
  onclose={handleCloseDrawer}
/>
