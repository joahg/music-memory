import { useEffect, useMemo, useState } from 'react'
import { assetUrl } from './lib/assets'
import {
  createPracticeResult,
  drillQueue,
  overallMastery as computeOverallMastery,
  progressSummaries,
  streakDays as computeStreakDays,
  xpForRating,
} from './lib/musicMemory'
import { loadHistory, saveHistory } from './lib/storage'
import { useAudioPlayer } from './lib/useAudioPlayer'
import type { AppSection, Piece, PracticeRating } from './types'
import { CompetitionView } from './views/CompetitionView'
import { DrillView } from './views/DrillView'
import { HomeView } from './views/HomeView'
import { LearnView } from './views/LearnView'
import { LibraryView } from './views/LibraryView'
import { ProgressView } from './views/ProgressView'

const sectionOrder: AppSection[] = ['home', 'learn', 'drill', 'competition', 'library', 'progress']
const mobileNavMediaQuery = '(max-width: 720px)'

const sectionLabels: Record<AppSection, string> = {
  home: 'Home',
  learn: 'Learn',
  drill: 'Drill',
  competition: 'Competition',
  library: 'Library',
  progress: 'Progress',
}

export default function App() {
  const [pieces, setPieces] = useState<Piece[]>([])
  const [history, setHistory] = useState(loadHistory)
  const [section, setSection] = useState<AppSection>(readSectionFromHash())
  const [isMobileNav, setIsMobileNav] = useState(readMobileNavState)
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)

  const audio = useAudioPlayer()

  useEffect(() => {
    const controller = new AbortController()

    async function loadPieces() {
      try {
        setIsLoading(true)
        const response = await fetch(assetUrl('library/pieces.json'), { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`Failed to load the local piece library (${response.status}).`)
        }

        const loadedPieces = (await response.json()) as Piece[]
        setPieces(loadedPieces)
        setLoadError(null)
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        setLoadError(error instanceof Error ? error.message : 'The local piece library could not be loaded.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadPieces()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    saveHistory(history)
  }, [history])

  useEffect(() => {
    const handleHashChange = () => setSection(readSectionFromHash())
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia(mobileNavMediaQuery)

    const updateIsMobileNav = (event?: MediaQueryListEvent) => {
      const matches = event?.matches ?? mediaQuery.matches
      setIsMobileNav(matches)

      if (!matches) {
        setIsNavOpen(false)
      }
    }

    updateIsMobileNav()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateIsMobileNav)
      return () => mediaQuery.removeEventListener('change', updateIsMobileNav)
    }

    mediaQuery.addListener(updateIsMobileNav)
    return () => mediaQuery.removeListener(updateIsMobileNav)
  }, [])

  useEffect(() => {
    audio.stop()
  }, [section])

  useEffect(() => {
    if (isMobileNav) {
      setIsNavOpen(false)
    }
  }, [isMobileNav, section])

  const summaries = useMemo(() => progressSummaries(history), [history])
  const queue = useMemo(() => drillQueue(pieces, history), [history, pieces])
  const composers = useMemo(() => [...new Set(pieces.map((piece) => piece.composer))].sort(), [pieces])
  const ensembles = useMemo(() => [...new Set(pieces.map((piece) => piece.ensemble))].sort(), [pieces])
  const weakestPieces = useMemo(
    () =>
      [...pieces].sort((left, right) => {
        const leftMastery = summaries[left.id]?.mastery ?? -1
        const rightMastery = summaries[right.id]?.mastery ?? -1

        if (leftMastery === rightMastery) {
          return left.composer.localeCompare(right.composer)
        }

        return leftMastery - rightMastery
      }),
    [pieces, summaries],
  )

  const overallMastery = computeOverallMastery(pieces, summaries)
  const masteredCount = pieces.filter((piece) => (summaries[piece.id]?.mastery ?? 0) >= 0.8).length
  const totalXp = history.reduce((sum, result) => sum + xpForRating(result.rating), 0)
  const todayXp = history
    .filter((result) => new Date(result.answeredAt).toDateString() === new Date().toDateString())
    .reduce((sum, result) => sum + xpForRating(result.rating), 0)
  const streakDays = computeStreakDays(history)
  const spotlightPieces = queue.slice(0, 4)

  async function playPiece(piece: Piece) {
    await audio.play(assetUrl(`audio/${piece.audioFile}`), piece.id)
  }

  function recordPiece(piece: Piece, rating: PracticeRating) {
    setHistory((currentHistory) => [...currentHistory, createPracticeResult(piece.id, rating)])
  }

  function recordBatch(results: Array<{ piece: Piece; rating: PracticeRating }>) {
    setHistory((currentHistory) => [
      ...currentHistory,
      ...results.map(({ piece, rating }) => createPracticeResult(piece.id, rating)),
    ])
  }

  function resetProgress() {
    if (window.confirm('Clear all local progress for this browser?')) {
      setHistory([])
    }
  }

  function navigate(nextSection: AppSection) {
    setSection(nextSection)
    setIsNavOpen(false)
    window.location.hash = nextSection
  }

  return (
    <div className="app-frame">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      {isMobileNav ? (
        <button
          aria-hidden={!isNavOpen}
          aria-label="Close navigation"
          className={`sidebar-backdrop${isNavOpen ? ' is-visible' : ''}`}
          onClick={() => setIsNavOpen(false)}
          tabIndex={isNavOpen ? 0 : -1}
          type="button"
        />
      ) : null}

      <aside className={`sidebar panel${isNavOpen ? ' is-open' : ''}`}>
        <div className="sidebar-brand">
          <p className="eyebrow">Music Memory</p>
          <h1>Practice Studio</h1>
          <p className="supporting-text">Bundled full tracks, no sign-in, local-only progress.</p>
        </div>

        <nav className="nav-list" aria-label="Primary navigation" id="primary-navigation">
          {sectionOrder.map((item) => (
            <button
              className={`nav-button${section === item ? ' is-active' : ''}`}
              key={item}
              onClick={() => navigate(item)}
              type="button"
            >
              {sectionLabels[item]}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="status-dot-row">
            <span className={`status-dot${isOnline ? '' : ' is-offline'}`} />
            <span>{isOnline ? 'Online and cache-ready' : 'Offline mode active'}</span>
          </div>
          <p className="supporting-text">Once loaded, the PWA can keep practicing with the bundled repertoire offline.</p>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar panel">
          <div className="topbar-copy">
            <p className="eyebrow">Current section</p>
            <h2>{sectionLabels[section]}</h2>
          </div>
          {isMobileNav ? (
            <button
              aria-controls="primary-navigation"
              aria-expanded={isNavOpen}
              className="ghost-button mobile-nav-toggle"
              onClick={() => setIsNavOpen((current) => !current)}
              type="button"
            >
              {isNavOpen ? 'Close' : 'Menu'}
            </button>
          ) : null}
          <div className="topbar-status">
            {audio.clipRangeLabel ? <span className="piece-chip">Window {audio.clipRangeLabel}</span> : null}
            {audio.error ? <span className="alert-pill">{audio.error}</span> : null}
            {audio.isPlaying ? <span className="success-pill">30-second window playing</span> : <span className="piece-chip">Ready</span>}
          </div>
        </header>

        {isLoading ? <section className="panel empty-state">Loading the local music library...</section> : null}
        {!isLoading && loadError ? <section className="panel empty-state">{loadError}</section> : null}
        {!isLoading && !loadError ? renderSection() : null}
      </main>
    </div>
  )

  function renderSection() {
    switch (section) {
      case 'home':
        return (
          <HomeView
            attemptCount={history.length}
            masteredCount={masteredCount}
            onNavigate={navigate}
            onPlayPiece={playPiece}
            onStopPlayback={audio.stop}
            overallMastery={overallMastery}
            pieces={pieces}
            playbackPieceId={audio.activePieceId}
            progressSummaries={summaries}
            spotlightPieces={spotlightPieces}
            streakDays={streakDays}
            todayXp={todayXp}
          />
        )
      case 'learn':
        return (
          <LearnView
            onPlayPiece={playPiece}
            onStopPlayback={audio.stop}
            pieces={pieces}
            playbackPieceId={audio.activePieceId}
            progressSummaries={summaries}
          />
        )
      case 'drill':
        return (
          <DrillView
            drillPieces={queue}
            onPlayPiece={playPiece}
            onRatePiece={recordPiece}
            onStopPlayback={audio.stop}
            playbackPieceId={audio.activePieceId}
            progressSummaries={summaries}
          />
        )
      case 'competition':
        return (
          <CompetitionView
            onPlayPiece={playPiece}
            onRecordBatch={recordBatch}
            onStopPlayback={audio.stop}
            pieces={pieces}
            playbackPieceId={audio.activePieceId}
          />
        )
      case 'library':
        return (
          <LibraryView
            composers={composers}
            ensembles={ensembles}
            onPlayPiece={playPiece}
            onStopPlayback={audio.stop}
            pieces={pieces}
            playbackPieceId={audio.activePieceId}
            progressSummaries={summaries}
          />
        )
      case 'progress':
        return (
          <ProgressView
            history={history}
            masteredCount={masteredCount}
            onResetProgress={resetProgress}
            overallMastery={overallMastery}
            pieces={pieces}
            progressSummaries={summaries}
            streakDays={streakDays}
            todayXp={todayXp}
            totalXp={totalXp}
            weakestPieces={weakestPieces}
          />
        )
    }
  }
}

function readSectionFromHash(): AppSection {
  const hash = window.location.hash.replace('#', '')
  return sectionOrder.includes(hash as AppSection) ? (hash as AppSection) : 'home'
}

function readMobileNavState(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia(mobileNavMediaQuery).matches
}
