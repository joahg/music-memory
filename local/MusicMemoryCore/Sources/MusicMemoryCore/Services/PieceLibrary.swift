import Foundation

public enum PieceLibraryError: Error {
    case missingBundledLibrary
}

public enum PieceLibrary {
    public static func bundledPieces() throws -> [Piece] {
        guard let url = Bundle.module.url(forResource: "pieces", withExtension: "json") else {
            throw PieceLibraryError.missingBundledLibrary
        }

        return try load(from: url)
    }

    public static func load(from url: URL) throws -> [Piece] {
        let data = try Data(contentsOf: url)
        let decoder = JSONDecoder()
        return try decoder.decode([Piece].self, from: data)
    }
}
