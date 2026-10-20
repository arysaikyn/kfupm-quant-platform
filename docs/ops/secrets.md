# Secrets and data

The repository is public. Treat every commit as visible to anyone with the link.

## Keys

- Keep keys in a local `.env` file or the macOS Keychain. Never commit either.
- Track `.env.example` with names only, never values.
- Keep environment variable names stable. A rename breaks every consumer.
- Redact a key at the source. Do not print it, log it, paste it into chat, or put it in an issue.
- A key pasted into a chat counts as exposed. Rotate it.

## Vendor data

- Raw vendor data stays in `data/raw/` (ignored) or outside the repository.
- The repository may contain derived values, schemas, and small synthetic fixtures.
- Check the vendor terms before the demo video shows data. Tushare and Yahoo terms restrict redistribution.
- Do not commit model weights, caches, or generated `model/signals.json`.

## If a secret leaks

1. Rotate the key at the vendor.
2. Remove it from the working tree.
3. Tell Arys. History cleanup is a separate decision.
4. Record the cause in `docs/solutions/` if the fix was not obvious.

## Review check

`make doctor` fails when a tracked file looks like `.env`, a private key, or a credential file. It does not catch a key pasted into a document. Read the diff.
