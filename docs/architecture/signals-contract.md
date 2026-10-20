# Signals contract

`model/signals.json` is the only data contract between the model and the web app. The web app reads no other file for numbers.

## Rules

- Producer: `model/`.
- Consumers: `web/` and `agent/`.
- One file per run. The model may overwrite it.
- `run_id` changes on every run. The web must not reuse a cached file across `run_id` values.
- The file is generated. It is not committed. `model/signals.example.json` is the tracked example.
- Schema: `signals.schema.json`. Validation: `make doctor`.
- A breaking change bumps `schema_version` and updates the schema, the example, the producer, the consumer, and this document in one commit.
- An additive field is allowed when the consumer ignores it and the schema stays backward compatible.

## Fields

| Field | Type | Meaning |
|---|---|---|
| `schema_version` | string | Contract version. Current: `1.0`. |
| `run_id` | string | Unique id for this run. Use it to bust caches. |
| `generated_at` | date-time | When the model wrote the file, UTC. |
| `as_of` | date | The decision date. The ranking uses data known on this date. |
| `market` | enum | `cn_a`, `hk`, `us`, or `sa`. |
| `query` | string | The user question, verbatim. |
| `rules` | object | Active rule set. `sharia`: `off` or `compliant_only`. |
| `rows` | array | Ranked stocks. Empty is valid. |
| `backtest` | object | Optional. Present when the run tested history. |
| `warnings` | array | Human-readable limits, missing data, or demo notices. |

### Row fields

| Field | Type | Meaning |
|---|---|---|
| `symbol` | string | Vendor symbol, including exchange suffix when the vendor uses one. |
| `name` | string | Display name. |
| `rank` | integer | 1 is the top pick. Ranks are unique within a run. |
| `score` | number | Composite score. Higher is better. Not comparable across different specs. |
| `factors` | object | Factor name to value. The factor document defines the transform. |
| `sector` | string | Optional sector label. |
| `sharia` | enum | Optional. `compliant`, `non_compliant`, or `unknown`. Required when `rules.sharia` is `compliant_only`. |
| `weight` | number | Optional. Portfolio weight in `[0, 1]`. Weights in a run sum to 1 when present. |

### Backtest fields

| Field | Type | Meaning |
|---|---|---|
| `start`, `end` | date | Test window. |
| `rebalance` | enum | `D`, `W`, `M`, `Q`, or `A`. |
| `metrics` | object | Required keys: `annual_return`, `max_drawdown`, `sharpe`. Extra metrics are numbers. |
| `equity_curve` | array | Optional. `{date, value}` points, value is the growth of 1. |

## Units

- Dates use ISO 8601 (`YYYY-MM-DD`). Timestamps use UTC (`...Z`).
- Returns and drawdowns are decimals: `0.12` means 12%.
- `max_drawdown` is zero or negative: `-0.18` means an 18% peak-to-trough loss.
- `sharpe` states its risk-free assumption in `warnings` when the value is not zero.
- `score` and `factors` are unitless. The factor document owns their definition.
- Currency is the market currency. Do not mix currencies in one file.

## What is not in the file

- Prose explanations. The agent returns them in the chat response.
- Any number the engine did not compute.
- Raw vendor rows. Only derived values.
- Personal data or account data.
