import SwiftUI
import MusicMemoryCore

struct LibraryView: View {
    @EnvironmentObject private var model: AppModel
    @State private var searchText = ""
    @State private var selectedComposer: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                SectionHeadline(
                    eyebrow: "Treasure Shelf",
                    title: "Browse every song card",
                    subtitle: "Search by title, composer, or group and watch your collection fill up."
                )

                GameCard(accent: GamePalette.lilac) {
                    VStack(alignment: .leading, spacing: 16) {
                        TextField("Search titles, composers, or ensemble", text: $searchText)
                            .textFieldStyle(.roundedBorder)
                            .font(.system(size: 18, weight: .bold, design: .rounded))

                        Picker("Composer", selection: $selectedComposer) {
                            Text("All composers").tag(String?.none)
                            ForEach(model.composers, id: \.self) { composer in
                                Text(composer).tag(Optional(composer))
                            }
                        }
                        .pickerStyle(.menu)
                    }
                }

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 18) {
                    ForEach(model.filteredPieces(searchText: searchText, composer: selectedComposer)) { piece in
                        GameCard(accent: masteryTint(for: piece.id)) {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack {
                                    RoundedTag(text: masteryLabel(for: piece.id), tint: masteryTint(for: piece.id))
                                    Spacer()
                                    RoundedTag(text: piece.ensemble, tint: GamePalette.sky)
                                }

                                Text(piece.selection)
                                    .font(.system(size: 24, weight: .black, design: .rounded))
                                    .foregroundStyle(GamePalette.ink)
                                    .multilineTextAlignment(.leading)

                                Text(piece.composer)
                                    .font(.system(size: 18, weight: .bold, design: .rounded))
                                    .foregroundStyle(GamePalette.ink.opacity(0.72))

                                if let majorWork = piece.majorWork {
                                    Text(majorWork)
                                        .font(.system(size: 15, weight: .medium, design: .rounded))
                                        .foregroundStyle(GamePalette.ink.opacity(0.58))
                                }
                            }
                        }
                    }
                }
            }
            .padding(32)
        }
        .background(GameBackground())
        .navigationTitle("Library")
    }

    private func masteryLabel(for pieceID: String) -> String {
        let percent = Int((model.progressSummaries[pieceID]?.mastery ?? 0) * 100)
        return percent == 0 ? "New" : "\(percent)%"
    }

    private func masteryTint(for pieceID: String) -> Color {
        let mastery = model.progressSummaries[pieceID]?.mastery ?? 0

        switch mastery {
        case 0.8...:
            return GamePalette.mint
        case 0.4...:
            return GamePalette.sunshine
        default:
            return GamePalette.lilac
        }
    }
}
