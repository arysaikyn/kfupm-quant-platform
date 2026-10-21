# KFUPM Quant Platform

Retail quant research in plain language. Ask a question; the system turns it into rules, tests the rules on history, and explains the result.

Status: pre-code. The contract and product notes are in place; the pipeline and UI are next.

## Loop

1. Ask.
2. Translate to a strategy spec.
3. Test on point-in-time history.
4. Explain the picks, the result, and the limits.

## Repo

| Path | What |
|---|---|
| `agent/` | Natural-language layer |
| `data/` | Ingestion and point-in-time data |
| `model/` | Factors, screens, backtest |
| `web/` | UI |
| `docs/product.md` | Product and scope |

## Start

```bash
python3 -m pip install -r scripts/requirements.txt
make check
```

## Read

- `AGENTS.md`
- `docs/product.md`
- `model/CONTRACT.md`
