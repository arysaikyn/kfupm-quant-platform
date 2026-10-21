# `data/`

Owner lane: data.

## Belongs here

- Vendor ingestion and retries.
- Normalization to one schema.
- Point-in-time snapshots, trading calendars, corporate actions, and delisting flags.
- Data-quality checks that fail loud.

## Does not belong here

- Factors, backtests, or UI code.
- Raw vendor files in git. Use `data/raw/`, which is ignored.
- Filled values for missing data.

## First output

One normalized daily snapshot for one market, with a documented schema and a row count.

## Read first

- `../docs/decisions/0005-one-engine-per-market-config.md`
- `../docs/ops/secrets.md`
