import { useMemo, useState } from 'react'
import { displayTitle } from '../lib/musicMemory'
import type { Piece, PieceProgressSummary } from '../types'

interface LibraryViewProps {
  composers: string[]
  ensembles: string[]
  onPlayPiece: (piece: Piece) => Promise<void>
  onStopPlayback: () => void
  pieces: Piece[]
  playbackPieceId: string | null
  progressSummaries: Record<string, PieceProgressSummary>
}

export function LibraryView({
  composers,
  ensembles,
  onPlayPiece,
  onStopPlayback,
  pieces,
  playbackPieceId,
  progressSummaries,
}: LibraryViewProps) {
  const [searchText, setSearchText] = useState('')
  const [selectedComposer, setSelectedComposer] = useState('all')
  const [selectedEnsemble, setSelectedEnsemble] = useState('all')

  const filteredPieces = useMemo(() => {
    const normalizedSearch = searchText.trim().toLocaleLowerCase()

    return [...pieces]
      .filter((piece) => {
        const matchesComposer = selectedComposer === 'all' || piece.composer === selectedComposer
        const matchesEnsemble = selectedEnsemble === 'all' || piece.ensemble === selectedEnsemble
        const haystack = [displayTitle(piece), piece.composer, piece.ensemble].join(' ').toLocaleLowerCase()
        const matchesSearch = normalizedSearch.length === 0 || haystack.includes(normalizedSearch)

        return matchesComposer && matchesEnsemble && matchesSearch
      })
      .sort((left, right) => {
        if (left.composer === right.composer) {
          return displayTitle(left).localeCompare(displayTitle(right))
        }

        return left.composer.localeCompare(right.composer)
      })
  }, [pieces, searchText, selectedComposer, selectedEnsemble])

  return (
    <div className="stack-lg">
      <section className="panel filters-grid content-panel">
        <div>
          <label className="field-label" htmlFor="library-search">
            Search
          </label>
          <input
            className="text-input"
            id="library-search"
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Titles, composers, or ensemble"
            type="search"
            value={searchText}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="composer-filter">
            Composer
          </label>
          <select
            className="text-input"
            id="composer-filter"
            onChange={(event) => setSelectedComposer(event.target.value)}
            value={selectedComposer}
          >
            <option value="all">All composers</option>
            {composers.map((composer) => (
              <option key={composer} value={composer}>
                {composer}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="ensemble-filter">
            Ensemble
          </label>
          <select
            className="text-input"
            id="ensemble-filter"
            onChange={(event) => setSelectedEnsemble(event.target.value)}
            value={selectedEnsemble}
          >
            <option value="all">All ensembles</option>
            {ensembles.map((ensemble) => (
              <option key={ensemble} value={ensemble}>
                {ensemble}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel stack-md content-panel">
        <div className="section-header">
          <div className="section-header-copy">
            <p className="eyebrow">Library</p>
            <h1>{filteredPieces.length} matching pieces</h1>
          </div>
        </div>

        <div className="piece-grid">
          {filteredPieces.map((piece) => {
            const mastery = Math.round((progressSummaries[piece.id]?.mastery ?? 0) * 100)

            return (
              <article className="piece-card" key={piece.id}>
                <div className="piece-card-header">
                  <span className="piece-chip">{piece.ensemble}</span>
                  <span className="mastery-pill">{mastery}% mastery</span>
                </div>
                <h3>{displayTitle(piece)}</h3>
                <p className="piece-meta">{piece.composer}</p>
                <div className="button-row compact-row">
                  <button className="secondary-button" onClick={() => void onPlayPiece(piece)} type="button">
                    {playbackPieceId === piece.id ? 'Replay clip' : 'Play clip'}
                  </button>
                  {playbackPieceId === piece.id ? (
                    <button className="ghost-button" onClick={onStopPlayback} type="button">
                      Stop
                    </button>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
