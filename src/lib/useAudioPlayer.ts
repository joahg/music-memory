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
  const playRequestRef = useRef(0)
  const [activePieceId, setActivePieceId] = useState<string | null>(null)
  const [clipRangeLabel, setClipRangeLabel] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    return () => {
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
    stopActivePlayback(activeSourceRef)
    setClipRangeLabel(null)
    setIsPlaying(false)
    setActivePieceId(null)

    try {
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
    } catch {
      stopActivePlayback(activeSourceRef)
      setClipRangeLabel(null)
      setIsPlaying(false)
      setActivePieceId(null)
      setError('Playback failed. Try the play button again.')
    }
  }

  function stop() {
    playRequestRef.current += 1
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
    return cachedBuffer
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
  return loadingBuffer
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
