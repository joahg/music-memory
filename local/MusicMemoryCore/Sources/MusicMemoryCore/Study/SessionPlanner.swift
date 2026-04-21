import Foundation

public struct SessionPlanner: Sendable {
    public init() {}

    public func drillQueue(
        from pieces: [Piece],
        history: [PracticeResult],
        limit: Int? = nil
    ) -> [Piece] {
        let historyByPiece = Dictionary(grouping: history, by: \.pieceID)
        let ordered = pieces.sorted { lhs, rhs in
            let leftScore = priorityScore(for: lhs.id, historyByPiece: historyByPiece)
            let rightScore = priorityScore(for: rhs.id, historyByPiece: historyByPiece)

            if leftScore == rightScore {
                if lhs.composer == rhs.composer {
                    return lhs.selection < rhs.selection
                }

                return lhs.composer < rhs.composer
            }

            return leftScore > rightScore
        }

        guard let limit else {
            return ordered
        }

        return Array(ordered.prefix(limit))
    }

    public func competitionRound(from pieces: [Piece], count: Int) -> [Piece] {
        Array(pieces.shuffled().prefix(min(count, pieces.count)))
    }

    private func priorityScore(
        for pieceID: String,
        historyByPiece: [String: [PracticeResult]]
    ) -> Int {
        guard let attempts = historyByPiece[pieceID], !attempts.isEmpty else {
            return 40
        }

        let recentAttempts = attempts
            .sorted { $0.answeredAt > $1.answeredAt }
            .prefix(5)

        var score = 0

        for (index, attempt) in recentAttempts.enumerated() {
            let recencyMultiplier = max(1, 5 - index)
            score += attempt.rating.plannerWeight * recencyMultiplier
        }

        let mostRecentThree = Array(recentAttempts.prefix(3))
        if mostRecentThree.count == 3, mostRecentThree.allSatisfy({ $0.rating == .correct }) {
            score -= 15
        }

        return score
    }
}
