import type { Piece, PieceProgressSummary, PracticeRating, PracticeResult } from '../types'

const plannerWeights: Record<PracticeRating, number> = {
  missed: 10,
  almost: 6,
  correct: 1,
}

export function displayTitle(piece: Piece): string {
  return piece.majorWork ? `${piece.majorWork}: ${piece.selection}` : piece.selection
}

export function createPracticeResult(pieceId: string, rating: PracticeRating): PracticeResult {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${pieceId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    pieceId,
    rating,
    answeredAt: new Date().toISOString(),
  }
}

export function progressSummaries(history: PracticeResult[]): Record<string, PieceProgressSummary> {
  const grouped = new Map<string, PracticeResult[]>()

  for (const attempt of history) {
    const existing = grouped.get(attempt.pieceId) ?? []
    existing.push(attempt)
    grouped.set(attempt.pieceId, existing)
  }

  const summaries: Record<string, PieceProgressSummary> = {}

  for (const [pieceId, attempts] of grouped.entries()) {
    const correct = attempts.filter((attempt) => attempt.rating === 'correct').length
    const almost = attempts.filter((attempt) => attempt.rating === 'almost').length
    const missed = attempts.filter((attempt) => attempt.rating === 'missed').length

    summaries[pieceId] = {
      pieceId,
      attempts: attempts.length,
      correct,
      almost,
      missed,
      mastery: attempts.length === 0 ? 0 : ((correct * 2) + almost) / (attempts.length * 2),
    }
  }

  return summaries
}

export function drillQueue(pieces: Piece[], history: PracticeResult[]): Piece[] {
  const historyByPiece = new Map<string, PracticeResult[]>()

  for (const attempt of history) {
    const existing = historyByPiece.get(attempt.pieceId) ?? []
    existing.push(attempt)
    historyByPiece.set(attempt.pieceId, existing)
  }

  return [...pieces].sort((left, right) => {
    const leftScore = priorityScore(left.id, historyByPiece)
    const rightScore = priorityScore(right.id, historyByPiece)

    if (leftScore === rightScore) {
      if (left.composer === right.composer) {
        return left.selection.localeCompare(right.selection)
      }

      return left.composer.localeCompare(right.composer)
    }

    return rightScore - leftScore
  })
}

export function competitionRound(pieces: Piece[], count: number): Piece[] {
  const shuffled = [...pieces]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = current
  }

  return shuffled.slice(0, Math.min(count, shuffled.length))
}

export function xpForRating(rating: PracticeRating): number {
  switch (rating) {
    case 'missed':
      return 2
    case 'almost':
      return 6
    case 'correct':
      return 10
  }
}

export function overallMastery(pieces: Piece[], summaries: Record<string, PieceProgressSummary>): number {
  if (pieces.length === 0) {
    return 0
  }

  const total = pieces.reduce((sum, piece) => sum + (summaries[piece.id]?.mastery ?? 0), 0)
  return total / pieces.length
}

export function streakDays(history: PracticeResult[]): number {
  if (history.length === 0) {
    return 0
  }

  const practicedDays = new Set(
    history.map((attempt) => {
      const day = new Date(attempt.answeredAt)
      return new Date(day.getFullYear(), day.getMonth(), day.getDate()).toISOString()
    }),
  )

  let streak = 0
  const day = new Date()
  day.setHours(0, 0, 0, 0)

  while (practicedDays.has(day.toISOString())) {
    streak += 1
    day.setDate(day.getDate() - 1)
  }

  return streak
}

function priorityScore(pieceId: string, historyByPiece: Map<string, PracticeResult[]>): number {
  const attempts = historyByPiece.get(pieceId)
  if (!attempts || attempts.length === 0) {
    return 40
  }

  const recentAttempts = [...attempts]
    .sort((left, right) => Date.parse(right.answeredAt) - Date.parse(left.answeredAt))
    .slice(0, 5)

  let score = 0

  recentAttempts.forEach((attempt, index) => {
    const recencyMultiplier = Math.max(1, 5 - index)
    score += plannerWeights[attempt.rating] * recencyMultiplier
  })

  const recentThree = recentAttempts.slice(0, 3)
  if (recentThree.length === 3 && recentThree.every((attempt) => attempt.rating === 'correct')) {
    score -= 15
  }

  return score
}
