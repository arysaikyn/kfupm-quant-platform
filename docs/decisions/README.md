# Decisions

One file per decision. The file states the reason, so a later change can argue with the reason and not with a rule that lost its context.

## Format

```md
# NNNN — Title

Status: accepted | superseded by NNNN
Date: YYYY-MM-DD

## Context
## Decision
## Consequences
```

## Rules

- A decision that changes a contract, a boundary, or a product non-goal gets a file.
- A reversal gets a new file. Do not rewrite the old one; mark it superseded.
- Keep each file short. Link to the document that owns the detail.

## Index

| ADR | Decision |
|---|---|
| [0001](0001-decision-support.md) | Decision support, not execution |
| [0002](0002-one-frontend-contract.md) | One frontend contract |
| [0003](0003-agent-does-not-compute.md) | The agent does not compute numbers |
| [0004](0004-sharia-screen-is-a-filter.md) | The Sharia screen is a filter, not a label |
| [0005](0005-one-engine-per-market-config.md) | One engine, per-market config |
