# 0003 — The agent does not compute numbers

Status: accepted
Date: 2026-10-21

## Context

A language model can produce a plausible return, drawdown, or factor value that is wrong. A retail user cannot detect the error. One invented number destroys the product's claim.

## Decision

The deterministic engine computes every number. The agent translates a question into a strategy spec and explains the engine's output. The agent may quote a number only when it reads that number from `model/signals.json`.

## Consequences

- The agent has a validation step: a spec that the model rejects is not explained as if it ran.
- The explanation cites fields, not memories.
- A question with no valid spec gets a clarification, not a guess.
- Prompt tests must check that the agent refuses to invent a metric.
