import SwiftUI

struct RootView: View {
    @EnvironmentObject private var model: AppModel
    @State private var selection: AppSection = .home

    var body: some View {
        ZStack(alignment: .bottom) {
            GameBackground()

            TabView(selection: $selection) {
                ForEach(AppSection.allCases) { section in
                    NavigationStack {
                        detailView(for: section)
                    }
                    .tag(section)
                    .tabItem {
                        Label(section.title, systemImage: section.symbolName)
                    }
                }
            }
            .tint(selection.tint)

            if let status = playbackStatus {
                statusBanner(status)
                    .padding(.horizontal, 24)
                    .padding(.bottom, 14)
            }
        }
    }

    @ViewBuilder
    private func detailView(for section: AppSection) -> some View {
        switch section {
        case .home:
            HomeView(selectedSection: $selection)
        case .learn:
            LearnView()
        case .drill:
            DrillView()
        case .competition:
            CompetitionView()
        case .library:
            LibraryView()
        case .progress:
            ProgressDashboardView()
        }
    }

    private var playbackStatus: (text: String, tint: Color, symbol: String)? {
        switch model.playbackState {
        case .idle:
            return nil
        case .playing:
            return ("Clip playing", GamePalette.sky, "waveform")
        case .failed(let message):
            return (message, GamePalette.coral, "exclamationmark.triangle.fill")
        }
    }

    private func statusBanner(_ status: (text: String, tint: Color, symbol: String)) -> some View {
        HStack(spacing: 12) {
            Image(systemName: status.symbol)
                .foregroundStyle(.white)
                .frame(width: 36, height: 36)
                .background(
                    Circle()
                        .fill(status.tint)
                )

            Text(status.text)
                .font(.system(size: 15, weight: .bold, design: .rounded))
                .foregroundStyle(GamePalette.ink)

            Spacer()

            Button("Stop") {
                model.stopPlayback()
            }
            .buttonStyle(GameSecondaryButtonStyle(tint: status.tint))
        }
        .padding(16)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .shadow(color: status.tint.opacity(0.16), radius: 18, y: 12)
    }
}
