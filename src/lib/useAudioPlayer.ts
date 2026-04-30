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
  const audioContextRef = useRef<AudioContext | null>(null)
  const bufferCacheRef = useRef<Map<string, Promise<AudioBuffer>>>(new Map())
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const mediaElementRef = useRef<HTMLAudioElement | null>(null)
  const mediaStopTimerRef = useRef<number | null>(null)
  const playRequestRef = useRef(0)
  const [activePieceId, setActivePieceId] = useState<string | null>(null)
  const [clipRangeLabel, setClipRangeLabel] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    return () => {
      stopMediaPlayback(mediaElementRef, mediaStopTimerRef)
      stopActivePlayback(activeSourceRef)

      const audioContext = audioContextRef.current
      audioContextRef.current = null

      if (audioContext) {
        void audioContext.close()
      }
    }
  }, [])

  async function play(source: string, pieceId: string) {
    playRequestRef.current += 1
    const playRequestId = playRequestRef.current
    setError(null)
    stopMediaPlayback(mediaElementRef, mediaStopTimerRef)
    stopActivePlayback(activeSourceRef)
    setClipRangeLabel(null)
    setIsPlaying(false)
    setActivePieceId(null)

    try {
      if (shouldUseStreamingPlayback()) {
        await playWithMediaElement({
          source,
          pieceId,
          mediaElementRef,
          mediaStopTimerRef,
          playRequestId,
          playRequestRef,
          setActivePieceId,
          setClipRangeLabel,
          setIsPlaying,
        })
        return
      }

      const audioContext = getAudioContext(audioContextRef)
      await audioContext.resume()

      const buffer = await loadAudioBuffer(audioContext, source, bufferCacheRef.current)

      if (playRequestId !== playRequestRef.current) {
        return
      }

      const clipStart = chooseClipStart(pieceId, buffer.duration)
      const clipDuration = Math.min(CLIP_DURATION_SECONDS, Math.max(buffer.duration - clipStart, 0.1))
      const clipEnd = Math.min(buffer.duration, clipStart + clipDuration)

      const playbackSource = audioContext.createBufferSource()
      playbackSource.buffer = buffer
      playbackSource.connect(audioContext.destination)
      activeSourceRef.current = playbackSource

      setClipRangeLabel(`${formatTimestamp(clipStart)}-${formatTimestamp(clipEnd)}`)
      setActivePieceId(pieceId)

      playbackSource.onended = () => {
        if (activeSourceRef.current !== playbackSource || playRequestId !== playRequestRef.current) {
          return
        }

        activeSourceRef.current = null
        setClipRangeLabel(null)
        setIsPlaying(false)
        setActivePieceId(null)
      }

      playbackSource.start(0, clipStart, clipDuration)
      setIsPlaying(true)
    } catch (error) {
      console.error('Playback failed.', error)
      stopMediaPlayback(mediaElementRef, mediaStopTimerRef)
      stopActivePlayback(activeSourceRef)
      setClipRangeLabel(null)
      setIsPlaying(false)
      setActivePieceId(null)
      setError('Playback failed. Try the play button again.')
    }
  }

  function stop() {
    playRequestRef.current += 1
    stopMediaPlayback(mediaElementRef, mediaStopTimerRef)
    stopActivePlayback(activeSourceRef)
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

function getAudioContext(audioContextRef: { current: AudioContext | null }): AudioContext {
  if (audioContextRef.current) {
    return audioContextRef.current
  }

  const AudioContextConstructor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextConstructor) {
    throw new Error('Web Audio is not supported in this browser.')
  }

  audioContextRef.current = new AudioContextConstructor()
  return audioContextRef.current
}

