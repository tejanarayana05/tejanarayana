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

## Visual

The site uses a full-viewport **Schwarzschild black-hole raytracer** (Three.js / GLSL) as a fixed background on every page. Scroll interpolates the camera from a distant “poster” view toward the GARGANTUA **close** preset. No HUD, parameters, or OrbitControls are exposed.
