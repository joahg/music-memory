export interface Piece {
  id: string
  composer: string
  majorWork: string | null
  selection: string
  ensemble: string
  audioFile: string
}

export type PracticeRating = 'missed' | 'almost' | 'correct'

export interface PracticeResult {
  id: string
  pieceId: string
  rating: PracticeRating
  answeredAt: string
}

export interface PieceProgressSummary {
  pieceId: string
  attempts: number
  correct: number
  almost: number
  missed: number
  mastery: number
}

export type AppSection = 'home' | 'learn' | 'drill' | 'competition' | 'library' | 'progress'
