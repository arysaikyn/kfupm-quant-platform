# AGENTS.md

Working contract. Read this first.

## What this is

A retail quant research platform. The user asks in plain language. The system turns the question into explicit rules, tests the rules on history, and explains the result.

Decision support only. No trade execution, no broker, no stock advice.

## Hard rules

- Cross-sectional stock selection only.
- The engine computes every number. The language model translates and explains; it never computes a number.
- The Sharia screen is a filter before ranking. `unknown` is not compliant.
- One engine. Market differences live in config, not in branches.
- `model/signals.json` is the only data contract for `web/`. See `model/CONTRACT.md`.
- Keep secrets, raw vendor data, and generated output out of git.

## Repo

| Path | What |
|---|---|
| `agent/` | Question -> strategy spec -> engine call -> explanation |
| `data/` | Ingestion and point-in-time data |
| `model/` | Factors, screens, backtest; writes `model/signals.json` |
| `web/` | UI; reads `model/signals.json` only |
| `docs/product.md` | Thesis, scope, landscape, competition |

Three writers. One owner per product directory; `docs/` is shared. Only Arys merges to `main`.

## Work

1. Branch: `agent/<slug>`.
2. Change the smallest thing that works. Reuse before adding.
3. Run `make check`. Exercise the changed path. A compile is not proof.
4. Commit with `INTENDED / ACTUAL / DRIFT / VERIFIED`.
5. Update the doc that owns the changed fact. One fact, one home.

Done means: the path ran, `make check` passes, and the diff has no unrelated change.

## Read

| File | When |
|---|---|
| `docs/product.md` | Product, scope, or positioning question |
| `model/CONTRACT.md` | Touching `model/signals.json` or `web/` |
