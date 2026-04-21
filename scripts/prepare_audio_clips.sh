#!/usr/bin/env bash
set -euo pipefail

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required." >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="${1:-$ROOT_DIR/data/audio-clips-template.csv}"
OUTPUT_DIR="${2:-$ROOT_DIR/MusicMemoryApp/Resources/Audio}"

mkdir -p "$OUTPUT_DIR"

tail -n +2 "$MANIFEST" | while IFS=, read -r output_file source_file start_time duration; do
  if [[ -z "$output_file" ]]; then
    continue
  fi

  if [[ -z "$source_file" ]]; then
    echo "Skipping $output_file because source_file is empty."
    continue
  fi

  start_time="${start_time:-0}"
  duration="${duration:-30}"

  ffmpeg -y -ss "$start_time" -i "$source_file" -t "$duration" -vn -acodec libmp3lame "$OUTPUT_DIR/$output_file"
done

echo "Prepared clips in $OUTPUT_DIR"
