import SwiftUI
import MusicMemoryCore

struct HomeView: View {
    @EnvironmentObject private var model: AppModel
    @Binding var selectedSection: AppSection

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 28) {
                GameCard(accent: GamePalette.mint) {
                    VStack(alignment: .leading, spacing: 18) {
                        HStack(alignment: .top) {
                            VStack(alignment: .leading, spacing: 12) {
                                SectionHeadline(
                                    eyebrow: "Practice Path",
                                    title: heroTitle,
                                    subtitle: heroSubtitle
                                )

                                if let loadError = model.loadError {
                                    Text(loadError)
                                        .font(.system(size: 15, weight: .bold, design: .rounded))
                                        .foregroundStyle(GamePalette.coral)
                                }
                            }

                            Spacer()

                            VStack(alignment: .trailing, spacing: 10) {
                                RoundedTag(text: "Level \(model.level)", tint: GamePalette.mintDark)
                                RoundedTag(text: "\(model.todayXP) XP today", tint: GamePalette.sunshine)
                            }
                        }

                        GameProgressBar(progress: model.levelProgress, tint: GamePalette.mint)

                        HStack(spacing: 14) {
                            Button("Start Drill") {
                                selectedSection = .drill
                            }
                            .buttonStyle(GamePrimaryButtonStyle(tint: GamePalette.mint))

                            Button("Boss Round") {
                                selectedSection = .competition
                            }
                            .buttonStyle(GameSecondaryButtonStyle(tint: GamePalette.coral))
                        }
                    }
                }

                LazyVGrid(columns: gridColumns, spacing: 16) {
                    StatBadge(title: "Collection", value: "\(model.pieces.count) songs", symbol: "music.note.house.fill", tint: GamePalette.sky)
                    StatBadge(title: "Streak", value: streakText, symbol: "flame.fill", tint: GamePalette.sunshine)
                    StatBadge(title: "Mastered", value: "\(model.masteredCount)", symbol: "star.fill", tint: GamePalette.coral)
                    StatBadge(title: "Total XP", value: "\(model.totalXP)", symbol: "bolt.fill", tint: GamePalette.lilac)
                }

                SectionHeadline(
                    eyebrow: "Pick A Mode",
                    title: "Choose today’s adventure",
                    subtitle: "Warm up, speed run, or browse every piece like a treasure shelf."
                )

                LazyVGrid(columns: gridColumns, spacing: 18) {
                    modeCard(
                        title: "Learn Lab",
                        subtitle: "See the answer first, then play the clip.",
                        symbol: "sparkles.rectangle.stack.fill",
                        tint: GamePalette.sky,
                        section: .learn
                    )
                    modeCard(
                        title: "Drill Sprint",
                        subtitle: "Guess, reveal, and build your streak.",
                        symbol: "bolt.fill",
                        tint: GamePalette.sunshine,
                        section: .drill
                    )
                    modeCard(
                        title: "Boss Round",
                        subtitle: "Play a full quiz with hidden answers.",
                        symbol: "crown.fill",
                        tint: GamePalette.coral,
                        section: .competition
                    )
                    modeCard(
                        title: "Treasure Shelf",
                        subtitle: "Browse every piece and spot your favorites.",
                        symbol: "music.note.list",
                        tint: GamePalette.lilac,
                        section: .library
                    )
                }

                SectionHeadline(
                    eyebrow: "Focus Next",
                    title: "Songs ready for a level up",
                    subtitle: "These are the best choices for your next few points."
                )

                ForEach(model.spotlightPieces) { piece in
                    GameCard(accent: GamePalette.sky) {
                        HStack(spacing: 18) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text(piece.selection)
                                    .font(.system(size: 25, weight: .black, design: .rounded))
                                    .foregroundStyle(GamePalette.ink)
                                Text(piece.composer)
                                    .font(.system(size: 18, weight: .bold, design: .rounded))
                                    .foregroundStyle(GamePalette.ink.opacity(0.72))
                                Text(piece.ensemble)
                                    .font(.system(size: 15, weight: .medium, design: .rounded))
                                    .foregroundStyle(GamePalette.ink.opacity(0.58))
                            }

                            Spacer()

                            RoundedTag(
                                text: masteryText(for: piece),
                                tint: progressTint(for: piece)
                            )
                        }
                    }
                }
            }
            .padding(32)
        }
        .background(GameBackground())
        .navigationTitle("Home")
    }

    private var gridColumns: [GridItem] {
        [GridItem(.flexible()), GridItem(.flexible())]
    }

    private var heroTitle: String {
        if model.attemptCount == 0 {
            return "Ready to start your music streak?"
        }

        if model.streakDays >= 3 {
            return "Your streak is on fire!"
        }

        return "Time for another quick win"
    }

    private var heroSubtitle: String {
        if model.attemptCount == 0 {
            return "Tap Drill Sprint for a playful practice round and start earning XP right away."
        }

        return "Keep the rhythm going with short rounds, bright goals, and lots of stars."
    }

    private var streakText: String {
        model.streakDays == 1 ? "1 day" : "\(model.streakDays) days"
    }

    private func masteryText(for piece: Piece) -> String {
        let summary = model.progressSummaries[piece.id]
        let percent = Int((summary?.mastery ?? 0) * 100)
        return percent == 0 ? "New song" : "\(percent)% ready"
    }

    private func progressTint(for piece: Piece) -> Color {
        let mastery = model.progressSummaries[piece.id]?.mastery ?? 0

        switch mastery {
        case 0.8...:
            return GamePalette.mint
        case 0.4...:
            return GamePalette.sunshine
        default:
            return GamePalette.sky
        }
    }

    private func modeCard(
        title: String,
        subtitle: String,
        symbol: String,
        tint: Color,
        section: AppSection
    ) -> some View {
        Button {
            selectedSection = section
        } label: {
            GameCard(accent: tint) {
                VStack(alignment: .leading, spacing: 14) {
                    Image(systemName: symbol)
                        .font(.system(size: 28, weight: .black))
                        .foregroundStyle(tint)

                    Text(title)
                        .font(.system(size: 24, weight: .black, design: .rounded))
                        .foregroundStyle(GamePalette.ink)

                    Text(subtitle)
                        .font(.system(size: 16, weight: .medium, design: .rounded))
                        .foregroundStyle(GamePalette.ink.opacity(0.68))
                }
            }
        }
        .buttonStyle(.plain)
    }
}
