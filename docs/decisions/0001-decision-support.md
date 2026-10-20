# 0001 — Decision support, not execution

Status: accepted
Date: 2026-10-21

## Context

Retail investors want stock ideas. Regulators in China and Saudi Arabia restrict advice and execution. The team's compliance position, stated by Charles on 2026-10-13, is "tools, not conclusions".

## Decision

The product selects and tests. It does not execute orders, connect to a broker, or recommend a stock. Every result shows the rule, the data window, and the limits.

## Consequences

- No broker integrations, order objects, or account custody.
- The UI says "decision support" and never "buy".
- The Sharia screen and the backtest evidence carry the trust burden.
- A feature that needs a recommendation to be useful is out of scope.
