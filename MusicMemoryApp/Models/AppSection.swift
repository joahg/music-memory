import Foundation
import SwiftUI

enum AppSection: String, CaseIterable, Identifiable {
    case home
    case learn
    case drill
    case competition
    case library
    case progress

    var id: String { rawValue }

    var title: String {
        switch self {
        case .home:
            return "Home"
        case .learn:
            return "Learn"
        case .drill:
            return "Drill"
        case .competition:
            return "Competition"
        case .library:
            return "Library"
        case .progress:
            return "Progress"
        }
    }

    var symbolName: String {
        switch self {
        case .home:
            return "house.fill"
        case .learn:
            return "sparkles.rectangle.stack.fill"
        case .drill:
            return "bolt.fill"
        case .competition:
            return "crown.fill"
        case .library:
            return "music.note.list"
        case .progress:
            return "chart.bar.fill"
        }
    }

    var tint: Color {
        switch self {
        case .home:
            return GamePalette.mint
        case .learn:
            return GamePalette.sky
        case .drill:
            return GamePalette.sunshine
        case .competition:
            return GamePalette.coral
        case .library:
            return GamePalette.lilac
        case .progress:
            return GamePalette.navy
        }
    }
}
