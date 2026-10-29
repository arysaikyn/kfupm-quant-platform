# Quant Desk — web

A plain-language screen that turns a sentence into rules, a test and a
readable result. The AI tab opens in **demo mode** with pre-recorded replies; it
does not use a developer key or contact a provider. Add your own
base API URL, model and key at `/ai/provider` to use the local
**Vibe-Trading** agent through `../backend`. Market and news screens use local
demo data (`src/data/mock.ts`).

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

Six folders, one job each. The rule that keeps them apart: **a module lives
where its owner is, and an arrow only points down.** A screen may import from
`lib`, `store`, `data`, `components` and `i18n`; none of those may import from
`routes/`.

- `src/App.tsx` — shell, focus hand-off, offline banner, 404.
- `src/screens.ts` — the one table of screens: pattern, title key, tab, sample
  path, chunk loader. The router, the tab bar and the e2e route matrix all read
  it, so adding a screen is one row plus its translations.
- `src/routes/<screen>/` — one folder per screen: `index.tsx`, `strings.ts`, and
  the screen's own widgets. A component used by exactly one screen belongs here,
  not in `components/`.
- `src/components/` — UI used by more than one screen, plus shell chrome
  (`Screen`, `TabBar`, `ErrorBoundary`, `ReceiptCard`, `GridCheck`).
- `src/lib/` — pure logic with no React: `gridcheck` (the product's rules),
  `ledger` (the Sharia-then-rank engine), `screener` (the screen model),
  `refusal`, `chips`, `stats`, `positions`, `freshness`.
- `src/store/` — persisted client state and its React binding: `prefs`, `user`,
  `alerts`, `paper`, `screens`, `watchlists`, `aiIntake`, `aiMode` hooks.
- `src/data/` — the fixtures and the tables that own a fact: `mock` (quotes,
  strategies, news), `fundamentals`, `shariaCoverage` (AAOIFI limits),
  `markets` (board → venue), `costs` (the cost model), `membership`.
- `src/api/` — the HTTP boundary. `request(path, parse)` takes a parser from
  `parse.ts`; nothing is cast to a type. `errors.ts` holds the one error class.
- `src/i18n/` — typed zh/en/ar dictionaries, number/date/plural formatting.

Two habits this layout depends on:

1. **One fact, one owner.** The AAOIFI caps live in `data/shariaCoverage`; the
   cost model in `data/costs`; the symbol→quote lookup in `data/mock`. A second
   copy is a bug even when the numbers match today.
2. **Values that must agree are one record.** `Field` is the key of a single
   `FIELD_*` table per concern, and a `Record<Field, …>` that fails to list a
   new field fails the build.
- `src/api/ai.ts` — the session/SSE and workspace client for the local AI backend.
- `src/data/` — mock universe for the non-AI screens.
- `src/theme.tsx` — dark, light, or system; resolved before first paint by
  the inline script in `index.html`.
- `public/` — manifest, icons and the offline shell worker.

## Rules the code follows

- Numbers are formatted through `src/i18n` (`fmtNum`, `fmtPct`), never hand-built.
- Layout uses logical properties; Arabic switches direction without a reload.
- The AI thread is local (`localStorage`, version 2) and its ids survive reloads.
- Demo sessions are local too; switching demo ↔ live resets the thread, not the UI.
- Offline shows a banner and keeps the last local state; it never fakes a refresh.
- Demo data is labelled as demo wherever a real product would claim a run.
