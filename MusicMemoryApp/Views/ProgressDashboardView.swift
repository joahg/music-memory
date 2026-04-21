import SwiftUI
import MusicMemoryCore

struct ProgressDashboardView: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                SectionHeadline(
                    eyebrow: "Progress Parade",
                    title: "Watch your music powers grow",
                    subtitle: "XP, streaks, and mastery bars make it easy to see what to practice next."
                )

                GameCard(accent: GamePalette.mint) {
                    VStack(alignment: .leading, spacing: 18) {
                        HStack(alignment: .top) {
                            VStack(alignment: .leading, spacing: 10) {
                                RoundedTag(text: "Level \(model.level)", tint: GamePalette.mint)
                                Text("Overall mastery")
                                    .font(.system(size: 28, weight: .black, design: .rounded))
                                    .foregroundStyle(GamePalette.ink)
                                Text("\(Int(model.overallMastery * 100))% of your song shelf is ready for showtime.")
                                    .font(.system(size: 18, weight: .semibold, design: .rounded))
                                    .foregroundStyle(GamePalette.ink.opacity(0.68))
                            }

                            Spacer()

                            VStack(alignment: .trailing, spacing: 12) {
                                RoundedTag(text: "\(model.streakDays) day streak", tint: GamePalette.sunshine)
                                RoundedTag(text: "\(model.totalXP) XP", tint: GamePalette.lilac)
                            }
                        }

                        GameProgressBar(progress: model.overallMastery, tint: GamePalette.mint)
                    }
                }

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                    StatBadge(title: "Attempts", value: "\(model.attemptCount)", symbol: "music.note", tint: GamePalette.sky)
                    StatBadge(title: "Mastered", value: "\(model.masteredCount)", symbol: "star.fill", tint: GamePalette.coral)
                    StatBadge(title: "Today", value: "\(model.todayXP) XP", symbol: "sun.max.fill", tint: GamePalette.sunshine)
                    StatBadge(title: "Focus Songs", value: "\(model.spotlightPieces.count)", symbol: "target", tint: GamePalette.lilac)
                }

                ForEach(model.weakestPieces) { piece in
                    let summary = model.progressSummaries[piece.id]

                    GameCard(accent: tint(for: summary)) {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                VStack(alignment: .leading, spacing: 6) {
                                    Text(piece.selection)
                                        .font(.system(size: 24, weight: .black, design: .rounded))
                                        .foregroundStyle(GamePalette.ink)
                                    Text(piece.composer)
                                        .font(.system(size: 18, weight: .bold, design: .rounded))
                                        .foregroundStyle(GamePalette.ink.opacity(0.7))
                                }

                                Spacer()

                                RoundedTag(text: masteryText(for: summary), tint: tint(for: summary))
                            }

                            Text(progressText(for: summary))
                                .font(.system(size: 15, weight: .medium, design: .rounded))
                                .foregroundStyle(GamePalette.ink.opacity(0.62))

                            GameProgressBar(progress: summary?.mastery ?? 0, tint: tint(for: summary))
                        }
                    }
                }

                Button("Reset Progress") {
                    model.resetProgress()
                }
                .buttonStyle(GameSecondaryButtonStyle(tint: GamePalette.coral))
            }
            .padding(32)
        }
        .background(GameBackground())
        .navigationTitle("Progress")
    }

    private func progressText(for summary: PieceProgressSummary?) -> String {
        guard let summary else {
            return "No attempts yet. This one is fresh and ready for practice."
        }

        return "\(summary.attempts) attempts · \(summary.correct) correct · \(summary.almost) close · \(summary.missed) missed"
    }

    private func masteryText(for summary: PieceProgressSummary?) -> String {
        let percent = Int((summary?.mastery ?? 0) * 100)
        return "\(percent)%"
    }

    private func tint(for summary: PieceProgressSummary?) -> Color {
        let mastery = summary?.mastery ?? 0

        switch mastery {
        case 0.8...:
            return GamePalette.mint
        case 0.4...:
            return GamePalette.sunshine
        default:
            return GamePalette.sky
        }
    }
}
