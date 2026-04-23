import { useEffect, useMemo, useState } from 'react'
import { competitionRound, displayTitle } from '../lib/musicMemory'
import type { Piece, PracticeRating } from '../types'

interface CompetitionPrompt {
  piece: Piece
  composerGuess: string
  hasPlayed: boolean
  rating: PracticeRating | null
  titleGuess: string
}

interface CompetitionViewProps {
  onPlayPiece: (piece: Piece) => Promise<void>
  onRecordBatch: (results: Array<{ piece: Piece; rating: PracticeRating }>) => void
  onStopPlayback: () => void
  pieces: Piece[]
  playbackPieceId: string | null
}

const reviewRatings: Array<{ label: string; rating: PracticeRating }> = [
  { label: 'Missed', rating: 'missed' },
  { label: 'Almost', rating: 'almost' },
  { label: 'Correct', rating: 'correct' },
]

export function CompetitionView({ onPlayPiece, onRecordBatch, onStopPlayback, pieces, playbackPieceId }: CompetitionViewProps) {
  const [roundSize, setRoundSize] = useState(Math.min(10, Math.max(1, pieces.length)))
  const [prompts, setPrompts] = useState<CompetitionPrompt[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [didSaveResults, setDidSaveResults] = useState(false)

  useEffect(() => {
    setRoundSize((current) => Math.min(Math.max(1, current), Math.max(1, pieces.length)))
  }, [pieces.length])

  const isReview = prompts.length > 0 && currentIndex >= prompts.length
  const currentPrompt = prompts[currentIndex]
  const allRated = prompts.length > 0 && prompts.every((prompt) => prompt.rating !== null)

  const summaryCounts = useMemo(() => {
    return prompts.reduce(
      (counts, prompt) => {
        if (prompt.rating) {
          counts[prompt.rating] += 1
        }

        return counts
      },
      { almost: 0, correct: 0, missed: 0 },
    )
  }, [prompts])

  function startRound() {
    setPrompts(
      competitionRound(pieces, roundSize).map((piece) => ({
        piece,
        composerGuess: '',
        hasPlayed: false,
        rating: null,
        titleGuess: '',
      })),
    )
    setCurrentIndex(0)
    setDidSaveResults(false)
  }

  function updatePrompt(index: number, patch: Partial<CompetitionPrompt>) {
    setPrompts((currentPrompts) =>
      currentPrompts.map((prompt, promptIndex) => (promptIndex === index ? { ...prompt, ...patch } : prompt)),
    )
  }

  if (prompts.length === 0) {
    return (
      <section className="panel stack-md content-panel">
        <div className="section-header">
          <div className="section-header-copy">
            <p className="eyebrow">Competition mode</p>
            <h1>Run a no-peeking round.</h1>
          </div>
        </div>

        <p className="supporting-text">
          Each prompt gives one play. That play uses a random 30-second window from the bundled local recording. Type your guess, move on, and score the whole round only after the review screen.
        </p>

        <label className="field-label" htmlFor="round-size">
          Round size
        </label>
        <input
          id="round-size"
          max={Math.max(1, pieces.length)}
          min={1}
          onChange={(event) => setRoundSize(Number(event.target.value))}
          type="range"
          value={roundSize}
        />
        <div className="range-caption">{roundSize} prompt{roundSize === 1 ? '' : 's'}</div>

        <button className="primary-button" disabled={pieces.length === 0} onClick={startRound} type="button">
          Start round
        </button>
      </section>
    )
  }

  if (!isReview && currentPrompt) {
    return (
      <section className="panel stack-md content-panel">
        <div className="section-header">
          <div className="section-header-copy">
            <p className="eyebrow">Competition prompt</p>
            <h1>
              Prompt {currentIndex + 1} of {prompts.length}
            </h1>
          </div>
        </div>

        <p className="supporting-text">Play once, type what you think it is, and move to the next prompt without revealing the answer.</p>

        <div className="button-row">
          <button
            className="primary-button"
            disabled={currentPrompt.hasPlayed}
            onClick={() => {
              updatePrompt(currentIndex, { hasPlayed: true })
              void onPlayPiece(currentPrompt.piece)
            }}
            type="button"
          >
            {currentPrompt.hasPlayed ? 'Window already used' : 'Play window once'}
          </button>

          {playbackPieceId === currentPrompt.piece.id ? (
            <button className="ghost-button" onClick={onStopPlayback} type="button">
              Stop
            </button>
          ) : null}
        </div>

        <label className="field-label" htmlFor="title-guess">
          Selection or full title
        </label>
        <input
          className="text-input"
          id="title-guess"
          onChange={(event) => updatePrompt(currentIndex, { titleGuess: event.target.value })}
          placeholder="Movement, title, or full work name"
          type="text"
          value={currentPrompt.titleGuess}
        />

        <label className="field-label" htmlFor="composer-guess">
          Composer
        </label>
        <input
          className="text-input"
          id="composer-guess"
          onChange={(event) => updatePrompt(currentIndex, { composerGuess: event.target.value })}
          placeholder="Composer"
          type="text"
          value={currentPrompt.composerGuess}
        />

        <button className="secondary-button" onClick={() => setCurrentIndex((index) => index + 1)} type="button">
          {currentIndex === prompts.length - 1 ? 'Finish round' : 'Next prompt'}
        </button>
      </section>
    )
  }

  return (
    <section className="panel stack-md content-panel">
      <div className="section-header">
        <div className="section-header-copy">
          <p className="eyebrow">Review</p>
          <h1>Score the round</h1>
        </div>
        <div className="review-summary">
          <span>{summaryCounts.correct} correct</span>
          <span>{summaryCounts.almost} almost</span>
          <span>{summaryCounts.missed} missed</span>
        </div>
      </div>

      <p className="supporting-text">Compare each guess to the correct answer, then save the round into local progress.</p>

      <div className="stack-md">
        {prompts.map((prompt, index) => (
          <article className="piece-card review-card" key={prompt.piece.id}>
            <div className="piece-card-header">
              <span className="piece-chip">Prompt {index + 1}</span>
              <span className="piece-chip">{prompt.piece.ensemble}</span>
            </div>
            <h3>{displayTitle(prompt.piece)}</h3>
            <p className="piece-meta">{prompt.piece.composer}</p>
            <div className="guess-grid">
              <div>
                <span className="field-label">Your title</span>
                <p>{prompt.titleGuess || 'No title entered'}</p>
              </div>
              <div>
                <span className="field-label">Your composer</span>
                <p>{prompt.composerGuess || 'No composer entered'}</p>
              </div>
            </div>
            <div className="button-row compact-row">
              {reviewRatings.map(({ label, rating }) => (
                <button
                  className={`rating-button rating-${rating}${prompt.rating === rating ? ' is-selected' : ''}`}
                  key={rating}
                  onClick={() => updatePrompt(index, { rating })}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="button-row">
        <button
          className="primary-button"
          disabled={!allRated || didSaveResults}
          onClick={() => {
            onRecordBatch(
              prompts
                .filter((prompt): prompt is CompetitionPrompt & { rating: PracticeRating } => prompt.rating !== null)
                .map((prompt) => ({ piece: prompt.piece, rating: prompt.rating })),
            )
            setDidSaveResults(true)
          }}
          type="button"
        >
          {didSaveResults ? 'Results saved' : 'Save results to progress'}
        </button>
        <button
          className="ghost-button"
          onClick={() => {
            setPrompts([])
            setCurrentIndex(0)
            setDidSaveResults(false)
          }}
          type="button"
        >
          Start another round
        </button>
      </div>
    </section>
  )
}
