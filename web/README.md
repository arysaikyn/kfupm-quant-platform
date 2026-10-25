# Quant Desk — web

A plain-language screen that turns a sentence into rules, a test and a
readable result. The AI tab is backed by the local **Vibe-Trading** agent via
`../backend`; the market and news screens still use local demo data
(`src/data/mock.ts`).

## Run

```bash
npm install
npm run dev
```

Production check:

```bash
npm run typecheck
npm run build
npm run design          # Hallmark sloplint, ratcheted by design-baseline.json
npm run test            # unit/component tests (Vitest)
npm run test:e2e        # route matrix + AI stream (Playwright, system Chrome)
```

## Routes

Five tabs: markets (`/`), news (`/news`), AI (`/ai`), strategies
(`/strategy`), profile (`/me`). Deeper screens: symbol, article, strategy
detail, report, screener, alerts, review, calendar, compare, runs, glossary,
search, sector, watchlists, settings, and a real 404.

## Structure

- `src/App.tsx` — shell, route titles, focus hand-off, offline banner, 404.
- `src/routes/<screen>/` — one folder per screen: `index.tsx` + `strings.ts`.
- `src/components/` — shell primitives (`Screen`, `TabBar`, `Sheet`, …).
- `src/i18n/` — typed zh/en/ar dictionaries, number/date/plural formatting.
- `src/store/` — local-first state (`prefs`, `user`, `alerts`).
- `src/api/ai.ts` — the session/SSE and workspace client for the local AI backend.
- `src/data/` — mock universe for the non-AI screens.
- `src/theme.tsx` — dark, light, or system; resolved before first paint by
  the inline script in `index.html`.
- `public/` — manifest, icons and the offline shell worker.

## Rules the code follows

- Numbers are formatted through `src/i18n` (`fmtNum`, `fmtPct`), never hand-built.
- Layout uses logical properties; Arabic switches direction without a reload.
- The AI thread is local (`localStorage`, version 2) and its ids survive reloads.
- Offline shows a banner and keeps the last local state; it never fakes a refresh.
- Demo data is labelled as demo wherever a real product would claim a run.
