import Foundation

public struct Piece: Codable, Identifiable, Hashable, Sendable {
    public let id: String
    public let composer: String
    public let majorWork: String?
    public let selection: String
    public let ensemble: String
    public let audioFile: String

    public init(
        id: String,
        composer: String,
        majorWork: String?,
        selection: String,
        ensemble: String,
        audioFile: String
    ) {
        self.id = id
        self.composer = composer
        self.majorWork = majorWork
        self.selection = selection
        self.ensemble = ensemble
        self.audioFile = audioFile
    }

    public var displayTitle: String {
        guard let majorWork, !majorWork.isEmpty else {
            return selection
        }

        return "\(majorWork): \(selection)"
    }
}