async function loadAudioBuffer(
  audioContext: AudioContext,
  source: string,
  cache: Map<string, Promise<AudioBuffer>>,
): Promise<AudioBuffer> {
  const cachedBuffer = cache.get(source)
  if (cachedBuffer) {
    try {
      return await cachedBuffer
    } catch (error) {
      cache.delete(source)
      throw error
    }
  }

  const loadingBuffer = fetch(source)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load audio (${response.status}).`)
      }

      return response.arrayBuffer()
    })
    .then((buffer) => audioContext.decodeAudioData(buffer))

  cache.set(source, loadingBuffer)

  try {
    return await loadingBuffer
  } catch (error) {
    cache.delete(source)
    throw error
  }
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

function stopActivePlayback(activeSourceRef: { current: AudioBufferSourceNode | null }) {
  const activeSource = activeSourceRef.current
  if (!activeSource) {
    return
  }

  activeSourceRef.current = null
  activeSource.onended = null

  try {
    activeSource.stop()
  } catch {
    // Ignore stop errors when the node has already ended.
  }

  activeSource.disconnect()
}

function shouldUseStreamingPlayback(): boolean {
  const { userAgent, maxTouchPoints, platform } = window.navigator
  return /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
}

async function playWithMediaElement({
  source,
  pieceId,
  mediaElementRef,
  mediaStopTimerRef,
  playRequestId,
  playRequestRef,
  setActivePieceId,
  setClipRangeLabel,
  setIsPlaying,
}: {
  source: string
  pieceId: string
  mediaElementRef: { current: HTMLAudioElement | null }
  mediaStopTimerRef: { current: number | null }
  playRequestId: number
  playRequestRef: { current: number }
  setActivePieceId: (pieceId: string | null) => void
  setClipRangeLabel: (label: string | null) => void
  setIsPlaying: (isPlaying: boolean) => void
}) {
  const audio = new Audio(source)
  audio.muted = true
  audio.preload = 'auto'
  audio.setAttribute('playsinline', '')
  audio.setAttribute('webkit-playsinline', 'true')
  mediaElementRef.current = audio

  await audio.play()
  const duration = await waitForAudioMetadata(audio)

  if (playRequestId !== playRequestRef.current || mediaElementRef.current !== audio) {
    stopSpecificMediaPlayback(audio, mediaElementRef, mediaStopTimerRef)
    return
  }

  const clipStart = chooseClipStart(pieceId, duration)
  const clipDuration = Math.min(CLIP_DURATION_SECONDS, Math.max(duration - clipStart, 0.1))
  const clipEnd = Math.min(duration, clipStart + clipDuration)

  await seekMediaElement(audio, clipStart)

  if (playRequestId !== playRequestRef.current || mediaElementRef.current !== audio) {
    stopSpecificMediaPlayback(audio, mediaElementRef, mediaStopTimerRef)
    return
  }

  setClipRangeLabel(`${formatTimestamp(clipStart)}-${formatTimestamp(clipEnd)}`)
  setActivePieceId(pieceId)
  setIsPlaying(true)
  audio.muted = false

  const finishPlayback = () => {
    if (playRequestId !== playRequestRef.current || mediaElementRef.current !== audio) {
      return
    }

    stopSpecificMediaPlayback(audio, mediaElementRef, mediaStopTimerRef)
    setClipRangeLabel(null)
    setActivePieceId(null)
    setIsPlaying(false)
  }

  audio.onended = finishPlayback
  mediaStopTimerRef.current = window.setTimeout(finishPlayback, clipDuration * 1000)
}

async function waitForAudioMetadata(audio: HTMLAudioElement): Promise<number> {
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    return audio.duration
  }

  await new Promise<void>((resolve, reject) => {
    const handleLoadedMetadata = () => {
      cleanup()
      resolve()
    }

    const handleError = () => {
      cleanup()
      reject(new Error('Failed to load audio metadata.'))
    }

    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('error', handleError)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('error', handleError)

    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      cleanup()
      resolve()
    }
  })

  if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
    throw new Error('Audio duration was unavailable.')
  }

  return audio.duration
}

async function seekMediaElement(audio: HTMLAudioElement, position: number): Promise<void> {
  if (Math.abs(audio.currentTime - position) < 0.25) {
    return
  }

  await new Promise<void>((resolve, reject) => {
    const handleSeeked = () => {
      cleanup()
      resolve()
    }

    const handleError = () => {
      cleanup()
      reject(new Error('Failed to seek audio playback.'))
    }

    const cleanup = () => {
      audio.removeEventListener('seeked', handleSeeked)
      audio.removeEventListener('error', handleError)
    }

    audio.addEventListener('seeked', handleSeeked)
    audio.addEventListener('error', handleError)

    try {
      audio.currentTime = position

      if (Math.abs(audio.currentTime - position) < 0.25) {
        cleanup()
        resolve()
      }
    } catch (error) {
      cleanup()
      reject(error)
    }
  })
}

function stopMediaPlayback(
  mediaElementRef: { current: HTMLAudioElement | null },
  mediaStopTimerRef: { current: number | null },
) {
  const audio = mediaElementRef.current
  if (!audio) {
    clearMediaStopTimer(mediaStopTimerRef)
    return
  }

  stopSpecificMediaPlayback(audio, mediaElementRef, mediaStopTimerRef)
}

function stopSpecificMediaPlayback(
  audio: HTMLAudioElement,
  mediaElementRef: { current: HTMLAudioElement | null },
  mediaStopTimerRef: { current: number | null },
) {
  clearMediaStopTimer(mediaStopTimerRef)

  if (mediaElementRef.current === audio) {
    mediaElementRef.current = null
  }

  audio.onended = null
  audio.onerror = null
  audio.pause()
  audio.removeAttribute('src')
  audio.load()
}

function clearMediaStopTimer(mediaStopTimerRef: { current: number | null }) {
  if (mediaStopTimerRef.current === null) {
    return
  }

  window.clearTimeout(mediaStopTimerRef.current)
  mediaStopTimerRef.current = null
}
