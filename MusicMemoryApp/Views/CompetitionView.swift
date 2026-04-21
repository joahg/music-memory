import SwiftUI
import MusicMemoryCore

private struct CompetitionPrompt: Identifiable {
    let id = UUID()
    let piece: Piece
    var composerGuess = ""
    var titleGuess = ""
    var rating: PracticeRating?
}

struct CompetitionView: View {
    @EnvironmentObject private var model: AppModel
    @State private var roundSize = 10
    @State private var prompts: [CompetitionPrompt] = []
    @State private var currentIndex = 0
    @State private var didSaveResults = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                SectionHeadline(
                    eyebrow: "Boss Round",
                    title: prompts.isEmpty ? "Play a full challenge round" : "Keep the answers hidden",
                    subtitle: "This is the big quiz mode: listen carefully, type your guesses, then grade everything at the end."
                )

                if prompts.isEmpty {
                    setupView
                } else if currentIndex < prompts.count {
                    activePromptView
                } else {
                    reviewView
                }
            }
            .padding(32)
        }
        .background(GameBackground())
        .navigationTitle("Competition")
    }

    private var setupView: some View {
        GameCard(accent: GamePalette.coral) {
            VStack(alignment: .leading, spacing: 18) {
                Text("Choose how many mystery clips you want in this challenge.")
                    .font(.system(size: 19, weight: .bold, design: .rounded))
                    .foregroundStyle(GamePalette.ink.opacity(0.72))

                HStack(spacing: 12) {
                    ForEach(roundOptions, id: \.self) { option in
                        Button {
                            roundSize = option
                        } label: {
                            Text("\(option)")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(GamePrimaryButtonStyle(tint: roundSize == option ? GamePalette.coral : GamePalette.lilac))
                    }
                }

                Button("Start Boss Round") {
                    prompts = model.competitionRound(count: roundSize).map { CompetitionPrompt(piece: $0) }
                    currentIndex = 0
                    didSaveResults = false
                }
                .disabled(model.pieces.isEmpty)
                .buttonStyle(GamePrimaryButtonStyle(tint: GamePalette.coral))

                RoundedTag(text: "Answers stay hidden until review time", tint: GamePalette.sunshine)
            }
        }
    }

    private var activePromptView: some View {
        let piece = prompts[currentIndex].piece

        return GameCard(accent: GamePalette.coral) {
            VStack(alignment: .leading, spacing: 18) {
                StatBadge(title: "Prompt", value: "\(currentIndex + 1) of \(prompts.count)", symbol: "crown.fill", tint: GamePalette.coral)

                GameProgressBar(
                    progress: Double(currentIndex) / Double(max(prompts.count, 1)),
                    tint: GamePalette.coral
                )

                Text("Play the clip, type your guess, and trust your ears. No peeking until the review screen.")
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundStyle(GamePalette.ink.opacity(0.72))

                HStack(spacing: 12) {
                    Button("Play Clip") {
                        model.play(piece)
                    }
                    .buttonStyle(GamePrimaryButtonStyle(tint: GamePalette.mint))

                    Button("Stop") {
                        model.stopPlayback()
                    }
                    .buttonStyle(GameSecondaryButtonStyle(tint: GamePalette.navy))
                }

                TextField("Selection or full title", text: composerBinding(title: true))
                    .textFieldStyle(.roundedBorder)
                    .textInputAutocapitalization(.words)
                    .font(.system(size: 19, weight: .bold, design: .rounded))

                TextField("Composer", text: composerBinding(title: false))
                    .textFieldStyle(.roundedBorder)
                    .textInputAutocapitalization(.words)
                    .font(.system(size: 19, weight: .bold, design: .rounded))

                Button(currentIndex == prompts.count - 1 ? "Finish Round" : "Next Prompt") {
                    currentIndex += 1
                }
                .buttonStyle(GamePrimaryButtonStyle(tint: GamePalette.coral))
            }
        }
    }

    private var reviewView: some View {
        VStack(alignment: .leading, spacing: 16) {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 14) {
                StatBadge(title: "Correct", value: "\(reviewCount(for: .correct))", symbol: "star.fill", tint: GamePalette.mint)
                StatBadge(title: "Close", value: "\(reviewCount(for: .almost))", symbol: "sparkles", tint: GamePalette.sunshine)
                StatBadge(title: "Missed", value: "\(reviewCount(for: .missed))", symbol: "arrow.counterclockwise", tint: GamePalette.coral)
            }

            ForEach(prompts.indices, id: \.self) { index in
                GameCard(accent: reviewTint(for: prompts[index].rating)) {
                    VStack(alignment: .leading, spacing: 12) {
                        Text(prompts[index].piece.selection)
                            .font(.system(size: 24, weight: .black, design: .rounded))
                            .foregroundStyle(GamePalette.ink)
                        Text(prompts[index].piece.composer)
                            .font(.system(size: 17, weight: .bold, design: .rounded))
                            .foregroundStyle(GamePalette.ink.opacity(0.68))

                        if !prompts[index].titleGuess.isEmpty {
                            Text("Your title: \(prompts[index].titleGuess)")
                                .font(.system(size: 16, weight: .medium, design: .rounded))
                        }

                        if !prompts[index].composerGuess.isEmpty {
                            Text("Your composer: \(prompts[index].composerGuess)")
                                .font(.system(size: 16, weight: .medium, design: .rounded))
                        }

                        HStack(spacing: 10) {
                            reviewButton("Not Yet", rating: .missed, index: index)
                            reviewButton("Close!", rating: .almost, index: index)
                            reviewButton("Nailed It", rating: .correct, index: index)
                        }
                    }
                }
            }

            Button(didSaveResults ? "Results Saved" : "Save Results") {
                saveResults()
            }
            .disabled(didSaveResults || prompts.contains { $0.rating == nil })
            .buttonStyle(GamePrimaryButtonStyle(tint: GamePalette.mint))

            Button("Start New Round") {
                prompts = []
                currentIndex = 0
                didSaveResults = false
            }
            .buttonStyle(GameSecondaryButtonStyle(tint: GamePalette.coral))
        }
    }

    private var roundOptions: [Int] {
        [5, 10, 15].filter { $0 <= max(5, model.pieces.count) }
    }

    private func composerBinding(title: Bool) -> Binding<String> {
        Binding {
            if title {
                return prompts[currentIndex].titleGuess
            }

            return prompts[currentIndex].composerGuess
        } set: { newValue in
            if title {
                prompts[currentIndex].titleGuess = newValue
            } else {
                prompts[currentIndex].composerGuess = newValue
            }
        }
    }

    private func reviewButton(_ label: String, rating: PracticeRating, index: Int) -> some View {
        Button(label) {
            prompts[index].rating = rating
        }
        .buttonStyle(GamePrimaryButtonStyle(tint: prompts[index].rating == rating ? tint(for: rating) : GamePalette.navy.opacity(0.45)))
    }

    private func tint(for rating: PracticeRating) -> Color {
        switch rating {
        case .missed:
            return GamePalette.coral
        case .almost:
            return GamePalette.sunshine
        case .correct:
            return GamePalette.mint
        }
    }

    private func reviewTint(for rating: PracticeRating?) -> Color {
        guard let rating else {
            return GamePalette.sky
        }

        return tint(for: rating)
    }

    private func reviewCount(for rating: PracticeRating) -> Int {
        prompts.filter { $0.rating == rating }.count
    }

    private func saveResults() {
        let ratedPieces = prompts.compactMap { prompt -> (Piece, PracticeRating)? in
            guard let rating = prompt.rating else {
                return nil
            }

            return (prompt.piece, rating)
        }

        model.recordBatch(ratedPieces)
        didSaveResults = true
    }
}
