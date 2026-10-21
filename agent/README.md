# `agent/`

Owner lane: agent.

## Belongs here

- Question to strategy-spec translation.
- Spec validation and rejection.
- Explanation generation from `model/signals.json`.
- Prompt fixtures and evaluation cases.

## Does not belong here

- Factor math, backtest math, or data ingestion.
- Any number the agent did not read from the signals file.
- Direct imports from `data/` or `model/`.

## First output

A strategy spec for one question, printed to stdout, with the reason for each field.

## Read first

- `../AGENTS.md`
- `../docs/decisions/0003-agent-does-not-compute.md`
- `../model/CONTRACT.md`
