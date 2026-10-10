# Istaqim — استقم

Arabic RTL Islamic companion PWA for Damanhour, with offline-first worship tools and source-cited religious content.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/istaqim run dev` — run the Istaqim web app
- `pnpm --filter @workspace/istaqim run typecheck` — typecheck Istaqim
- `PORT=21138 BASE_PATH=/ pnpm --filter @workspace/istaqim run build` — build Istaqim
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Web: React and Vite, in `artifacts/istaqim`
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/istaqim/src/App.tsx` — Arabic RTL navigation, the 29-area catalog, and local tool screens.
- `artifacts/istaqim/src/lib/islamic-calculations.ts` — Damanhour prayer-time estimates and Qibla bearing.
- `artifacts/istaqim/src/lib/reminders.ts` and `local-storage.ts` — foreground reminders and local persistence.
- `artifacts/istaqim/public/manifest.webmanifest` and `sw.js` — PWA install metadata and offline shell caching.
- `artifacts/istaqim/data/` — raw source datasets and bundled JSON content.
- `artifacts/istaqim/scripts/fetch-*.js` — reproducible download scripts for religious source data.

## Architecture decisions

- Keep the Arabic RTL, dark-green/gold design and offline-first behavior.
- Treat religious data as source material: preserve each source's wording and attribution.
- The Damanhour prayer times are approximate calculations, not locally verified mosque times.

## Product

The app has 29 top-level Islamic and worship areas. Prayer/Qibla calculations, worship tracking, Tasbeeh/Salawat counters, and foreground reminders are local tools. Do not describe source-dependent sections as complete until their verified content or provider is present.

## Permanent user rules

1. Never write or generate Quran verses, hadith texts, adhkar, duas, or fatwas from memory. Only download them from verified open sources using `scripts/fetch-*.js`, save raw output under `artifacts/istaqim/data/`, and show the source name, URL, and license in an in-app `المصادر` page.
2. Do not modify, re-diacritize, or “fix” downloaded religious text. If a source is unreachable, stop and report it; never fill gaps with invented text.
3. Educational sections (Seerah, fiqh, etc.) must be short and neutral, name a reference book, and show the badge `ملخص تعليمي`. Avoid disputed rulings; where the four madhhabs differ, say so.
4. Remove every `قيد الإعداد` / `يحتاج مزود` placeholder. A section either has real content or is hidden from the home screen.
5. Work offline-first: bundle data as app JSON, lazy-load large files, and preserve the RTL layout and current design.
6. After each task, run the app, check for errors, commit, and report in 10 lines max: what is done, pending, and failed.
7. Do not start publishing or Android packaging unless the user asks.

## Gotchas

- Do not infer religious-text accuracy from a successful build; verify source, license, references, and exact downloaded text.
- Do not publish or package an APK/AAB as a finished app while requested content is still absent.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
