import Foundation

public enum PracticeRating: String, Codable, CaseIterable, Sendable {
    case missed
    case almost
    case correct

    public var plannerWeight: Int {
        switch self {
        case .missed:
            return 10
        case .almost:
            return 6
        case .correct:
            return 1
        }
    }
}
