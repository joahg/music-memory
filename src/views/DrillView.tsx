import { useEffect, useMemo, useState } from 'react'
import { displayTitle } from '../lib/musicMemory'
import type { Piece, PieceProgressSummary, PracticeRating } from '../types'

interface DrillViewProps {
  drillPieces: Piece[]
  onPlayPiece: (piece: Piece) => Promise<void>
  onRatePiece: (piece: Piece, rating: PracticeRating) => void
  onStopPlayback: () => void
  playbackPieceId: string | null
  progressSummaries: Record<string, PieceProgressSummary>
}

const ratingButtons: Array<{ label: string; rating: PracticeRating }> = [
  { label: 'Missed', rating: 'missed' },
  { label: 'Almost', rating: 'almost' },
  { label: 'Correct', rating: 'correct' },
]

export function DrillView({
  drillPieces,
  onPlayPiece,
  onRatePiece,
  onStopPlayback,
  playbackPieceId,
  progressSummaries,
}: DrillViewProps) {
  const [queue, setQueue] = useState<Piece[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    if (queue.length === 0 && drillPieces.length > 0) {
      setQueue(drillPieces)
      setCurrentIndex(0)
      setIsRevealed(false)
    }
  }, [drillPieces, queue.length])

  const currentPiece = queue[currentIndex]
  const queueLength = queue.length
  const progress = queueLength === 0 ? 0 : Math.round((Math.min(currentIndex, queueLength) / queueLength) * 100)
  const summary = currentPiece ? progressSummaries[currentPiece.id] : undefined
  const mastery = Math.round((summary?.mastery ?? 0) * 100)

  const attemptsLabel = useMemo(() => {
    if (!summary) {
      return 'New piece in the queue.'
    }

    return `${summary.attempts} attempts so far · ${summary.correct} correct · ${summary.almost} almost · ${summary.missed} missed`
  }, [summary])

  function resetSession() {
    setQueue(drillPieces)
    setCurrentIndex(0)
    setIsRevealed(false)
  }

  if (!currentPiece) {
    return (
      <section className="panel stack-md content-panel">
        <div className="section-header">
          <div className="section-header-copy">
            <p className="eyebrow">Drill mode</p>
            <h1>Session complete</h1>
          </div>
          <button className="secondary-button" onClick={resetSession} type="button">
            Start new drill
          </button>
        </div>
        <p className="supporting-text">Run another drill to repeat the pieces that still need more work.</p>
      </section>
    )
  }

  return (
    <div className="stack-lg">
      <section className="panel stack-md content-panel">
        <div className="section-header">
          <div className="section-header-copy">
            <p className="eyebrow">Drill mode</p>
            <h1>Listen first, reveal second.</h1>
          </div>
          <button className="ghost-button" onClick={resetSession} type="button">
            Reload session
          </button>
        </div>

        <div>
          <div className="progress-header">
            <span>
              Piece {Math.min(currentIndex + 1, queueLength)} of {queueLength}
            </span>
            <span>{progress}% complete</span>
          </div>
          <div className="meter">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        <p className="supporting-text">The queue is prioritized toward missed and unseen pieces first.</p>

        <div className="button-row">
          <button className="primary-button" onClick={() => void onPlayPiece(currentPiece)} type="button">
            {playbackPieceId === currentPiece.id ? 'Replay clip' : 'Play 30-second clip'}
          </button>
          {playbackPieceId === currentPiece.id ? (
            <button className="ghost-button" onClick={onStopPlayback} type="button">
              Stop
            </button>
          ) : null}
          {!isRevealed ? (
            <button className="secondary-button" onClick={() => setIsRevealed(true)} type="button">
              Reveal answer
            </button>
          ) : null}
        </div>
      </section>

      <section className="panel stack-md content-panel">
        {!isRevealed ? (
          <>
            <p className="eyebrow">Current prompt</p>
            <h2>Say the title and composer out loud, then reveal the answer.</h2>
            <p className="supporting-text">One focused guess beats three quick peeks.</p>
          </>
        ) : (
          <>
            <p className="eyebrow">Answer</p>
            <h2>{displayTitle(currentPiece)}</h2>
            <p className="detail-composer">{currentPiece.composer}</p>
            <div className="detail-grid">
              <article className="detail-card">
                <span>Ensemble</span>
                <strong>{currentPiece.ensemble}</strong>
              </article>
              <article className="detail-card">
                <span>Mastery</span>
                <strong>{mastery}%</strong>
              </article>
            </div>
            <p className="supporting-text">{attemptsLabel}</p>
            <div className="button-row compact-row">
              {ratingButtons.map(({ label, rating }) => (
                <button
                  className={`rating-button rating-${rating}`}
                  key={rating}
                  onClick={() => {
                    onStopPlayback()
                    onRatePiece(currentPiece, rating)
                    setIsRevealed(false)
                    setCurrentIndex((index) => index + 1)
                  }}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
