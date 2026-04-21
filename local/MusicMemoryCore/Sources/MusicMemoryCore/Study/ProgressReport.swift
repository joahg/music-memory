import Foundation

public struct PieceProgressSummary: Equatable, Sendable {
    public let pieceID: String
    public let attempts: Int
    public let correct: Int
    public let almost: Int
    public let missed: Int
    public let mastery: Double
}

public enum ProgressReport {
    public static func summaries(for history: [PracticeResult]) -> [String: PieceProgressSummary] {
        Dictionary(grouping: history, by: \.pieceID)
            .mapValues { attempts in
                let correct = attempts.filter { $0.rating == .correct }.count
                let almost = attempts.filter { $0.rating == .almost }.count
                let missed = attempts.filter { $0.rating == .missed }.count
                let mastery = attempts.isEmpty ? 0 : Double((correct * 2) + almost) / Double(attempts.count * 2)

                return PieceProgressSummary(
                    pieceID: attempts[0].pieceID,
                    attempts: attempts.count,
                    correct: correct,
                    almost: almost,
                    missed: missed,
                    mastery: mastery
                )
            }
    }
}
