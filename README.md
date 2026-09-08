# Teja Narayana — Portfolio

Personal portfolio for **Teja Narayana**, Product Engineer working at the intersection of product, AI, and engineering.

Built with **SvelteKit**, **Svelte 5**, and **Tailwind CSS v4**.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173) (Vite’s default port).

## Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Dev server on port **5173**    |
| `npm run build`   | Production build               |
| `npm run preview` | Preview build on port **4173** |
| `npm run check`   | Typecheck with svelte-check    |
| `npm run lint`    | Prettier + ESLint              |
| `npm run format`  | Format with Prettier           |

## Stack

- SvelteKit + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Typography plugin for long-form content hooks
- Three.js neon tubes cursor trail (FreeFrontend TubesCursor-style)

## Visual

Every page uses a black background with a global **neon 3D tubes cursor trail**. Move the pointer and glowing tubes follow as a wave; click to reshuffle colors. The effect mounts once in the root layout, so every route/component inherits it automatically.
