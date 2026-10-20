# Workflow

The task protocol for three writers. `AGENTS.md` has the short form; this file has the detail.

## Roles

- Three writers share the repository.
- Each top-level product directory has one owner. `docs/` is shared. The owner reviews changes to their directory.
- Arys is the only person who merges to `main`.
- Authoring and review are separate passes. The author does not approve their own contract change.

## 1. Claim

Create a branch:

```bash
git checkout -b agent/<short-slug>
```

Copy `.scope.example` to `.scope`. Fill every field. `.scope` stays local.

## 2. Plan

For work that touches more than one file, write a plan at `docs/plans/YYYY-MM-DD-<slug>.md`.

Before the plan, search the learnings:

```bash
rg -li "<area>" docs/solutions/
```

Load the hits as priors. A plan that contradicts a Prevention rule states why.

## 3. Build

- Read the file before you edit it. Read its callers and its tests.
- Reuse an existing function or pattern before you add a module.
- Keep the change inside the scope. A new need is a scope change, not a silent addition.
- Do not reformat untouched code in the same commit.

## 4. Verify

Run `make verify`.

Then exercise the changed path:

- A model change runs the strategy on a real snapshot.
- A web change opens the page and uses the feature.
- A contract change validates the example and the producer output.

A green check that never ran the feature is not proof. Record what you ran.

## 5. Record

Commit with a conventional prefix and a receipt:

```
feat(model): add low-leverage factor

INTENDED: add the factor and its test
ACTUAL: factor, test, factor doc
DRIFT: none
VERIFIED: make verify; ran the factor on the 2026-10-20 snapshot
```

`DRIFT` names any file or behavior that changed outside the scope. "None" is a claim; make it true.

## 6. Hand off

- Update the document that owns each changed fact. Do not copy the fact into a second document.
- Add `docs/solutions/YYYY-MM-DD-<slug>.md` only for a non-obvious lesson. Use the format in `docs/solutions/README.md`.
- A contract change updates the schema, the example, the producer, the consumer, and the contract doc in one commit.

## 7. Merge

Open a pull request with the template. The reviewer checks:

- The behavior matches the scope.
- The verification exercised the feature.
- The contract is unchanged, or all four contract files changed.
- No secret, raw data, or generated file is tracked.
- The doc that owns each changed fact is current.

Only Arys merges. Squash or fast-forward, then delete the branch.

## Contract changes

A change to `model/signals.json`, its schema, or a component boundary needs:

- Both owners in the task thread.
- A schema version bump when the change is breaking.
- An ADR when the change alters a decision, not just a field.

## Subagent briefs

When an agent delegates work, the brief states:

- **Objective:** one outcome.
- **Paths:** the files it may edit.
- **Non-goals:** what it must not touch.
- **Acceptance:** the observable result.
- **Verification:** the command and the path to exercise.
- **Stop condition:** the ambiguity that returns the task to the main agent.

One agent per lane. Agents do not edit another lane. Agents do not run build, lint, or tests mid-flight; run them once at the end.
