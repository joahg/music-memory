import SwiftUI
import MusicMemoryCore

struct DrillView: View {
    @EnvironmentObject private var model: AppModel
    @State private var queue: [Piece] = []
    @State private var currentIndex = 0
    @State private var isAnswerRevealed = false
    @State private var sessionXP = 0
    @State private var combo = 0
    @State private var bestCombo = 0
    @State private var correctAnswers = 0

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                SectionHeadline(
                    eyebrow: "Drill Sprint",
                    title: "Listen, guess, and stack stars",
                    subtitle: "Short turns, quick reveals, and a combo meter that keeps things exciting."
                )

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                    StatBadge(title: "Progress", value: progressText, symbol: "flag.checkered.2.crossed", tint: GamePalette.sky)
                    StatBadge(title: "Combo", value: comboText, symbol: "flame.fill", tint: GamePalette.sunshine)
                    StatBadge(title: "Session XP", value: "\(sessionXP)", symbol: "bolt.fill", tint: GamePalette.mint)
                    StatBadge(title: "Correct", value: "\(correctAnswers)", symbol: "star.fill", tint: GamePalette.coral)
                }

                GameProgressBar(progress: queueProgress, tint: GamePalette.sunshine)

                if let piece = currentPiece {
                    GameCard(accent: isAnswerRevealed ? GamePalette.mint : GamePalette.sunshine) {
                        VStack(alignment: .leading, spacing: 20) {
                            RoundedTag(text: "Mystery clip \(currentIndex + 1) of \(queue.count)", tint: GamePalette.navy)

                            if isAnswerRevealed {
                                VStack(alignment: .leading, spacing: 10) {
                                    Text(piece.selection)
                                        .font(.system(size: 34, weight: .black, design: .rounded))
                                        .foregroundStyle(GamePalette.ink)
                                    Text(piece.composer)
                                        .font(.system(size: 22, weight: .bold, design: .rounded))
                                        .foregroundStyle(GamePalette.ink.opacity(0.72))
                                    Text(piece.ensemble)
                                        .font(.system(size: 16, weight: .bold, design: .rounded))
                                        .foregroundStyle(GamePalette.ink.opacity(0.58))
                                }
                            } else {
                                VStack(alignment: .leading, spacing: 10) {
                                    Text("Can you name this piece before you peek?")
                                        .font(.system(size: 32, weight: .black, design: .rounded))
                                        .foregroundStyle(GamePalette.ink)

                                    Text("Play the clip, think it through, then tap Reveal when you’re ready.")
                                        .font(.system(size: 18, weight: .semibold, design: .rounded))
                                        .foregroundStyle(GamePalette.ink.opacity(0.68))
                                }
                            }

                            HStack(spacing: 14) {
                                Button("Play Clip") {
                                    model.play(piece)
                                }
                                .buttonStyle(GamePrimaryButtonStyle(tint: GamePalette.mint))

                                Button("Stop") {
                                    model.stopPlayback()
                                }
                                .buttonStyle(GameSecondaryButtonStyle(tint: GamePalette.navy))

                                if !isAnswerRevealed {
                                    Button("Reveal") {
                                        withAnimation(.spring(response: 0.35, dampingFraction: 0.82)) {
                                            isAnswerRevealed = true
                                        }
                                    }
                                    .buttonStyle(GameSecondaryButtonStyle(tint: GamePalette.sunshine))
                                }
                            }

                            if isAnswerRevealed {
                                VStack(alignment: .leading, spacing: 14) {
                                    Text("How did you do?")
                                        .font(.system(size: 20, weight: .black, design: .rounded))
                                        .foregroundStyle(GamePalette.ink)

                                    HStack(spacing: 12) {
                                        scoreButton(title: "Not Yet", subtitle: "+2 XP", rating: .missed, tint: GamePalette.coral, piece: piece)
                                        scoreButton(title: "Close!", subtitle: "+6 XP", rating: .almost, tint: GamePalette.sunshine, piece: piece)
                                        scoreButton(title: "Nailed It", subtitle: "+10 XP", rating: .correct, tint: GamePalette.mint, piece: piece)
                                    }
                                }
                            }
                        }
                    }
                } else {
                    GameCard(accent: GamePalette.mint) {
                        VStack(alignment: .leading, spacing: 16) {
                            SectionHeadline(
                                eyebrow: "Sprint Complete",
                                title: "You finished the round!",
                                subtitle: "Nice job. Start another sprint or head to Boss Round for a bigger challenge."
                            )

                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 14) {
                                StatBadge(title: "Session XP", value: "\(sessionXP)", symbol: "bolt.fill", tint: GamePalette.mint)
                                StatBadge(title: "Best Combo", value: bestCombo == 0 ? "-" : "x\(bestCombo)", symbol: "flame.fill", tint: GamePalette.sunshine)
                            }

                            Button("Start New Sprint") {
                                resetSession()
                            }
                            .buttonStyle(GamePrimaryButtonStyle(tint: GamePalette.mint))
                        }
                    }
                }
            }
            .padding(32)
        }
        .background(GameBackground())
        .navigationTitle("Drill")
        .onAppear {
            if queue.isEmpty {
                resetSession()
            }
        }
        .onChange(of: model.pieces.count) { _, _ in
            if queue.isEmpty {
                resetSession()
            }
        }
    }

    private var currentPiece: Piece? {
        guard queue.indices.contains(currentIndex) else {
            return nil
        }

        return queue[currentIndex]
    }

    private var progressText: String {
        if queue.isEmpty {
            return "Ready"
        }

        return "\(min(currentIndex + 1, queue.count))/\(queue.count)"
    }

    private var comboText: String {
        combo == 0 ? "Warm up" : "x\(combo)"
    }

    private var queueProgress: Double {
        guard !queue.isEmpty else {
            return 0
        }

        return Double(currentIndex) / Double(queue.count)
    }

    private func resetSession() {
        queue = model.drillQueue
        currentIndex = 0
        isAnswerRevealed = false
        sessionXP = 0
        combo = 0
        bestCombo = 0
        correctAnswers = 0
    }

    private func scoreButton(
        title: String,
        subtitle: String,
        rating: PracticeRating,
        tint: Color,
        piece: Piece
    ) -> some View {
        Button {
            awardPoints(for: rating)
            model.record(rating, for: piece)
            withAnimation(.spring(response: 0.35, dampingFraction: 0.82)) {
                isAnswerRevealed = false
                currentIndex += 1
            }
        } label: {
            VStack(spacing: 8) {
                Text(title)
                Text(subtitle)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .textCase(.uppercase)
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(GamePrimaryButtonStyle(tint: tint))
    }

    private func awardPoints(for rating: PracticeRating) {
        sessionXP += xp(for: rating)

        if rating == .correct {
            correctAnswers += 1
            combo += 1
            bestCombo = max(bestCombo, combo)
        } else if rating == .almost {
            combo = max(1, combo)
        } else {
            combo = 0
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
