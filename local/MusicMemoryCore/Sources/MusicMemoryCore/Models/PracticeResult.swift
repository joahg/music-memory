import Foundation

public struct PracticeResult: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let pieceID: String
    public let rating: PracticeRating
    public let answeredAt: Date

    public init(
        id: UUID = UUID(),
        pieceID: String,
        rating: PracticeRating,
        answeredAt: Date = Date()
    ) {
        self.id = id
        self.pieceID = pieceID
        self.rating = rating
        self.answeredAt = answeredAt
    }
}
