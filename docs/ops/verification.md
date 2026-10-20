# Verification

## Gate

`make verify` is the gate. It runs `make doctor` today. When code lands, add the test command to the `verify` target.

`make doctor` checks:

- Required files exist.
- `CLAUDE.md` imports `AGENTS.md`.
- Every JSON file parses.
- `model/signals.example.json` validates against `docs/architecture/signals.schema.json`.
- Relative Markdown links resolve.
- No secret-like file is tracked.

## Proof standard

A change is proven when the changed path ran and the result was observed.

- **Model:** run the strategy on a named snapshot. Show the signals file and the metrics.
- **Web:** open the page. Use the feature. Show the state before and after.
- **Contract:** validate the example and one real producer output.
- **Agent:** run the question end to end. Show the spec, the file, and the explanation.

A unit test that calls an internal setter is not proof of the user path. A mock at the contract boundary is not proof of the contract.

## Evidence record

Put this in the commit or pull request:

```
VERIFIED: make verify
RAN: <command or path exercised>
SAW: <output, file, or screen state>
LIMIT: <what was not covered>
```

`LIMIT` is required when the run used sample data, a stub, or one market.

## Tests

- Add a regression test for every fixed bug. The test fails before the fix and passes after it.
- Test behavior, boundaries, invariants, and errors. Do not test wiring, forwarding, or that a mock returned what it was told to return.
- A contract change adds a schema example and a validation case.
- A backtest change adds a case with a known result, including costs.

## Current limits

- No test suite yet.
- No running app yet.
- The example signals file uses illustrative numbers.

Update this section when a limit is removed. Do not leave a stale limit in place.

## When the app runs

Add:

- `make dev` to start the app.
- `make test` to run the suite.
- A project verification skill that launches the app, drives one user path, and captures evidence.

See `create-verification-skill` in the skill pool for the skill format.
