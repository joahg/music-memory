# Legacy Audio Clips

This folder still contains the older generated 30-second excerpts from the original native iPad prototype.

The current web app no longer syncs from this directory. Its build pipeline now copies the full recordings from `data/source-audio/` using the exact filenames referenced by `local/MusicMemoryCore/Sources/MusicMemoryCore/Resources/pieces.json`, then the browser selects a random 30-second playback window at runtime.

If you need to regenerate short excerpts for native-only experiments, `scripts/prepare_audio_clips.sh` and `data/audio-clips-template.csv` are still available.
