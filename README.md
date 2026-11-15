# fabnow — Semiconductor Supply & AI Demand Intelligence

> **fabnow** tracks semiconductor wafer/node supply, HBM4/CoWoS advanced packaging bottlenecks, and frontier/neocloud AI compute demand — built on the **pstui** Human-centric Liquid Glass design system (`Next.js 16`, `React 19`, `Tailwind CSS v4`, `DaisyUI 5`) and configured for **Cloudflare Workers** via **vinext**.

---

## Key Capabilities & Routes

- **Unified Intelligence Workbench (`/`)**: Interactive semiconductor fab capacity, Foundry/Memory/Packaging supply constraints, and Frontier Lab & Neocloud GPU cluster demand tracker (`app/page.tsx`) with live `/api/fabnow` auto-refresh controls.
- **Parallel Intercepting Report Preview (`/@modal/(.)preview/[id]` & `/preview/[id]`)**: In-app modal report preview with full standalone SSR fallback across 26 tracked fab/packaging/AI entities (e.g., `/preview/tsmc-n3p-logic`, `/preview/tsmc-n2-ramp`).
- **Progressive RSC Streaming**: Server-side telemetry metrics (`lib/server/metrics.ts`) streamed smoothly through React 19 `<Suspense>` boundaries (`StreamingSkeleton.tsx`).
- **Installable Offline-First PWA**:
  - Full Web App Manifest (`app/manifest.ts` -> `/manifest.webmanifest` & `public/manifest.json`) with stable `id: "/"`, app shortcuts, wide/narrow Rich Install UI screenshots, SVG + PNG + maskable icons, and Apple touch icon (`public/apple-touch-icon.png`).
  - Resilient Service Worker (`public/sw.js`) with precached offline fallback (`public/offline.html`), stale-while-revalidate icons/manifest, cache-first immutable `/_next/static/` & `/assets/`, and network-first `/api/fabnow` live feed fallback caching.
  - Non-intrusive header install trigger (`AppShell.tsx` + `ClientRuntimeProvider.tsx`) supporting Web Install API (`navigator.install()`) and `beforeinstallprompt`.
- **pstui Liquid Glass & WCAG AA/AAA Tokens**: Floating translucent chrome (`AppShell`, `Sidebar`, `TabBar`), solid content surfaces (`Card`, tables, forms), soft pastel high-contrast accents, `NanumSquareNeo` webfont, and `prefers-reduced-motion` support (`styles/pstui-tokens.css`, `DESIGN.md`).
- **SEO, Feeds & Open Graph**:
  - Dynamic routes: `/robots.txt` (`app/robots.ts`), `/sitemap.xml` (`app/sitemap.ts`), `/feed.xml` (`app/feed.xml/route.ts`), `/rss.xml` (`app/rss.xml/route.ts`), `/manifest.webmanifest` (`app/manifest.ts`)
  - Static assets under `public/`: `robots.txt`, `sitemap.xml`, `manifest.json`, `offline.html`, `sw.js`, `icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `favicon.ico`, `og-image.png`, `llms.txt`, `llms-full.txt`, `humans.txt` (`public/ads.txt` is gitignored for owner-specific publisher deployment)

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **App Framework** | Next.js `16.4.3` App Router (`cacheComponents`, `partialPrefetching`) & React `^19.3.1` |
| **Edge Runtime (Cloudflare)** | `vinext` (`^1.4.5`), `@vinext/cloudflare` (`^1.3.4`), Vite `^8.3.0`, `@cloudflare/vite-plugin`, `cf` CLI |
| **Styling & Design System** | Tailwind CSS `v4` (`@tailwindcss/postcss` + `@tailwindcss/turbopack`), DaisyUI `5.7.50`, `pstui` Liquid Glass tokens |
| **State & UX** | `nuqs`, `next-view-transitions`, `@tanstack/react-virtual`, `server-only` |

---

## Getting Started

### Prerequisites
- Node.js `>= 20.0.0` (CI verified on Node `22`)
- npm

### Install Dependencies

```bash
npm install
```

### Run Locally (Next.js vs. vinext)

```bash
# Next.js dev server (Turbopack)
npm run dev

# vinext Vite dev server on port 3001
npm run dev:vinext
```

### Verification & Builds

```bash
# Compatibility scan for Cloudflare Workers / vinext
npx vinext check

# Lint & TypeScript checks
npm run lint
npm run typecheck

# Production build (Next.js)
npm run build

# Production Worker bundle build (Vite + vinext + Cloudflare)
npm run build:vinext

# Local Cloudflare Workers preview runtime
npm run start:vinext

# Combined validation gates
npm run check
npm run check:vinext

# Project asset & token integrity check (26 items)
npm run setup -- --check
```

### Environment Variables (Optional)

`fabnow` runs zero-login by default with zero required secrets. To override canonical `NEXT_PUBLIC_SITE_URL` origins (defaults to `https://fabnow.workers.dev`) or enable optional Firebase Auth templates in `context/AuthContext.tsx`, copy [`.env.example`](.env.example) to `.env.local`:

```bash
cp .env.example .env.local
```

> **Fork Note**: If you deploy a fork under your own analytics or AdSense account, update the Google Tag ID in `app/layout.tsx` and create your own gitignored `public/ads.txt` locally before building.

---

