import { displayTitle } from '../lib/musicMemory'
import type { Piece, PieceProgressSummary, PracticeResult } from '../types'

interface ProgressViewProps {
  history: PracticeResult[]
  masteredCount: number
  onResetProgress: () => void
  overallMastery: number
  pieces: Piece[]
  progressSummaries: Record<string, PieceProgressSummary>
  streakDays: number
  todayXp: number
  totalXp: number
  weakestPieces: Piece[]
}

export function ProgressView({
  history,
  masteredCount,
  onResetProgress,
  overallMastery,
  pieces,
  progressSummaries,
  streakDays,
  todayXp,
  totalXp,
  weakestPieces,
}: ProgressViewProps) {
  return (
    <div className="stack-lg">
      <section className="stats-grid">
        <article className="stat-card panel">
          <span className="stat-label">Overall mastery</span>
          <strong>{Math.round(overallMastery * 100)}%</strong>
        </article>
        <article className="stat-card panel">
          <span className="stat-label">Pieces mastered</span>
          <strong>
            {masteredCount}/{pieces.length}
          </strong>
        </article>
        <article className="stat-card panel">
          <span className="stat-label">Total XP</span>
          <strong>{totalXp}</strong>
        </article>
        <article className="stat-card panel">
          <span className="stat-label">Today&apos;s XP</span>
          <strong>{todayXp}</strong>
        </article>
      </section>

      <section className="panel stack-md content-panel">
        <div className="section-header">
          <div className="section-header-copy">
            <p className="eyebrow">Progress dashboard</p>
            <h1>{history.length} logged attempts</h1>
          </div>
          <div className="review-summary">
            <span>{streakDays} day streak</span>
            <button className="ghost-button danger-button" onClick={onResetProgress} type="button">
              Reset progress
            </button>
          </div>
        </div>

        <div className="stack-md">
          {weakestPieces.map((piece) => {
            const summary = progressSummaries[piece.id]
            const mastery = Math.round((summary?.mastery ?? 0) * 100)

            return (
              <article className="progress-row" key={piece.id}>
                <div>
                  <h3>{displayTitle(piece)}</h3>
                  <p className="piece-meta">
                    {piece.composer} · {piece.ensemble}
                  </p>
                  <p className="supporting-text">
                    {summary
                      ? `${summary.attempts} attempts · ${summary.correct} correct · ${summary.almost} almost · ${summary.missed} missed`
                      : 'No attempts yet'}
                  </p>
                </div>
                <div className="progress-pill-group">
                  <span className="mastery-pill">{mastery}% mastery</span>
                  <div className="meter compact-meter">
                    <span style={{ width: `${mastery}%` }} />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
