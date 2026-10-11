import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import adapter from '@sveltejs/adapter-vercel';

sveltekit({
  adapter: adapter()
})

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      alias: {
        '$lib': 'src/lib',
        '$lib/*': 'src/lib/*'
      }
    })
  ]
});
