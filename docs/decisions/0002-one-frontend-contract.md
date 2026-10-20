# 0002 — One frontend contract

Status: accepted
Date: 2026-10-21

## Context

The model and the web app change at different speeds. Two data paths, or a second endpoint that returns "just one extra field", creates drift that no one owns.

## Decision

`model/signals.json` is the only data file the web app reads. The schema is versioned, example-backed, and validated by `make doctor`. The model may rewrite the file per run; the web keys its cache on `run_id`.

## Consequences

- A new field needs a schema change and an example update.
- The web cannot read the database, the vendor files, or a separate JSON.
- Prose stays in the agent response; it is not forced into the data file.
- A broken contract fails `make doctor` before it fails in the UI.
