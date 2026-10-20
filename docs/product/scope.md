# Scope

## In scope (v1)

- Cross-sectional stock selection: rank a universe on a date, hold for a period, rebalance.
- A factor library with documented definitions and data windows.
- A natural-language research environment: question -> strategy spec -> result -> explanation.
- A backtest engine with costs, rebalancing, drawdown, turnover, and benchmark comparison.
- A Sharia screen as an explicit filter, applied before ranking.
- One frontend data contract: `model/signals.json`.

## Out of scope

- Order execution, broker connections, custody, or fund management.
- Intraday trading, market making, derivatives, or leverage.
- Price prediction and stock recommendations.
- Individual financial advice.
- A general-purpose notebook or arbitrary Python execution for users.
- Mobile native apps in v1. The web app is the surface.

## Open questions

1. **Market coverage.** The positioning targets China and Saudi Arabia. The current data work covers A-share, Hong Kong, and US. A Saudi (Tadawul) source is not verified. Decide which market the demo shows before building the screen.
2. **Sharia methodology.** Choose one standard and state it in the UI and the docs. Candidates: AAOIFI, MSCI Islamic, or a documented simple screen (sector exclusions plus leverage and interest ratios). The choice must be auditable.
3. **Data licensing.** Tushare terms and Yahoo terms restrict redistribution. The public repo must not contain raw vendor data. Check what the demo video may show.
4. **Demo cut.** The judged demo needs one question end to end: question -> spec -> backtest -> explanation. It does not need every factor or both markets. Reuse a working component before rebuilding it.

## Demo contract (2026-10-24)

The demo must show:

- A question typed in plain language.
- The strategy spec the system derived from it.
- A backtest with dates, costs, and at least one failure metric.
- An explanation that names the rule, the result, and one limit.

The demo must not show a number that the engine did not compute.

## Changing scope

A scope change needs one of these:

- An entry in `docs/decisions/` that states the reason.
- A written instruction from Arys in the task thread.

Do not widen the scope inside an implementation task. Stop and ask.
