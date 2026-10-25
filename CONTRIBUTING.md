# Contributing

Thanks for helping. This repo is a demo-first prototype; small, evidence-backed
changes are more useful than broad rewrites.

## Fork and pull request

1. Fork the repository.
2. Create a branch: `git checkout -b feat/<short-name>`.
3. Make one focused change.
4. Run the checks below.
5. Commit with a clear message and open a pull request.

Direct push to `main` is limited to maintainers and invited collaborators.
Anyone with the link can contribute through a fork and pull request.

## What to include

- What changed and why.
- How you verified it (command, route, screenshot).
- Any known limitation or follow-up.
- For UI changes: a screenshot at phone and desktop widths.

## Checks

```bash
cd web
npm ci
npm run typecheck
npm run lint
npm run test
npm run design
npm run build

cd ../backend
uv sync
uv run python -m unittest discover -s tests
```

Playwright is optional locally but expected for flow changes:

```bash
cd web
npm run test:e2e
```

## Rules

- Do not commit `.env` files, API keys, raw vendor data, or build output.
- Keep the Sharia filter before ranking.
- Do not add execution, broker, advice, price-prediction, or return-guarantee features.
- Do not make the demo depend on a developer API key.
- Prefer existing components and tokens over new one-off styles.
- Keep English, Chinese and Arabic strings together.

## Need write access?

Open an issue with:

- your GitHub username,
- the area you want to own,
- a link to one relevant change or issue.

A maintainer will decide whether to invite you. Do not post secrets in an issue.
