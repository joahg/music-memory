import { useEffect, useState } from 'react'
import { displayTitle } from '../lib/musicMemory'
import type { Piece, PieceProgressSummary } from '../types'

interface LearnViewProps {
  onPlayPiece: (piece: Piece) => Promise<void>
  onStopPlayback: () => void
  pieces: Piece[]
  playbackPieceId: string | null
  progressSummaries: Record<string, PieceProgressSummary>
}

export function LearnView({ onPlayPiece, onStopPlayback, pieces, playbackPieceId, progressSummaries }: LearnViewProps) {
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(pieces[0]?.id ?? null)

  useEffect(() => {
    if (!selectedPieceId && pieces[0]) {
      setSelectedPieceId(pieces[0].id)
    }
  }, [pieces, selectedPieceId])

  const selectedPiece = pieces.find((piece) => piece.id === selectedPieceId) ?? pieces[0]

  if (!selectedPiece) {
    return <section className="panel empty-state">Load the piece library to begin learn mode.</section>
  }

  const mastery = Math.round((progressSummaries[selectedPiece.id]?.mastery ?? 0) * 100)

  return (
    <div className="learn-layout panel">
      <aside className="learn-list" aria-label="Piece list">
        {pieces.map((piece) => (
          <button
            className={`learn-list-item${piece.id === selectedPiece.id ? ' is-selected' : ''}`}
            key={piece.id}
            onClick={() => setSelectedPieceId(piece.id)}
            type="button"
          >
            <strong>{piece.selection}</strong>
            <span>{piece.composer}</span>
          </button>
        ))}
      </aside>

      <section className="learn-detail">
        <p className="eyebrow">Learn mode</p>
        <h1>{selectedPiece.selection}</h1>
        <p className="detail-composer">{selectedPiece.composer}</p>

        <div className="detail-grid">
          <article className="detail-card">
            <span>Display title</span>
            <strong>{displayTitle(selectedPiece)}</strong>
          </article>
          {selectedPiece.majorWork ? (
            <article className="detail-card">
              <span>Major work</span>
              <strong>{selectedPiece.majorWork}</strong>
            </article>
          ) : null}
          <article className="detail-card">
            <span>Ensemble</span>
            <strong>{selectedPiece.ensemble}</strong>
          </article>
          <article className="detail-card">
            <span>Mastery</span>
            <strong>{mastery}%</strong>
          </article>
        </div>

        <div className="button-row">
          <button className="primary-button" onClick={() => void onPlayPiece(selectedPiece)} type="button">
            {playbackPieceId === selectedPiece.id ? 'Replay 30-second clip' : 'Play 30-second clip'}
          </button>
          {playbackPieceId === selectedPiece.id ? (
            <button className="ghost-button" onClick={onStopPlayback} type="button">
              Stop
            </button>
          ) : null}
        </div>

        <p className="supporting-text">
          Use learn mode when you want the answer visible before playback for guided repetition and parent-supported study.
        </p>
      </section>
    </div>
  )
}
