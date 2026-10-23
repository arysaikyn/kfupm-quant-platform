# KFUPM Quant Platform

Retail quant research in plain language. Ask a question; the system turns it into rules, tests them on history, and explains the result.

Status: web shell runs on mock data; the engine is not built. The interface is
explicit about demo data and never claims a backtest ran.

## Run

```
cd web && npm install && npm run dev
```

## Check

```
cd web
npm run typecheck
npm run lint
npm run test        # unit and component tests
npm run test:e2e    # route, flow, offline and axe checks in Chrome
npm run design      # Hallmark gate; fails if the floor count grows
npm run build
```

Five tabs: markets, news, AI, strategies, profile. Chinese, English and Arabic,
with right-to-left layout. All data is mock (`web/src/data/mock.ts`). The app is
installable (manifest + offline shell) and keeps its state on the device.

## Loop

Ask -> strategy spec -> point-in-time backtest -> plain-language result.

## Read

- `AGENTS.md` — working contract
- `docs/product.md` — product, scope, competition
- `model/signals.schema.json` — the one data contract
