# `model/`

Owner lane: model.

## Belongs here

- Factor definitions and computation.
- Screens, including the Sharia screen.
- Backtest engine, cost model, and metrics.
- The signals writer and its validation.

## Does not belong here

- Language-model calls or prompt text.
- UI code.
- Raw ingestion. Read the normalized snapshot from `data/`.

## First output

One factor and one backtest that write a schema-valid `model/signals.json` for a named snapshot.

## Read first

- `CONTRACT.md`
- `signals.schema.json`
- `../docs/decisions/0004-sharia-screen-is-a-filter.md`
- `../docs/decisions/0005-one-engine-per-market-config.md`
