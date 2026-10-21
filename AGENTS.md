# AGENTS.md

Working contract for this repository. Read this first. Every other document is reached from here.

## Mission

Build a retail quant research platform. A user asks a question in plain language. The system turns the question into explicit rules, tests the rules on history, and explains the result.

The product is decision support. It does not trade, does not connect to a broker, and does not recommend stocks.

## Current state

Pre-code. Process, contracts, and product notes are in place. The data pipeline, model, agent, and web app are next. The judged demo date is in `docs/product/competition.md`.

## Hard boundary

- Cross-sectional stock selection only.
- No order execution, broker connection, or portfolio custody.
- Tools and evidence, not advice. Every output shows its inputs and its history.
- Numbers come from the deterministic engine. The language model never computes, estimates, or invents a number.
- Sharia rules are an explicit, auditable filter. They are not a label added after the fact.

## Repo map

| Path | Contents | Lane |
|---|---|---|
| `agent/` | Question -> strategy spec -> engine call -> explanation | agent |
| `data/` | Ingestion and normalized point-in-time data | data |
| `model/` | Factors, screens, backtest engine; owns `model/signals.json` and its contract | model |
| `web/` | User interface; reads only `model/signals.json` | web |
| `docs/` | Product, decisions, plans, solutions | shared |

Three writers share this repository. One top-level product directory has one owner. `docs/` is shared. Do not edit another owner's directory without agreement. `model/signals.schema.json` is a shared contract: a change needs both the model side and the web side in the same commit.

## Commands

- `make doctor` — structural check: required files, links, JSON contract, secret files.
- `make verify` — the gate: doctor plus tests. Run it before you claim done.
- When code lands, add the test command to the `verify` target. Current limits are in `docs/ops/verification.md`.

## Task loop

1. Claim. Create branch `agent/<slug>`. Copy `.scope.example` to `.scope` and fill it.
2. Plan. For multi-file work, write `docs/plans/YYYY-MM-DD-<slug>.md`. Read `docs/solutions/` first. A plan that contradicts a Prevention rule must say why.
3. Build. Make the smallest change that meets the scope. Reuse existing code before adding a module.
4. Verify. Run `make verify` and exercise the changed path. A green check that never ran the feature is not proof.
5. Record. Commit with `INTENDED`, `ACTUAL`, and `DRIFT` lines. State what you did not do.
6. Hand off. Update the one document that owns each changed fact. Add a `docs/solutions/` note only for a non-obvious lesson.
7. Merge. Only Arys merges to `main`. Other writers open a pull request.

## Done means

- The acceptance check in `.scope` ran and passed.
- `make verify` passes.
- The document that owns each changed fact is current.
- The diff has no unrelated change.

A compile, a stub, or a plan is not done.

## If blocked

- A failed command is not a blocked task. Try another path first.
- Stop only when the contract or the scope is wrong, or the information is not in the repository.
- Report what you tried, what you observed, and what you need.

## Drift rules

- One fact, one home. If a fact appears in two places, the second place links to the first.
- A contract change updates the schema, the example, the consumer, and the doc in one commit.
- Add a dependency, service, or config only when the task scope names the need.
- Keep secrets, data dumps, model weights, and generated output out of git.
- Stop when the scope is wrong or a contract must change. Ask before you cross the boundary.

## Pointers

| Read | When |
|---|---|
| `docs/README.md` | You need to find a document |
| `docs/product/thesis.md` | You need the product argument |
| `docs/product/scope.md` | You are deciding whether work is in scope |
| `docs/product/glossary.md` | A domain term is unclear |
| `model/CONTRACT.md` | You touch `model/signals.json` or the web |
| `docs/ops/workflow.md` | You need the full task protocol |
| `docs/ops/verification.md` | You need the proof standard |
| `docs/ops/secrets.md` | You handle a key, token, or vendor account |
| `docs/decisions/` | You need the reason behind a rule |
