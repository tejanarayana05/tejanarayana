---
name: portfolio-ui-design
description: Visual design rules for Teja Narayana's Product + AI + Engineering portfolio. Use when building or revising any portfolio UI surface.
---

# Portfolio UI Design Skill

## Brand

- Person: **Teja Narayana**
- Role signal: Product Engineer
- Positioning: product thinking × software engineering × AI
- Email: t@aejt.in
- GitHub: https://github.com/tejanarayana05/
- LinkedIn: https://www.linkedin.com/in/teja-na
- Site voice: sharp, concise, human — never corporate filler

## Hard composition rules

1. First viewport = one composition (not a dashboard).
2. Brand first: "Teja Narayana" is a hero-level signal, not nav-only text.
3. Hero budget: brand, one headline, one short supporting sentence, one CTA group, one dominant visual plane.
4. Full-bleed hero visual (edge-to-edge). No inset hero cards, floating badges, or overlays.
5. Default: no cards. Cards only when they contain a real interaction.
6. One job per section. One headline. One short supporting line.
7. Mobile-first. Touch targets ≥ 44px. Nav collapses cleanly.
8. Ship 2–3 intentional motions (entrance, hover, ambient), not decorative noise.

## Visual direction — "Signal Field"

Avoid purple gradients, cream+terracotta, broadsheet, dark-mode default, glow spam, emoji, Inter/Roboto/Arial.

**Palette (CSS variables):**
- `--ink`: #0f1419 (near-black ink)
- `--paper`: #f3efe6 (warm paper — used sparingly as field, not flat fill)
- `--field`: #e7edf2 → #d5e4ec gradient atmosphere
- `--signal`: #0d9488 (teal signal accent)
- `--signal-hot`: #ea580c (sparse orange spark for AI energy)
- `--mute`: #5b6570
- `--line`: rgba(15, 20, 25, 0.12)

**Typography:**
- Display / brand: "Syne" (expressive, geometric)
- Body / UI: "Sora" (clean technical)
- Load via Google Fonts; never system UI stacks as primary.

**Atmosphere:**
- Soft diagonal field gradients + subtle SVG mesh / grid as the hero visual plane
- Prefer light atmosphere with ink type
- Accent used for CTAs and active nav, not large fills

## Content priorities for landing

Use authentic bio from aejt.in journey — not fabricated senior case studies/talks:

- Product Engineer at GXCO (May 2026)
- Product Analyst internship (Sept 2025)
- Exploring product + engineering + AI (2025)
- Engineering graduation (2024)
- IEEE paper: Hybrid VGG19 + LSTM for brain tumor classification
- ACM Winter School AI/ML at IIT Patna
- Writing: pathlib / Rich articles
- Contact CTA

Landing should feel visual and scannable — far less text than the old site.
