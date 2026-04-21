import Foundation
import MusicMemoryCore

@MainActor
final class AppModel: ObservableObject {
    @Published private(set) var pieces: [Piece] = []
    @Published private(set) var history: [PracticeResult] = []
    @Published private(set) var playbackState: AudioPlaybackState = .idle
    @Published var loadError: String?

    private let historyStore: HistoryStore
    private let planner = SessionPlanner()
    private let audioPlayer = AudioPlayerController()

    init(historyStore: HistoryStore = .live()) {
        self.historyStore = historyStore
        audioPlayer.onStateChange = { [weak self] state in
            Task { @MainActor in
                self?.playbackState = state
            }
        }

        Task {
            await loadInitialData()
        }
    }

    var attemptCount: Int {
        history.count
    }

    var totalXP: Int {
        history.reduce(0) { $0 + xp(for: $1.rating) }
    }

    var todayXP: Int {
        let calendar = Calendar.current
        return history
            .filter { calendar.isDateInToday($0.answeredAt) }
            .reduce(0) { $0 + xp(for: $1.rating) }
    }

    var streakDays: Int {
        let calendar = Calendar.current
        let practicedDays = Set(history.map { calendar.startOfDay(for: $0.answeredAt) })
        var streak = 0
        var day = calendar.startOfDay(for: Date())

        while practicedDays.contains(day) {
            streak += 1
            guard let previousDay = calendar.date(byAdding: .day, value: -1, to: day) else {
                break
            }

            day = previousDay
        }

        return streak
    }

    var level: Int {
        max(1, (totalXP / 120) + 1)
    }

    var levelProgress: Double {
        Double(totalXP % 120) / 120
    }

    var overallMastery: Double {
        guard !pieces.isEmpty else {
            return 0
        }

        let total = pieces.reduce(0.0) { partialResult, piece in
            partialResult + (progressSummaries[piece.id]?.mastery ?? 0)
        }

        return total / Double(pieces.count)
    }

    var masteredCount: Int {
        pieces.filter { progressSummaries[$0.id]?.mastery ?? 0 >= 0.8 }.count
    }

    var progressSummaries: [String: PieceProgressSummary] {
        ProgressReport.summaries(for: history)
    }

    var composers: [String] {
        Array(Set(pieces.map(\.composer))).sorted()
    }

    var drillQueue: [Piece] {
        planner.drillQueue(from: pieces, history: history)
    }

    var weakestPieces: [Piece] {
        pieces.sorted { lhs, rhs in
            let leftMastery = progressSummaries[lhs.id]?.mastery ?? -1
            let rightMastery = progressSummaries[rhs.id]?.mastery ?? -1

            if leftMastery == rightMastery {
                return lhs.composer < rhs.composer
            }

            return leftMastery < rightMastery
        }
    }

    var spotlightPieces: [Piece] {
        Array(drillQueue.prefix(4))
    }

    func filteredPieces(searchText: String, composer: String?) -> [Piece] {
        let normalizedSearch = searchText.trimmingCharacters(in: .whitespacesAndNewlines)

        return pieces.filter { piece in
            let matchesComposer = composer == nil || piece.composer == composer
            let matchesSearch = normalizedSearch.isEmpty || piece.displayTitle.localizedCaseInsensitiveContains(normalizedSearch) || piece.composer.localizedCaseInsensitiveContains(normalizedSearch) || piece.ensemble.localizedCaseInsensitiveContains(normalizedSearch)
            return matchesComposer && matchesSearch
        }
    }

    func competitionRound(count: Int) -> [Piece] {
        planner.competitionRound(from: pieces, count: count)
    }

    func play(_ piece: Piece) {
        do {
            try audioPlayer.play(fileNamed: piece.audioFile)
        } catch {
            playbackState = .failed(error.localizedDescription)
        }
    }

    func stopPlayback() {
        audioPlayer.stop()
    }

    func record(_ rating: PracticeRating, for piece: Piece) {
        history.append(PracticeResult(pieceID: piece.id, rating: rating))
        persistHistory()
    }

    func recordBatch(_ results: [(Piece, PracticeRating)]) {
        history.append(contentsOf: results.map { PracticeResult(pieceID: $0.0.id, rating: $0.1) })
        persistHistory()
    }

    func resetProgress() {
        history.removeAll()
        persistHistory()
    }

    private func loadInitialData() async {
        do {
            pieces = try PieceLibrary.bundledPieces()
            history = try await historyStore.load()
        } catch {
            loadError = error.localizedDescription
        }
    }

    private func persistHistory() {
        let snapshot = history
        Task {
            do {
                try await historyStore.save(snapshot)
            } catch {
                await MainActor.run {
                    self.loadError = error.localizedDescription
                }
            }
        }
    }

    private func xp(for rating: PracticeRating) -> Int {
        switch rating {
        case .missed:
            return 2
        case .almost:
            return 6
        case .correct:
            return 10
        }
    }
}
