import type { PracticeRating, PracticeResult } from '../types'

const HISTORY_STORAGE_KEY = 'music-memory-progress-v1'
const validRatings = new Set<PracticeRating>(['missed', 'almost', 'correct'])

export function loadHistory(): PracticeResult[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isPracticeResult)
  } catch {
    return []
  }
}

export function saveHistory(history: PracticeResult[]): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
}

function isPracticeResult(value: unknown): value is PracticeResult {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string' &&
    typeof record.pieceId === 'string' &&
    typeof record.answeredAt === 'string' &&
    typeof record.rating === 'string' &&
    validRatings.has(record.rating as PracticeRating)
  )
}
