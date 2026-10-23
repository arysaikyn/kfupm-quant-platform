# AGENTS.md

A retail quant research platform. The user asks in plain language. The system turns the question into explicit rules, tests them on history, and explains the result.

Decision support only. No execution, broker, or stock advice.

## Rules

- Cross-sectional stock selection only.
- The engine computes every number. The language model translates and explains; it never computes.
- The Sharia screen is a filter before ranking. `unknown` is not compliant.
- One engine; market differences live in config.
- `model/signals.json` is the only data contract for `web/`. Schema: `model/signals.schema.json`. Example: `model/signals.example.json`.
- No secrets, raw vendor data, or generated output in git.

## Layout

`agent/` question -> spec -> engine -> explanation. `data/` ingestion. `model/` factors, screens, backtest. `web/` UI. `docs/product.md` product and scope.

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
