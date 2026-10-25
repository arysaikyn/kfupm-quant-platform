# KFUPM Quant Platform

Retail quant research in plain language. Ask a question; the system turns it into rules, tests them on history, and explains the result.

Status: the AI tab is the real Vibe-Trading agent, served by `backend/`; the
market and news screens still use mock data. The interface never claims a
backtest ran when none did.

## Run

```bash
# Vibe-Trading, once
uv venv ~/.venvs/vibe-trading --python 3.12
uv pip install --python ~/.venvs/vibe-trading/bin/python "vibe-trading-ai==0.1.18"

# backend + Vibe-Trading + web
./dev.sh          # Ctrl-C stops the stack
```

No provider key is needed for the demo. To use a real model, open
**AI → Connect API** after the app starts and enter the base API URL, model and
key. The key goes to the local backend/Vibe settings, not browser storage.

For a single-process production check, `npm run build` in `web/`, then the
backend serves `web/dist` at `http://127.0.0.1:8000`. See `backend/README.md`
for model keys, security and current limits.

## Check

```
cd web
npm run typecheck
npm run lint
npm run test        # unit and component tests
npm run test:e2e    # route, flow, offline and axe checks in Chrome
npm run design      # Hallmark gate; fails if the floor count grows
npm run build
cd ../backend && uv run python -m unittest discover -s tests
```

Five tabs: markets, news, AI, strategies, profile. Chinese, English and Arabic,
with right-to-left layout. Market/news data is mock (`web/src/data/mock.ts`);
AI sessions, tools and backtests come from Vibe-Trading. The AI tab also opens a
Workspace with runs, paper accounts, portfolio status, alphas, scheduled jobs,
model status and uploads. The app is installable (manifest + offline shell) and
keeps its local state on the device.

### Demo by default

The app opens in **demo mode**. It does not send a prompt to any provider and it
does not use a developer key; the AI returns pre-recorded text and workspace
samples. A developer needs no API key to run the dashboard.

To use a real provider, open **AI → Connect API** (or **Profile → AI provider**),
enter the base API URL, model and your own key. The key is written to the local
Vibe settings, never to browser storage. The chat then uses that provider and
its tools. `./dev.sh` starts Vibe without a provider key, so demo is the default.

## Loop

Ask -> strategy spec -> point-in-time backtest -> plain-language result.

## Read

- `backend/README.md` — AI proxy, upstream setup, limits
- `AGENTS.md` — working contract
- `docs/product.md` — product, scope, competition
- `model/signals.schema.json` — the one data contract
