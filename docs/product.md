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
- **AI backend.** Vibe-Trading (MIT) agent through a local proxy; its tools and backtests are real, while Saudi/Sharia data remains ours to build.

## Why it wins

1. Verification for retail: a screener becomes a tested strategy with visible evidence.
2. Two markets, one engine: China and Saudi Arabia.
3. Sharia rules are part of the engine, not a badge.

## Why this is not a grid bot

The failure this product must avoid: an agent reads news, candles and MACD/RSI, then
an AI picks a stop and a target. The only free variable left is distance from a
reference price, so it earns the size of each move rather than its direction — a
grid with a model story. Remove the AI's stop and target and it is plain quant.

The structural answer, copied from what already works:

1. **No price-level fields, anywhere.** No stop-loss, take-profit or entry price in the
   contract. `ai-hedge-fund` clamps the model to a `Signal` in [-1, 1] and states that
   the LLM never touches the trade; Microsoft RD-Agent + Qlib run `TopkDropoutStrategy`
   (top-k with a fixed `n_drop` churn) and have no per-name exit rule in the pipeline.
   Exits are a consequence of the ranking, not a decision.
2. **Rank other names, not a price.** A rank is invariant to a common shift of the
   cross-section; a stop rule is a function of one asset's realised path, so its trade
   count scales with volatility squared and its expected value is negative under a
   random walk (Kaminski & Lo, JFM 2014: a stop adds return only when persistence beats
   the Sharpe ratio at the holding horizon).
3. **Score the inputs by family.** Alpha101, GTJA-191 and Qlib's Alpha158 are price and
   volume only, and their survival out of sample is poor; the fundamental block rebalances
   annually and is where the durable names sit. Every spec names its families, and a
   price-only spec is flagged instead of silently accepted.
4. **Measure the path.** The return is regressed on the benchmark's signed move and on
   its absolute move. A return that loads on the absolute move is volatility harvesting —
   the grid signature — whatever the rules say.

Point 1 is enforced by the contract: the field does not exist, and `AGENTS.md` forbids
adding one. `web/src/lib/gridcheck.ts` implements the checks behind points 2 to 4, and
`gridcheck.test.ts` pins them; `web/src/components/GridCheck.tsx` shows the score on a
saved run and inside the screener. The score is a gate, not a badge: cheap, deterministic
and testable, and it makes the degeneracy visible in one number.

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