## Cloudflare Workers Architecture (`vinext`)

`fabnow` runs natively on Cloudflare Workers using `vinext` and `@cloudflare/vite-plugin` while preserving full `next build` compatibility:

- **`vite.config.ts`**: Configures `vinext({ cache: { cdn: workersCacheCdnAdapter() } })` alongside `cloudflare({ viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] } })`.
- **`cloudflare.config.ts`**: Declares the Worker (`name: "fabnow"`, `entrypoint: "vinext/server/fetch-handler"`, `compatibilityDate: "2026-11-14"`, `compatibilityFlags: ["nodejs_compat"]`), static `ASSETS` binding (`runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"]`), `createWorkersCacheConfig()`, and Workers Observability (logs & sampled traces).
- **`postcss.config.mjs`**: Enables `@tailwindcss/postcss` so Tailwind CSS v4 and DaisyUI 5 compile identically under Vite/PostCSS (`vite build`) and Next.js Turbopack (`next build`).
- **`next.config.ts`**: Keeps `images: { unoptimized: true }` for Cloudflare edge delivery without Node-only image optimizer binaries, along with security `headers()` and `experimental.optimizePackageImports`.
- **`tsconfig.json` & `eslint.config.mjs`**: Includes `.cloudflare/types` in TypeScript checks and ignores `.cloudflare/**`, `.vinext/**`, and `dist/**` during linting.

### Deploy to Cloudflare Workers

1. Authenticate with Cloudflare (`npx cf login` or configure `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`).
2. Generate Worker binding types if needed and verify compatibility:

```bash
npx cf workers types
npx vinext check
```

3. Build and deploy:

```bash
npm run deploy:vinext
```

(`vinext-cloudflare deploy` builds the Worker bundle into `.cloudflare/output/` and publishes via `cf` using `cloudflare.config.ts`.)

---

## Project Structure

```text
fabnow/
├── app/
│   ├── @modal/(.)preview/[id]/page.tsx  # Intercepting modal report view
│   ├── preview/[id]/page.tsx            # Standalone entity detail route
│   ├── feed.xml/route.ts                # Atom/RSS feed endpoint
│   ├── rss.xml/route.ts                 # RSS feed endpoint
│   ├── manifest.ts                      # Web App Manifest route
│   ├── robots.ts                        # Dynamic robots.txt route
│   ├── sitemap.ts                       # Dynamic XML sitemap (sections + 26 entity slugs)
│   ├── globals.css                      # Tailwind v4, DaisyUI 5, NanumSquareNeo, pstui token import
│   ├── layout.tsx                       # Root layout & font/metadata configuration
│   └── page.tsx                         # Main fabnow dashboard (RSC)
├── components/
│   ├── fabnow/                          # Semiconductor supply & AI demand intelligence modules
│   ├── layout/                          # AppShell, WorkbenchClient & responsive Liquid Glass chrome
│   ├── providers/                       # Client runtime guard & providers
│   └── ui/                              # pstui core components
├── context/                             # OverlayContext & shared client contexts
├── lib/
│   ├── data/fabnow.ts                   # Tracked foundry, memory, packaging & AI demand dataset
│   └── server/metrics.ts                # Server-only cached telemetry & KPI helpers
├── public/                              # robots.txt, sitemap.xml, llms.txt, llms-full.txt, humans.txt, sw.js, icons
├── styles/
│   └── pstui-tokens.css                 # Standalone pstui Liquid Glass & theme token stylesheet
├── cloudflare.config.ts                 # Cloudflare Workers configuration (cf/config)
├── vite.config.ts                       # Vite + vinext + @cloudflare/vite-plugin configuration
├── postcss.config.mjs                   # @tailwindcss/postcss configuration for Vite builds
├── next.config.ts                       # Next.js 16 configuration
├── setup.mjs                            # pstui manifest & asset integrity CLI
├── DESIGN.md                            # Design principles & token reference
└── AGENTS.md                            # Engineering rules for pstui / fabnow
```

---

## Open Source & Project Governance

- **Repository**: `https://github.com/hyeona35/fabnow`
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md) for local verification steps and design guidelines.
- **Security**: See [SECURITY.md](SECURITY.md) for responsible vulnerability reporting.
- **CI**: Automated checks (`setup.mjs --check`, `typecheck`, `lint`, `vinext check`, `build`, `build:vinext`) run via [ci.yml](.github/workflows/ci.yml).

---

## pstui CLI Utilities

`setup.mjs` also manages manifest hashes and downstream component exports for the underlying `pstui` design system:

- `npm run setup -- --check` — Verify dependencies, design tokens, Cloudflare configs, and 26 production SEO/PWA assets.
- `npm run manifest` — Recompute SHA-256 hashes in `pstui.manifest.json`.
- `npm run export` / `npm run sync` / `npm run update` — Export or non-destructively synchronize `pstui` components into another Next.js project.

---

## License & Disclaimer

Licensed under the **Apache License 2.0** (see [LICENSE](LICENSE) and [NOTICE](NOTICE)).

> **Trademark Disclaimer**: This project (`fabnow` and the underlying `pstui` design system) is an independent open-source software project and is **not affiliated with, endorsed by, or sponsored by Apple Inc.** References to Liquid Glass or Human Interface concepts describe general modern spatial UI conventions.
