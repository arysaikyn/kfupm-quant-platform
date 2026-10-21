# Product

## One line

A retail investor asks in plain language. The system turns the question into explicit rules, tests them on history, and explains the result.

## Loop

Ask -> strategy spec -> point-in-time backtest -> plain-language result.

The loop is the product. A list of names is not.

## Build

- **Factor library.** Documented, reproducible factors.
- **Research environment.** The agent writes the spec.
- **Backtest.** Costs, rebalancing, drawdown, turnover.
- **Sharia screen.** Explicit rules, applied before ranking.

## Why it wins

1. Verification for retail: a screener becomes a tested strategy with visible evidence.
2. Two markets, one engine: China and Saudi Arabia.
3. Sharia rules are part of the engine, not a badge.

## Non-goals

Cross-sectional only. No execution, broker, custody, advice, price prediction, or intraday.

## Landscape

Source: team research, 2026-10-21. Re-check a number before quoting it.

| Product | What it does | Gap |
|---|---|---|
| **WenCai** (Tonghuashun) | Chinese natural-language screen; LLM chat | Screens, does not verify; China only |
| **Composer** (SoFi) | AI strategy -> backtest -> execute; USD 37B volume | US only; account required; no teaching |
| **Sahm** (Saudi) | Saudi and US app; AI chat; halal screen | No strategy plus backtest |
| **Magnifi** | Conversational portfolio analysis | For existing holders; not a screener |
| **Danelfin** | 900 indicators, AI score, explanation | A score, not a strategy |
| **Simply Wall St** | Visual fundamental analysis; 7M users | Company view only |
| **Robinhood Agents** (Sep 2026) | Users build AI agents to manage investments | US; account required; no Sharia |

Take: entry, closure, local rules, explanation.

The gap: Saudi Arabia has no retail strategy plus backtest; China stops at a list; no one runs one engine with two rule sets.

Deck and video: do not name these products.

## Scope

**In:** cross-sectional selection, factor library, natural-language environment, backtest with costs, Sharia filter, one frontend contract.

**Out:** execution, broker, custody, fund management, intraday, derivatives, leverage, price prediction, advice, a general-purpose notebook, native mobile in v1.

Open:

1. **Saudi data.** The source is not verified. Current data work covers A-share, Hong Kong, and US. Decide the demo market.
2. **Sharia standard.** Choose AAOIFI, MSCI Islamic, or a documented simple screen. Name it and show the rules.
3. **Data licensing.** No raw vendor data in the repo. Check what the demo video may show.
4. **Demo cut.** One question end to end. Reuse a working component before rebuilding.

Demo contract: a question -> a strategy spec -> a backtest with dates, costs, and one failure metric -> an explanation that names the rule, the result, and one limit. No number the engine did not compute.

## Competition

Track 01 Fintech and Logistics. Theme: AI and the cross-cultural consumer.

Submission: 2026-10-24 23:59 Saudi time. Video 5 to 7 minutes, every member speaks. Deck at most 12 pages; the deck is the only scoring artifact.

Rubric, equal weight: specific problem, technical feasibility, business feasibility including regulation, mutual value, cross-cultural consumer.
