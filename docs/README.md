# Docs

One map for the document set. Read `../AGENTS.md` first; it is the only always-loaded file.

| Document | Answers | Read when |
|---|---|---|
| [`../AGENTS.md`](../AGENTS.md) | Working contract, commands, boundaries | Before the first edit |
| [`product/thesis.md`](product/thesis.md) | What we build and why | You need the product argument |
| [`product/landscape.md`](product/landscape.md) | What exists, what is missing, what we take | You need the positioning |
| [`product/scope.md`](product/scope.md) | In scope, out of scope, open questions | You decide whether work belongs |
| [`product/competition.md`](product/competition.md) | Track, deadline, deliverables, rubric | You prioritize work |
| [`product/glossary.md`](product/glossary.md) | Domain terms | A term is unclear |
| [`architecture/overview.md`](architecture/overview.md) | Components, data flow, invariants | You change a boundary |
| [`architecture/signals-contract.md`](architecture/signals-contract.md) | `model/signals.json` fields and units | You touch the contract or the web |
| [`architecture/signals.schema.json`](architecture/signals.schema.json) | Machine-readable contract | You validate output |
| [`decisions/`](decisions/README.md) | Why a rule exists | You want to change a rule |
| [`ops/workflow.md`](ops/workflow.md) | Full task protocol, receipts, review | You start a task |
| [`ops/verification.md`](ops/verification.md) | What counts as proof | You claim done |
| [`ops/secrets.md`](ops/secrets.md) | Keys, vendor data, leak response | You handle a secret or dataset |
| [`ops/github-setup.md`](ops/github-setup.md) | Branch protection and access | You set up the repository |
| [`plans/`](plans/README.md) | Plan format | You plan multi-file work |
| [`solutions/`](solutions/README.md) | Learnings format | You plan or debug |

## Maintenance

- One fact has one home. The second mention links to the first.
- When a fact changes, update the owning document. Then run `make doctor`; it checks every relative link.
- A new document needs a row in this table and a pointer in `../AGENTS.md` when agents must reach it.
