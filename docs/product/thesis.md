# Product thesis

## One line

A retail investor asks a question in plain language. The system turns the question into explicit rules, tests those rules on history, and explains the result in words the investor can check.

## The loop

| Step | What the user sees | What the system does |
|---|---|---|
| Ask | A chat box | Takes the question as written |
| Translate | The rule in plain language and in structured form | Produces a strategy spec: universe, filters, factors, weights, rebalance |
| Test | Picks, equity curve, drawdown, costs | Runs the spec on point-in-time history |
| Explain | Why these names, what failed, what would break it | Reports the evidence and the limits |

The loop is the product. A list of names is not the product.

## The problem

Retail tools stop at one of two places:

1. A screener returns a list. It does not say whether the idea worked before, or how it fails.
2. A research notebook can test an idea. It requires code, data handling, and backtest knowledge that most retail investors do not have.

The missing step is verification at retail level: turn an idea into rules, test the rules, and explain both the result and the limits.

## What we build

- **Factor library.** Documented, reproducible factors. Each factor states its formula, direction, and data window.
- **Research environment.** A natural-language workspace. The user states an idea; the agent writes the spec, not the user.
- **Backtest.** Costs, rebalancing, drawdown, turnover, and an honest verdict. No look-ahead. No survivorship bias.
- **Sharia screen.** A first-class filter with explicit rules, applied before the ranking.

## Who it is for

A retail investor with an idea and no quant workflow. They can read a financial statement and a news story. They cannot build a point-in-time dataset, write a backtest, or judge whether a 20% annual return is luck.

## Why now

- Language models can translate an intent into a structured spec with bounded error.
- Retail compute is enough to run a daily cross-section over years in seconds.
- Demand for Sharia-compliant products is a design constraint, not a niche filter.

## What is new

Three parts exist separately. The combination is the claim:

1. **Verification for retail.** A screener becomes a tested strategy with visible evidence.
2. **Two markets, one engine.** China and Saudi Arabia use the same engine with different rule sets.
3. **Rules are part of the engine.** Sharia compliance is a filter in the pipeline, not a badge on a page.

## The short form

The mouth of a natural-language screener, the brain of a strategy builder, the rules of a Sharia-first market.

## Non-goals

See `scope.md`. The product is decision support. It does not trade, does not recommend stocks, and does not predict prices.

## Provenance

Team meeting, 2026-10-13. Positioning research, 2026-10-21. Update this file when the thesis changes; record the reason in `docs/decisions/`.
