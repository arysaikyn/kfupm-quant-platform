# KFUPM Quant Platform

A retail quant research platform. Ask in plain language; the system turns the question into rules, tests the rules on history, and explains the result.

**Status and next step:** see [`AGENTS.md`](AGENTS.md).

## The loop

1. Ask a question in plain language.
2. The agent turns it into an explicit strategy spec.
3. The engine runs it on point-in-time history.
4. The user sees the picks, the rule, the backtest, and the failure modes.

## The three parts

- **Factor library** — documented, reproducible signals.
- **Research environment** — a natural-language workspace, not a notebook.
- **Backtest** — costs, rebalancing, drawdown, and a plain-language verdict.

## Repo map

| Path | Contents |
|---|---|
| `agent/` | Natural-language layer: question -> strategy spec -> engine call -> explanation |
| `data/` | Ingestion and normalized point-in-time data |
| `model/` | Factors, screens, backtest engine; writes `model/signals.json` |
| `web/` | User interface; reads only `model/signals.json` |
| `docs/` | Product, architecture, decisions, plans, solutions |

## Start

```bash
make doctor
```

## Read next

- `AGENTS.md` — working contract
- `docs/product/thesis.md` — what we are building and why
- `model/CONTRACT.md` — the one data contract
- `docs/ops/workflow.md` — task protocol
