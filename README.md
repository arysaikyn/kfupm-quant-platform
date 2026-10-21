# KFUPM Quant Platform

Retail quant research in plain language. Ask a question; the system turns it into rules, tests them on history, and explains the result.

Status: web shell runs on mock data; the engine is not built.

## Run

```
cd web && npm install && npm run dev
```

Five tabs: markets, news, AI, strategies, profile. Chinese, English and Arabic, with right-to-left layout. All data is mock (`web/src/data/mock.ts`).

## Loop

Ask -> strategy spec -> point-in-time backtest -> plain-language result.

## Read

- `AGENTS.md` — working contract
- `docs/product.md` — product, scope, competition
- `model/signals.schema.json` — the one data contract
