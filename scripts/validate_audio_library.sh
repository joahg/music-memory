#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JSON_PATH="$ROOT_DIR/local/MusicMemoryCore/Sources/MusicMemoryCore/Resources/pieces.json"
AUDIO_DIR="${1:-$ROOT_DIR/MusicMemoryApp/Resources/Audio}"

python3 - <<'PY' "$JSON_PATH" "$AUDIO_DIR"
import json
import os
import sys
from pathlib import Path

json_path = Path(sys.argv[1])
audio_dir = Path(sys.argv[2])
pieces = json.loads(json_path.read_text())
missing = [piece["audioFile"] for piece in pieces if not (audio_dir / piece["audioFile"]).exists()]

if missing:
    print("Missing audio files:")
    for item in missing:
        print(f"- {item}")
    sys.exit(1)

print(f"All {len(pieces)} expected audio files are present in {audio_dir}")
PY
