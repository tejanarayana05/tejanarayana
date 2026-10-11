import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import adapter from '@sveltejs/adapter-vercel';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      adapter: adapter()
    })
  ]
});
