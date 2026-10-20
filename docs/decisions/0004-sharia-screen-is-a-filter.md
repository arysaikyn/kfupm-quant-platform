# 0004 — The Sharia screen is a filter, not a label

Status: accepted
Date: 2026-10-21

## Context

Local products add a static "halal" badge after the fact. The product positioning requires Sharia rules to be part of the engine: they remove stocks before the ranking, and the user can inspect why.

## Decision

The Sharia screen is a filter in the model pipeline. It applies documented business-activity rules and financial-ratio rules before ranking. Each stock gets `compliant`, `non_compliant`, or `unknown`. The active standard is named in the UI and in the run output.

## Consequences

- The screen needs a written rule set and a named standard. See `../product/scope.md`.
- `unknown` is a valid result and must not be treated as compliant.
- The screen changes the universe, so a backtest must record whether it ran.
- The web shows the rule, not just a badge.
