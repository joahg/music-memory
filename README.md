# Music Memory Practice App

This repo now ships a browser-based progressive web app as the primary playable experience. It keeps the same learning flow from the earlier iPad concept, but packages it as a static site that can be hosted on GitHub Pages and used offline after the first load.

## What's Here

- `src/` contains the React + TypeScript PWA.
- `docs/product-spec.md` tracks the MVP, screens, and current platform direction.
- `local/MusicMemoryCore/` still holds the original Swift package models and planning logic that the web app mirrors.
- `local/MusicMemoryCore/Sources/MusicMemoryCore/Resources/pieces.json` is the source of truth for the repertoire metadata.
- `data/source-audio/` is the source of truth for the bundled full-length MP3 files used by the web app.
- `scripts/sync-web-assets.mjs` copies `pieces.json` and the expected MP3 files into the web app's public asset folders before dev and build runs.
- `scripts/prepare_audio_clips.sh` and `scripts/validate_audio_library.sh` remain the audio prep and validation helpers.
- `MusicMemoryApp/` and `project.yml` preserve the earlier native scaffold as reference work.

## Web App Commands

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run build:pages`

`npm run build:pages` sets the base path for the current GitHub Pages deployment under `/music-memory/`.

## Asset Flow

Do not edit `public/library/pieces.json` or `public/audio/*` directly. Those are generated during `npm run sync:assets` from:

- `local/MusicMemoryCore/Sources/MusicMemoryCore/Resources/pieces.json`
- `data/source-audio/*.mp3`

The sync step validates that every `audioFile` in `pieces.json` exists before the web app builds. The browser then plays a random 30-second window from each bundled full-length file at runtime.

## Deployment

`.github/workflows/deploy-pages.yml` builds the static site and deploys `dist/` to GitHub Pages on pushes to `main`.
