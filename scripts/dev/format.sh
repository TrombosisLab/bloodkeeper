#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/../.."
  pwd
)"

check_format() {
  cd "$ROOT"

  echo "==============================================="
  echo "FORMAT CHECK"
  echo "==============================================="

  python3 - <<'PY'
from pathlib import Path
import subprocess
import sys

extensions = {
    ".ts", ".tsx", ".js", ".mjs", ".cjs",
    ".json", ".md", ".sh", ".yml", ".yaml",
    ".prisma", ".sql", ".css", ".html",
}

raw = subprocess.check_output(["git", "ls-files", "-z"])
files = [
    Path(item.decode("utf-8"))
    for item in raw.split(b"\0")
    if item
]

checked = 0
violations = []

for path in files:
    if path.suffix.lower() not in extensions or not path.is_file():
        continue

    checked += 1
    data = path.read_bytes()

    if b"\r" in data:
        violations.append(f"{path}: contiene CR/CRLF")

    if data and not data.endswith(b"\n"):
        violations.append(f"{path}: falta newline final")

    for number, line in enumerate(data.splitlines(), start=1):
        if line.endswith((b" ", b"\t")):
            violations.append(
                f"{path}:{number}: whitespace final"
            )

if violations:
    for item in violations:
        print(item)
    print(
        f"FORMAT CHECK: INCORRECTO ({len(violations)} incidencias)",
        file=sys.stderr,
    )
    raise SystemExit(1)

print(f"✓ Archivos versionados comprobados: {checked}")
print("FORMAT CHECK: CORRECTO")
PY

  git diff --check
}

check_format
