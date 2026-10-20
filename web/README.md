# `web/`

Owner lane: web.

## Belongs here

- Chat entry and strategy-spec display.
- Result views: picks, factors, equity curve, drawdown, warnings.
- Empty and error states.
- Rendering `model/signals.json` in development.

## Does not belong here

- Imports from `model/` or `data/`.
- Computed numbers. Every number comes from the signals file.
- A cached file reused across `run_id` values.

## First output

A page that renders `model/signals.example.json` and shows an explicit empty state when the file is absent.

## Read first

- `../docs/architecture/signals-contract.md`
- `../docs/decisions/0002-one-frontend-contract.md`
