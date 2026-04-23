import type { AppSection, Piece, PieceProgressSummary } from '../types'
import { displayTitle } from '../lib/musicMemory'

interface HomeViewProps {
  attemptCount: number
  masteredCount: number
  onNavigate: (section: AppSection) => void
  onPlayPiece: (piece: Piece) => Promise<void>
  onStopPlayback: () => void
  overallMastery: number
  pieces: Piece[]
  playbackPieceId: string | null
  progressSummaries: Record<string, PieceProgressSummary>
  spotlightPieces: Piece[]
  streakDays: number
  todayXp: number
}

export function HomeView({
  attemptCount,
  masteredCount,
  onNavigate,
  onPlayPiece,
  onStopPlayback,
  overallMastery,
  pieces,
  playbackPieceId,
  progressSummaries,
  spotlightPieces,
  streakDays,
  todayXp,
}: HomeViewProps) {
  return (
    <div className="stack-lg">
      <section className="hero panel">
        <div>
          <p className="eyebrow">Private family practice · offline-friendly</p>
          <h1>Music memory, ready for quick kitchen-table drills.</h1>
          <p className="hero-copy">
            Practice with the local competition library, bundled full recordings, random 30-second windows, and progress that stays on this device.
          </p>
          <div className="button-row">
            <button className="primary-button" onClick={() => onNavigate('drill')} type="button">
              Start drill mode
            </button>
            <button className="secondary-button" onClick={() => onNavigate('competition')} type="button">
              Run competition round
            </button>
          </div>
        </div>

        <div className="hero-meter">
          <div className="hero-meter-label">Overall mastery</div>
          <div className="hero-meter-value">{Math.round(overallMastery * 100)}%</div>
          <div className="meter">
            <span style={{ width: `${Math.round(overallMastery * 100)}%` }} />
          </div>
          <p className="supporting-text">
            {masteredCount} of {pieces.length} pieces are currently at 80% mastery or higher.
          </p>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card panel">
          <span className="stat-label">Pieces loaded</span>
          <strong>{pieces.length}</strong>
        </article>
        <article className="stat-card panel">
          <span className="stat-label">Attempts logged</span>
          <strong>{attemptCount}</strong>
        </article>
        <article className="stat-card panel">
          <span className="stat-label">Today&apos;s XP</span>
          <strong>{todayXp}</strong>
        </article>
        <article className="stat-card panel">
          <span className="stat-label">Practice streak</span>
          <strong>{streakDays} day{streakDays === 1 ? '' : 's'}</strong>
        </article>
      </section>

      <section className="panel stack-md content-panel">
        <div className="section-header">
          <div className="section-header-copy">
            <p className="eyebrow">Focus list</p>
            <h2>Spotlight pieces</h2>
          </div>
          <button className="ghost-button" onClick={() => onNavigate('progress')} type="button">
            View full progress
          </button>
        </div>

        <div className="piece-grid">
          {spotlightPieces.map((piece) => {
            const summary = progressSummaries[piece.id]
            const mastery = Math.round((summary?.mastery ?? 0) * 100)

            return (
              <article className="piece-card" key={piece.id}>
                <div className="piece-card-header">
                  <span className="piece-chip">{piece.ensemble}</span>
                  <span className="mastery-pill">{mastery}% mastery</span>
                </div>
                <h3>{displayTitle(piece)}</h3>
                <p className="piece-meta">{piece.composer}</p>
                <div className="button-row compact-row piece-card-actions">
                  <button className="secondary-button" onClick={() => void onPlayPiece(piece)} type="button">
                    {playbackPieceId === piece.id ? 'Replay another window' : 'Play 30-second window'}
                  </button>
                  <button
                    aria-hidden={playbackPieceId !== piece.id}
                    className={`ghost-button${playbackPieceId === piece.id ? '' : ' reserved-button'}`}
                    disabled={playbackPieceId !== piece.id}
                    onClick={onStopPlayback}
                    tabIndex={playbackPieceId === piece.id ? 0 : -1}
                    type="button"
                  >
                    Stop
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
