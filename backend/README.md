# Backend — local AI proxy

The web app talks to this FastAPI service at `/api/ai/*`. It forwards a small
allowlist of calls to a local **Vibe-Trading** server and keeps that server's
API key out of the browser.

```
web (React)  ->  backend :8000  ->  vibe-trading :8899  ->  LLM + tools
```

The AI tab is Vibe-Trading's agent: the same sessions, tool calls, streaming
answers, backtests and run artifacts. There are no canned replies in the web
app. The UI exposes chat, the tool timeline, run cards, stop, session history, and a
Workspace with runs, paper accounts, portfolio status, alpha index, scheduled
jobs, model status and file uploads. Deep research, swarm, options and
correlation start as prefilled agent prompts, so they use the same upstream
tools rather than a second UI. Live broker execution, IM channels and the
pixel-office view are intentionally not exposed.

## 1. Install Vibe-Trading

Use an isolated environment; it has a large dependency set.

```bash
uv venv ~/.venvs/vibe-trading --python 3.12
uv pip install --python ~/.venvs/vibe-trading/bin/python "vibe-trading-ai==0.1.18"
```

## 2. Configure the model

The web app opens in demo mode and needs no key. `./dev.sh` starts Vibe without a
provider key. To use a real model, open **AI → Connect API** in the app and enter:

- the base API URL
- the model ID
- your own API key

The app writes those settings through `PUT /api/ai/settings/llm`; the key stays
in Vibe's local settings, never in browser storage. Demo mode returns
pre-recorded text and workspace samples.

## 3. Run this backend

```bash
cd backend
cp .env.example .env       # set VIBE_API_KEY to the same value
./run.sh                   # http://127.0.0.1:8000
```

`run.sh` uses `uv run`; dependencies install into `backend/.venv` on first run.

## 4. Run the web app

```bash
cd web
npm install
npm run dev                # http://localhost:5177
```

Vite proxies `/api` to `http://127.0.0.1:8000`. For a different backend,
set `BACKEND_URL` before `npm run dev`, or `VITE_API_BASE` for a deployed
same-origin backend.

## Endpoints

| Method | Path | Upstream |
|---|---|---|
| GET | `/api/ai/health` | `/sessions?limit=1` |
| GET | `/api/ai/sessions` | `/sessions` |
| POST | `/api/ai/sessions` | `/sessions` |
| GET/PATCH/DELETE | `/api/ai/sessions/{id}` | same |
| GET/POST | `/api/ai/sessions/{id}/messages` | same |
| POST | `/api/ai/sessions/{id}/cancel` | same |
| GET | `/api/ai/sessions/{id}/events` | SSE passthrough |
| POST | `/api/ai/sessions/{id}/title/auto` | same |
| GET | `/api/ai/runs` | `/runs` |
| GET | `/api/ai/runs/{id}/preview` | `/runs/{id}/preview` |
| GET | `/api/ai/api/paper-accounts` | `/api/paper-accounts` |
| GET | `/api/ai/api/portfolio` | `/api/portfolio` |
| GET | `/api/ai/alpha/list` | `/alpha/list` |
| GET | `/api/ai/scheduled-runs` | `/scheduled-runs` |
| GET | `/api/ai/settings/llm` | `/settings/llm` |
| POST | `/api/ai/upload` | `/upload` |

Anything else is `404`; this is not an open proxy.

## Security

- Bind both services to `127.0.0.1` unless you put an authenticating reverse
  proxy in front. The backend has no user auth: it trusts the local machine.
- `VIBE_API_KEY` stays in the backend process and is never sent to the browser.
- SSE is passed through with `Last-Event-ID`, so reconnects resume.
- Run artifacts and sessions live under `~/.vibe-trading`; the backend reads
  only the preview endpoint.

## Current product limits

- Vibe-Trading covers A-share, HK, US, India, Canada, Brazil, UK, Korea,
  Vietnam, futures, forex and crypto. **It has no Saudi/Tadawul routing and no
  Sharia/AAOIFI screen.** The market/news screens in the web app therefore stay
  mock; the AI is real.
- A working LLM key is required for the agent. Without one the backend is
  healthy but every run fails at the provider.
- The upstream agent can execute generated Python backtests in a local
  subprocess. Keep shell tools off (the default) and run this only on a trusted
  machine.
