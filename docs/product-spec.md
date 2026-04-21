# Product Spec

## Platform Update

The original concept was an iPad-only SwiftUI app. The current delivery target is a progressive web app hosted as a static site on GitHub Pages, while preserving the same offline-first, private-family-first learning flow and the same local repertoire and audio assets.

## Goal

Build a simple progressive web app that helps a student recognize 30-second competition excerpts and answer with the correct title and composer.

## MVP Scope

### Core experience

- Play a bundled 30-second audio clip for a piece.
- Let the student guess before seeing the answer.
- Reveal composer, work, and selection on demand.
- Mark each attempt as `Correct`, `Almost`, or `Missed`.
- Track progress locally on-device.

### Screens

- `Home`: quick launch into Learn, Drill, or Competition mode.
- `Drill`: one piece at a time with reveal and self-scoring.
- `Competition`: random session with delayed answer reveal.
- `Library`: browse all pieces by composer or ensemble.
- `Progress`: surface missed pieces and overall mastery.

## Content Model

Each entry needs:

- stable `id`
- `composer`
- optional `majorWork`
- `selection`
- `ensemble`
- `audioFile`

The competition image provided in this thread has been transcribed into `local/MusicMemoryCore/Sources/MusicMemoryCore/Resources/pieces.json`.

## Practice Modes

### Learn mode

- Show title and composer before playback.
- Good for initial memorization and parent-guided practice.

### Drill mode

- Play an excerpt first.
- Reveal the answer only after the child thinks it through.
- Prioritize missed and unseen items.

### Competition mode

- Build a random set of pieces.
- Play one excerpt per prompt.
- Delay answer reveal until the end of the round.

## Audio Strategy

- Use local bundled clips for the first version.
- Keep filenames aligned with `audioFile` in the seed JSON.
- Normalize clips to a consistent 30-second length and loudness.

## Technical Plan

### Core stack

- `React` + `TypeScript` for the web UI
- HTML audio playback for bundled excerpt files
- browser storage for local progress persistence
- reuse the existing `pieces.json` repertoire metadata and bundled local audio files
- mirror the quiz logic already proven in `MusicMemoryCore`

## Current Implementation

- The primary playable app now lives in the web `src/` directory.
- The local package still lives in `local/MusicMemoryCore/` and remains the reference for shared models and planning behavior.
- Progress is persisted in browser storage so the app works offline without extra services.
- Audio playback uses local excerpt files sourced from `MusicMemoryApp/Resources/Audio/`.
- A service worker and manifest make the browser app installable and offline-friendly.

### Phase 1

- finalize the piece list
- gather and trim audio excerpts
- confirm how the school expects titles to be spoken and scored

### Phase 2

- create the static web app shell
- wire up the shared piece loader and local asset pipeline
- add Drill mode and self-scoring

### Phase 3

- add Competition mode
- persist progress
- add filters for composer and ensemble

### Phase 4

- polish for large iPad tap targets
- add parent-friendly progress views
- optionally add typed answer checking instead of self-scoring only

## Open Questions

- Does the student need to name only the `selection`, or the `majorWork` plus `selection`?
- Will the app stay private to the family, or is App Store distribution a goal?
- Are all competition pieces already known, or should the data model plan for adding next year's list later?
