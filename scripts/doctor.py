#!/usr/bin/env python3
"""Structural doctor for this repository.

Checks the files agents depend on, the JSON contract, Markdown links, and
secret-like tracked files. Run it with `make doctor`.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

REQUIRED = [
    "AGENTS.md",
    "CLAUDE.md",
    "README.md",
    "Makefile",
    ".scope.example",
    ".github/pull_request_template.md",
    "docs/README.md",
    "docs/product/thesis.md",
    "docs/product/landscape.md",
    "docs/product/scope.md",
    "docs/product/competition.md",
    "docs/product/glossary.md",
    "docs/architecture/overview.md",
    "docs/architecture/signals-contract.md",
    "docs/architecture/signals.schema.json",
    "docs/decisions/README.md",
    "docs/decisions/0001-decision-support.md",
    "docs/decisions/0002-one-frontend-contract.md",
    "docs/decisions/0003-agent-does-not-compute.md",
    "docs/decisions/0004-sharia-screen-is-a-filter.md",
    "docs/decisions/0005-one-engine-per-market-config.md",
    "docs/ops/workflow.md",
    "docs/ops/verification.md",
    "docs/ops/secrets.md",
    "docs/ops/github-setup.md",
    "docs/plans/README.md",
    "docs/solutions/README.md",
    "agent/README.md",
    "data/README.md",
    "model/README.md",
    "model/signals.example.json",
    "web/README.md",
    "scripts/doctor.py",
    "scripts/doctor.sh",
    "scripts/requirements.txt",
]

SKIP_DIRS = {".git", ".venv", "node_modules", "__pycache__", ".pytest_cache"}
GENERATED_PATHS = {"model/signals.json", ".scope"}

SECRET_PATTERNS = [
    re.compile(r"(^|/)\.env($|\.)"),
    re.compile(r"(^|/)(id_rsa|id_ed25519|id_ecdsa)$"),
    re.compile(r"\.(pem|key|p12|pfx)$"),
    re.compile(r"(^|/)credentials(\.json)?$"),
    re.compile(r"(^|/)\.(netrc|npmrc|pgpass|git-credentials)$"),
]
ALLOWED_SECRET_NAMES = {".env.example", ".env.template"}

LINK_RE = re.compile(r"\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")
FENCE_RE = re.compile(r"^```.*?^```\s*$", re.MULTILINE | re.DOTALL)
BACKTICK_RE = re.compile(r"`([^`]+)`")

failures: list[str] = []


def ok(message: str) -> None:
    print(f"  ok   {message}")


def fail(message: str) -> None:
    failures.append(message)
    print(f"  FAIL {message}")


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def check_required() -> None:
    print("doctor: required files")
    for name in REQUIRED:
        path = ROOT / name
        if path.is_file():
            ok(name)
        else:
            fail(f"missing {name}")


def check_claude_entry() -> None:
    print("doctor: Claude entry point")
    path = ROOT / "CLAUDE.md"
    if not path.is_file():
        return
    text = path.read_text(encoding="utf-8")
    if re.search(r"^@AGENTS\.md\s*$", text, re.MULTILINE):
        ok("CLAUDE.md imports AGENTS.md")
    else:
        fail("CLAUDE.md must contain @AGENTS.md on its own line")


def iter_files(suffix: str):
    for path in ROOT.rglob(f"*{suffix}"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if "data/raw/" in path.as_posix():
            continue
        if path.is_file():
            yield path


def check_json() -> None:
    print("doctor: JSON parses")
    for path in iter_files(".json"):
        try:
            json.loads(path.read_text(encoding="utf-8"))
            ok(rel(path))
        except json.JSONDecodeError as exc:
            fail(f"{rel(path)}: {exc}")


def check_contract() -> None:
    print("doctor: signals contract")
    schema_path = ROOT / "docs/architecture/signals.schema.json"
    example_path = ROOT / "model/signals.example.json"
    try:
        from jsonschema import Draft202012Validator, FormatChecker
    except ImportError:
        fail(
            "jsonschema is not installed "
            "(python3 -m pip install -r scripts/requirements.txt)"
        )
        return

    try:
        schema = json.loads(schema_path.read_text(encoding="utf-8"))
        Draft202012Validator.check_schema(schema)
        ok("schema is valid JSON Schema")
    except Exception as exc:  # noqa: BLE001 - doctor reports, never crashes
        fail(f"schema is invalid: {exc}")
        return

    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    instance = json.loads(example_path.read_text(encoding="utf-8"))
    errors = sorted(validator.iter_errors(instance), key=lambda error: list(error.path))
    if errors:
        for error in errors:
            location = ".".join(str(part) for part in error.path) or "<root>"
            fail(f"signals.example.json {location}: {error.message}")
    else:
        ok("signals.example.json matches the schema")


def check_markdown_links() -> None:
    print("doctor: Markdown links")
    checked = 0
    broken = 0
    for path in iter_files(".md"):
        text = FENCE_RE.sub("", path.read_text(encoding="utf-8"))
        for target in LINK_RE.findall(text):
            if target.startswith(("http://", "https://", "mailto:", "#")):
                continue
            clean = target.split("#", 1)[0].split("?", 1)[0]
            if not clean or clean.startswith("/"):
                continue
            resolved = (path.parent / clean).resolve()
            checked += 1
            if not resolved.exists():
                fail(f"{rel(path)}: broken link {target}")
                broken += 1
    if broken == 0:
        ok(f"{checked} relative links resolve")


def check_agents_pointers() -> None:
    print("doctor: AGENTS.md pointers")
    path = ROOT / "AGENTS.md"
    if not path.is_file():
        return
    seen = 0
    missing = 0
    for token in BACKTICK_RE.findall(path.read_text(encoding="utf-8")):
        candidate = token.strip().rstrip(".,;:")
        if "<" in candidate or ">" in candidate:
            continue
        if "/" not in candidate:
            continue
        if not (candidate.endswith((".md", ".json")) or candidate.endswith("/")):
            continue
        if candidate in GENERATED_PATHS:
            continue
        seen += 1
        if not (ROOT / candidate).exists():
            fail(f"AGENTS.md points to missing path {candidate}")
            missing += 1
    if missing == 0:
        ok(f"{seen} pointer paths resolve")


def tracked_files() -> list[str]:
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )
    return [name for name in result.stdout.decode("utf-8").split("\0") if name]


def check_secrets() -> None:
    print("doctor: secret-like files")
    try:
        tracked = tracked_files()
    except (OSError, subprocess.CalledProcessError) as exc:
        fail(f"git ls-files failed: {exc}")
        return

    hits = 0
    for name in tracked:
        base = Path(name).name
        if base in ALLOWED_SECRET_NAMES:
            continue
        if any(pattern.search(name) for pattern in SECRET_PATTERNS):
            fail(f"tracked secret-like file: {name}")
            hits += 1
    if hits == 0:
        ok("no secret-like file is tracked")

    for name in ("model/signals.json", ".scope"):
        if name in tracked:
            fail(f"generated or local file is tracked: {name}")
    if not any(name in tracked for name in ("model/signals.json", ".scope")):
        ok("generated and local files stay untracked")


def main() -> int:
    check_required()
    check_claude_entry()
    check_json()
    check_contract()
    check_markdown_links()
    check_agents_pointers()
    check_secrets()

    print()
    if failures:
        print(f"doctor: {len(failures)} failure(s)")
        return 1
    print("doctor: clean")
    return 0


if __name__ == "__main__":
    sys.exit(main())
