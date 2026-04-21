import Foundation
import MusicMemoryCore

actor HistoryStore {
    private let url: URL
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    init(url: URL) {
        self.url = url
    }

    func load() throws -> [PracticeResult] {
        guard FileManager.default.fileExists(atPath: url.path) else {
            return []
        }

        let data = try Data(contentsOf: url)
        return try decoder.decode([PracticeResult].self, from: data)
    }

    func save(_ history: [PracticeResult]) throws {
        let directoryURL = url.deletingLastPathComponent()
        try FileManager.default.createDirectory(at: directoryURL, withIntermediateDirectories: true, attributes: nil)
        let data = try encoder.encode(history)
        try data.write(to: url, options: .atomic)
    }

    static func live() -> HistoryStore {
        let baseURL = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? FileManager.default.temporaryDirectory

        return HistoryStore(url: baseURL.appendingPathComponent("MusicMemory/history.json"))
    }
}
