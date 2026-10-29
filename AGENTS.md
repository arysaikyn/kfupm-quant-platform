# AGENTS.md

A retail quant research platform. The user asks in plain language. The system turns the question into explicit rules, tests them on history, and explains the result.

Decision support only. No execution, broker, or stock advice.

## Rules

- Cross-sectional stock selection only.
- The engine computes every number. The language model translates and explains; it never computes.
- The Sharia screen is a filter before ranking. `unknown` is not compliant.
- One engine; market differences live in config.
- One fact, one owner, in code as in docs: the AAOIFI caps, the cost model, the board table and the symbol lookup each live in one module, and a second copy is a bug even when the numbers match.
- `model/signals.json` is the only data contract for `web/`. Schema: `model/signals.schema.json`. Example: `model/signals.example.json`.
- No strategy may carry a stop-loss, take-profit, or entry-price field. Exits happen by rank. `web/src/lib/gridcheck.ts` scores every rule set and every saved strategy for grid likeness (`priceOnly`, `noExitPolicy`, `volHarvest`, `stopHurts`), and a `gridlike` verdict must be shown before the result — never presented as a strategy.
- No secrets, raw vendor data, or generated output in git. The Vibe-Trading key stays in `backend/`, never in `web/`.

## Layout

`agent/` question -> spec -> engine -> explanation. `data/` ingestion. `model/` factors, screens, backtest. `web/` UI. `backend/` local AI proxy in front of Vibe-Trading. `docs/product.md` product and scope.

Inside `web/src` the arrows point one way: `routes/` and `screens.ts` sit on top, and `lib/`, `store/`, `data/`, `components/`, `i18n/`, `api/` never import from `routes/`. A widget used by one screen lives in that screen's folder. A new screen is one row in `src/screens.ts` plus its translations — the router, the tab bar and the e2e route matrix read that table, so they cannot disagree. `web/README.md` states the full contract.

Three writers. One owner per product directory; `docs/` shared. Only Arys merges to `main`.

## Work

1. Branch `agent/<slug>`.
2. Smallest working change. Reuse before adding.
3. Run the changed path. A compile is not proof. `npm run design` is the
   design gate: it lints every source file with Hallmark and fails if the
   FAIL count grows past `design-baseline.json`.
4. Commit with `INTENDED / ACTUAL / DRIFT / VERIFIED`.
5. Update the doc that owns the fact. One fact, one home.

Read `docs/product.md` for product and scope. Read `model/signals.schema.json` for the interface.
