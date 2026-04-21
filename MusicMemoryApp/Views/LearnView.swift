import SwiftUI
import MusicMemoryCore

struct LearnView: View {
    @EnvironmentObject private var model: AppModel
    @State private var selectedPieceID: String?

    var body: some View {
        ScrollView {
            HStack(alignment: .top, spacing: 24) {
                GameCard(accent: GamePalette.sky) {
                    VStack(alignment: .leading, spacing: 16) {
                        SectionHeadline(
                            eyebrow: "Learn Lab",
                            title: "Pick a memory card",
                            subtitle: "See the title, hear the clip, and get comfy with every piece."
                        )

                        ForEach(model.pieces) { piece in
                            Button {
                                selectedPieceID = piece.id
                            } label: {
                                HStack(spacing: 14) {
                                    VStack(alignment: .leading, spacing: 6) {
                                        Text(piece.selection)
                                            .font(.system(size: 19, weight: .black, design: .rounded))
                                            .foregroundStyle(GamePalette.ink)
                                            .multilineTextAlignment(.leading)
                                        Text(piece.composer)
                                            .font(.system(size: 15, weight: .bold, design: .rounded))
                                            .foregroundStyle(GamePalette.ink.opacity(0.66))
                                    }

                                    Spacer()

                                    RoundedTag(text: masteryText(for: piece), tint: masteryTint(for: piece))
                                }
                                .padding(18)
                                .background(
                                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                                        .fill(selectedPieceID == piece.id ? GamePalette.sky.opacity(0.14) : Color.white.opacity(0.82))
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                if let piece = selectedPiece {
                    GameCard(accent: GamePalette.mint) {
                        VStack(alignment: .leading, spacing: 20) {
                            SectionHeadline(
                                eyebrow: "Now Learning",
                                title: piece.selection,
                                subtitle: "Say the title and composer out loud while the music plays."
                            )

                            HStack(spacing: 10) {
                                RoundedTag(text: piece.composer, tint: GamePalette.coral)
                                RoundedTag(text: piece.ensemble, tint: GamePalette.lilac)
                                RoundedTag(text: masteryText(for: piece), tint: masteryTint(for: piece))
                            }

                            if let majorWork = piece.majorWork {
                                detailBlock(label: "Major Work", value: majorWork)
                            }

                            detailBlock(label: "Clip", value: piece.audioFile)

                            HStack(spacing: 14) {
                                Button("Play Clip") {
                                    model.play(piece)
                                }
                                .buttonStyle(GamePrimaryButtonStyle(tint: GamePalette.mint))

                                Button("Stop") {
                                    model.stopPlayback()
                                }
                                .buttonStyle(GameSecondaryButtonStyle(tint: GamePalette.navy))
                            }
                        }
                    }
                } else {
                    GameCard(accent: GamePalette.sunshine) {
                        Text("Choose a song on the left to open its memory card.")
                            .font(.system(size: 24, weight: .black, design: .rounded))
                            .foregroundStyle(GamePalette.ink)
                    }
                }
            }
            .padding(32)
        }
        .background(GameBackground())
        .navigationTitle("Learn")
        .onAppear {
            if selectedPieceID == nil {
                selectedPieceID = model.pieces.first?.id
            }
        }
        .onChange(of: model.pieces.count) { _, _ in
            if selectedPieceID == nil {
                selectedPieceID = model.pieces.first?.id
            }
        }
    }

    private var selectedPiece: Piece? {
        model.pieces.first { $0.id == selectedPieceID } ?? model.pieces.first
    }

    private func detailBlock(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label.uppercased())
                .font(.system(size: 12, weight: .heavy, design: .rounded))
                .foregroundStyle(GamePalette.mintDark)
                .tracking(1)
            Text(value)
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundStyle(GamePalette.ink)
        }
    }

    private func masteryText(for piece: Piece) -> String {
        let percent = Int((model.progressSummaries[piece.id]?.mastery ?? 0) * 100)
        return percent == 0 ? "Fresh" : "\(percent)%"
    }

    private func masteryTint(for piece: Piece) -> Color {
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
}
