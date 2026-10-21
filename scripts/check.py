#!/usr/bin/env python3
"""Check the essentials: required files, the signals example, and tracked secrets."""

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

REQUIRED = [
    "AGENTS.md",
    "CLAUDE.md",
    "README.md",
    "Makefile",
    "docs/product.md",
    "model/CONTRACT.md",
    "model/signals.schema.json",
    "model/signals.example.json",
]


def main() -> int:
    failures = []

    for name in REQUIRED:
        if not (ROOT / name).is_file():
            failures.append(f"missing {name}")

    if (ROOT / "CLAUDE.md").is_file():
        if "@AGENTS.md" not in (ROOT / "CLAUDE.md").read_text():
            failures.append("CLAUDE.md does not import AGENTS.md")

    schema_path = ROOT / "model/signals.schema.json"
    example_path = ROOT / "model/signals.example.json"
    if schema_path.is_file() and example_path.is_file():
        schema = json.loads(schema_path.read_text())
        example = json.loads(example_path.read_text())
        try:
            from jsonschema import Draft202012Validator, FormatChecker
        except ImportError:
            failures.append(
                "jsonschema missing: python3 -m pip install -r scripts/requirements.txt"
            )
        else:
            validator = Draft202012Validator(schema, format_checker=FormatChecker())
            for error in validator.iter_errors(example):
                failures.append(f"signals.example.json: {error.message}")

    try:
        tracked = subprocess.run(
            ["git", "ls-files", "-z"],
            cwd=ROOT,
            check=True,
            capture_output=True,
        ).stdout.decode().split("\0")
    except (OSError, subprocess.CalledProcessError) as exc:
        failures.append(f"git ls-files failed: {exc}")
    else:
        for name in tracked:
            if name in {".env", ".env.local"} or name.endswith(
                (".pem", ".key", ".p12", ".pfx")
            ):
                failures.append(f"tracked secret-like file: {name}")

    if failures:
        for failure in failures:
            print(f"FAIL {failure}")
        return 1

    print("check: clean")
    return 0


if __name__ == "__main__":
    sys.exit(main())
