import { useEffect, useRef, useState } from 'react'

const CLIP_DURATION_SECONDS = 30

// The Strauss source file contains the whole work, but this repertoire entry is only the introduction.
const fixedClipStarts: Partial<Record<string, number>> = {
  'strauss-also-sprach-zarathustra-introduction': 0,
}

interface AudioPlayerState {
  activePieceId: string | null
  clipRangeLabel: string | null
  error: string | null
  isPlaying: boolean
  play: (source: string, pieceId: string) => Promise<void>
  stop: () => void
}

export function useAudioPlayer(): AudioPlayerState {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const clipEndTimeRef = useRef<number | null>(null)
  const durationCacheRef = useRef<Map<string, number>>(new Map())
  const playRequestRef = useRef(0)
  const stopTimerRef = useRef<number | null>(null)
  const [activePieceId, setActivePieceId] = useState<string | null>(null)
  const [clipRangeLabel, setClipRangeLabel] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  if (!audioRef.current && typeof Audio !== 'undefined') {
    audioRef.current = new Audio()
    audioRef.current.preload = 'auto'
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return undefined
    }

    const clearStopTimer = () => {
      if (stopTimerRef.current !== null) {
        window.clearTimeout(stopTimerRef.current)
        stopTimerRef.current = null
      }
    }

    const clearClipWindow = () => {
      clearStopTimer()
      clipEndTimeRef.current = null
      setClipRangeLabel(null)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => {
      clearStopTimer()
      setIsPlaying(false)
    }
    const handleEnded = () => {
      clearClipWindow()
      setIsPlaying(false)
      setActivePieceId(null)
    }
    const handleTimeUpdate = () => {
      if (clipEndTimeRef.current === null || audio.currentTime < clipEndTimeRef.current) {
        return
      }

      clearClipWindow()
      audio.pause()
      setIsPlaying(false)
      setActivePieceId(null)
    }
    const handleError = () => {
      clearClipWindow()
      setIsPlaying(false)
      setActivePieceId(null)
      setError('The audio clip could not be played.')
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('error', handleError)

    return () => {
      clearClipWindow()
      audio.pause()
      audio.currentTime = 0
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('error', handleError)
    }
  }, [])

  async function play(source: string, pieceId: string) {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    playRequestRef.current += 1
    const playRequestId = playRequestRef.current
    setError(null)

    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }

    clipEndTimeRef.current = null
    setClipRangeLabel(null)
    audio.pause()

    try {
      const duration = await loadDuration(audio, source, durationCacheRef.current)

      if (playRequestId !== playRequestRef.current) {
        return
      }

      const clipStart = chooseClipStart(pieceId, duration)
      const clipEnd = Math.min(duration, clipStart + CLIP_DURATION_SECONDS)
      const playbackSource = buildPlaybackSource(source, clipStart, clipEnd)

      audio.src = playbackSource
      audio.load()
      await waitForMetadata(audio)
      await waitForCanPlay(audio)

      if (playRequestId !== playRequestRef.current) {
        return
      }

      clipEndTimeRef.current = clipEnd
      setClipRangeLabel(`${formatTimestamp(clipStart)}-${formatTimestamp(clipEnd)}`)

      setActivePieceId(pieceId)
      await audio.play()

      if (playRequestId !== playRequestRef.current) {
        audio.pause()
        audio.currentTime = 0
        return
      }

      stopTimerRef.current = window.setTimeout(() => {
        if (clipEndTimeRef.current === null) {
          return
        }

        clipEndTimeRef.current = null
        setClipRangeLabel(null)
        audio.pause()
        setActivePieceId(null)
      }, Math.max((clipEnd - clipStart) * 1000 + 150, 0))
    } catch {
      if (stopTimerRef.current !== null) {
        window.clearTimeout(stopTimerRef.current)
        stopTimerRef.current = null
      }

      clipEndTimeRef.current = null
      audio.pause()
      audio.currentTime = 0
      setClipRangeLabel(null)
      setIsPlaying(false)
      setActivePieceId(null)
      setError('Playback failed. Try the play button again.')
    }
  }

  function stop() {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    playRequestRef.current += 1

    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }

    clipEndTimeRef.current = null
    audio.pause()
    audio.currentTime = 0
    setClipRangeLabel(null)
    setIsPlaying(false)
    setActivePieceId(null)
  }

  return {
    activePieceId,
    clipRangeLabel,
    error,
    isPlaying,
    play,
    stop,
  }
}

async function loadDuration(audio: HTMLAudioElement, source: string, cache: Map<string, number>): Promise<number> {
  const cachedDuration = cache.get(source)
  if (typeof cachedDuration === 'number') {
    return cachedDuration
  }

  audio.src = source
  audio.load()

  const duration = await waitForMetadata(audio)
  cache.set(source, duration)
  return duration
}

function chooseClipStart(pieceId: string, duration: number): number {
  const fixedStart = fixedClipStarts[pieceId]
  if (typeof fixedStart === 'number') {
    return Math.max(0, Math.min(fixedStart, Math.max(duration - CLIP_DURATION_SECONDS, 0)))
  }

  const maxStart = Math.max(Math.floor(duration - CLIP_DURATION_SECONDS), 0)
  if (maxStart === 0) {
    return 0
  }

  return Math.floor(Math.random() * (maxStart + 1))
}

function formatTimestamp(value: number): string {
  const totalSeconds = Math.max(0, Math.floor(value))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function buildPlaybackSource(source: string, clipStart: number, clipEnd: number): string {
  if (clipStart <= 0) {
    return source
  }

  return `${source}#t=${Math.max(0, Math.floor(clipStart))},${Math.max(0, Math.ceil(clipEnd))}`
}

async function waitForMetadata(audio: HTMLAudioElement): Promise<number> {
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    return audio.duration
  }

  return new Promise<number>((resolve, reject) => {
    const handleLoadedMetadata = () => {
      cleanup()
      resolve(audio.duration)
    }
    const handleError = () => {
      cleanup()
      reject(new Error('Audio metadata could not be loaded.'))
    }
    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('error', handleError)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('error', handleError)
  })
}

async function waitForCanPlay(audio: HTMLAudioElement): Promise<void> {
  if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    return
  }

  return new Promise<void>((resolve, reject) => {
    const handleCanPlay = () => {
      cleanup()
      resolve()
    }
    const handleError = () => {
      cleanup()
      reject(new Error('Audio data could not be buffered for playback.'))
    }
    const cleanup = () => {
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('error', handleError)
    }

    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('error', handleError)
  })
}
