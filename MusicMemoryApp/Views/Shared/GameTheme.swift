import SwiftUI

enum GamePalette {
    static let mint = Color(red: 0.16, green: 0.72, blue: 0.49)
    static let mintDark = Color(red: 0.10, green: 0.52, blue: 0.35)
    static let sky = Color(red: 0.27, green: 0.63, blue: 0.95)
    static let navy = Color(red: 0.09, green: 0.18, blue: 0.38)
    static let sunshine = Color(red: 0.98, green: 0.80, blue: 0.24)
    static let coral = Color(red: 0.96, green: 0.43, blue: 0.34)
    static let lilac = Color(red: 0.57, green: 0.45, blue: 0.95)
    static let cream = Color(red: 0.98, green: 0.97, blue: 0.92)
    static let card = Color.white.opacity(0.92)
    static let ink = Color(red: 0.14, green: 0.17, blue: 0.28)
}

struct GameBackground: View {
    var body: some View {
        LinearGradient(
            colors: [
                GamePalette.cream,
                Color.white,
                Color(red: 0.88, green: 0.96, blue: 1.0)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        .overlay(alignment: .topTrailing) {
            Circle()
                .fill(GamePalette.sunshine.opacity(0.22))
                .frame(width: 300, height: 300)
                .offset(x: 90, y: -110)
        }
        .overlay(alignment: .bottomLeading) {
            Circle()
                .fill(GamePalette.sky.opacity(0.14))
                .frame(width: 380, height: 380)
                .offset(x: -120, y: 140)
        }
        .ignoresSafeArea()
    }
}

struct GameCard<Content: View>: View {
    private let accent: Color
    private let content: Content

    init(accent: Color = GamePalette.mint, @ViewBuilder content: () -> Content) {
        self.accent = accent
        self.content = content()
    }

    var body: some View {
        content
            .padding(24)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 30, style: .continuous)
                    .fill(GamePalette.card)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 30, style: .continuous)
                    .stroke(accent.opacity(0.28), lineWidth: 2)
            )
            .shadow(color: accent.opacity(0.12), radius: 24, y: 14)
    }
}

struct SectionHeadline: View {
    let eyebrow: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(eyebrow.uppercased())
                .font(.system(size: 12, weight: .heavy, design: .rounded))
                .foregroundStyle(GamePalette.mintDark)
                .tracking(1.2)

            Text(title)
                .font(.system(size: 32, weight: .black, design: .rounded))
                .foregroundStyle(GamePalette.ink)

            Text(subtitle)
                .font(.system(size: 18, weight: .semibold, design: .rounded))
                .foregroundStyle(GamePalette.ink.opacity(0.68))
        }
    }
}

struct StatBadge: View {
    let title: String
    let value: String
    let symbol: String
    let tint: Color

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: symbol)
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 44, height: 44)
                .background(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(tint)
                )

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(GamePalette.ink.opacity(0.6))
                Text(value)
                    .font(.system(size: 22, weight: .black, design: .rounded))
                    .foregroundStyle(GamePalette.ink)
            }

            Spacer(minLength: 0)
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(Color.white.opacity(0.9))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(tint.opacity(0.18), lineWidth: 1.5)
        )
    }
}

struct RoundedTag: View {
    let text: String
    var tint: Color = GamePalette.sky

    var body: some View {
        Text(text)
            .font(.system(size: 13, weight: .heavy, design: .rounded))
            .foregroundStyle(tint)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                Capsule(style: .continuous)
                    .fill(tint.opacity(0.12))
            )
    }
}

struct GameProgressBar: View {
    let progress: Double
    var tint: Color = GamePalette.mint

    var body: some View {
        GeometryReader { proxy in
            let clamped = min(max(progress, 0), 1)

            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 999, style: .continuous)
                    .fill(Color.white.opacity(0.7))

                RoundedRectangle(cornerRadius: 999, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [tint, tint.opacity(0.8)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: max(10, proxy.size.width * clamped))
            }
        }
        .frame(height: 14)
    }
}

struct GamePrimaryButtonStyle: ButtonStyle {
    var tint: Color = GamePalette.mint

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 18, weight: .black, design: .rounded))
            .foregroundStyle(.white)
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .fill(configuration.isPressed ? tint.opacity(0.82) : tint)
            )
            .shadow(color: tint.opacity(configuration.isPressed ? 0.12 : 0.28), radius: 12, y: 8)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }
}

struct GameSecondaryButtonStyle: ButtonStyle {
    var tint: Color = GamePalette.navy

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 17, weight: .bold, design: .rounded))
            .foregroundStyle(tint)
            .padding(.horizontal, 18)
            .padding(.vertical, 15)
            .background(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(Color.white.opacity(configuration.isPressed ? 0.72 : 0.88))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .stroke(tint.opacity(0.18), lineWidth: 1.5)
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }
}
