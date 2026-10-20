# 0005 — One engine, per-market config

Status: accepted
Date: 2026-10-21

## Context

China and Saudi Arabia differ in trading calendar, transaction costs, universe, and Sharia rules. A fork per market doubles the code and the bugs. A branch on the market inside a factor hides the difference from the config and the tests.

## Decision

One engine serves every market. Market differences live in config: universe, calendar, cost model, currency, and the Sharia rule set. Factor and backtest code reads config; it does not branch on a market name.

## Consequences

- A market is data, not a code path.
- The config format needs a schema before the second market lands.
- Tests run the same strategy on two configs and compare the differences.
- A market-specific rule that cannot be expressed in config is a design problem, not an `if` statement.
