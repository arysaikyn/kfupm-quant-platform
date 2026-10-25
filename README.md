# KFUPM Quant Platform

Retail quant research in plain language. Ask a question; the system turns it into rules, tests them on history, and explains the result.

Status: the AI tab is the real Vibe-Trading agent, served by `backend/`; the
market and news screens still use mock data. The interface never claims a
backtest ran when none did.

## Run

Two processes plus the web app:

```
# 1. Vibe-Trading (Python 3.11+, isolated env)
uv venv ~/.venvs/vibe-trading --python 3.12
uv pip install --python ~/.venvs/vibe-trading/bin/python "vibe-trading-ai==0.1.18"

# 2. start it with an OpenAI-compatible model and a local key
API_AUTH_KEY=dev-key \
LANGCHAIN_PROVIDER=openai \
LANGCHAIN_MODEL_NAME=deepseek-v4.1-flash \
OPENAI_BASE_URL=https://opencode.ai/zen/go/v1 \
OPENAI_API_KEY="$OPENCODE_GO_API_KEY" \
~/.venvs/vibe-trading/bin/vibe-trading serve --host 127.0.0.1 --port 8899

# 3. the proxy (keeps the upstream key out of the browser)
cd backend && cp .env.example .env && ./run.sh

# 4. the web app
cd web && npm install && npm run dev
```

Or start all three with one command after the first install:

```bash
./dev.sh          # starts Vibe-Trading, backend, web; Ctrl-C stops them
```

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

## Loop

Ask -> strategy spec -> point-in-time backtest -> plain-language result.

## Read

- `backend/README.md` — AI proxy, upstream setup, limits
- `AGENTS.md` — working contract
- `docs/product.md` — product, scope, competition
- `model/signals.schema.json` — the one data contract
