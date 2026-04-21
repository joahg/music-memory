import { useEffect, useRef, useState } from 'react'

interface AudioPlayerState {
  activePieceId: string | null
  error: string | null
  isPlaying: boolean
  play: (source: string, pieceId: string) => Promise<void>
  stop: () => void
}

export function useAudioPlayer(): AudioPlayerState {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [activePieceId, setActivePieceId] = useState<string | null>(null)
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

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      setActivePieceId(null)
    }
    const handleError = () => {
      setIsPlaying(false)
      setError('The audio clip could not be played.')
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.pause()
      audio.currentTime = 0
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [])

  async function play(source: string, pieceId: string) {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    setError(null)
    setActivePieceId(pieceId)
    audio.pause()
    audio.src = source
    audio.currentTime = 0

    try {
      await audio.play()
    } catch {
      setIsPlaying(false)
      setError('Playback was blocked. Try the play button again.')
    }
  }

  function stop() {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    audio.pause()
    audio.currentTime = 0
    setIsPlaying(false)
    setActivePieceId(null)
  }

  return {
    activePieceId,
    error,
    isPlaying,
    play,
    stop,
  }
}
