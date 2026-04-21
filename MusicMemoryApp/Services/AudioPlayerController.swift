import AVFoundation
import Foundation

enum AudioPlaybackState: Equatable {
    case idle
    case playing(String)
    case failed(String)
}

final class AudioPlayerController: NSObject, AVAudioPlayerDelegate {
    var onStateChange: ((AudioPlaybackState) -> Void)?

    private var player: AVAudioPlayer?

    func play(fileNamed fileName: String) throws {
        let url = try resourceURL(for: fileName)
        player = try AVAudioPlayer(contentsOf: url)
        player?.delegate = self
        player?.prepareToPlay()
        player?.play()
        onStateChange?(.playing(fileName))
    }

    func stop() {
        player?.stop()
        player = nil
        onStateChange?(.idle)
    }

    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        onStateChange?(.idle)
    }

    func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        onStateChange?(.failed(error?.localizedDescription ?? "Audio decode failed."))
    }

    private func resourceURL(for fileName: String) throws -> URL {
        let nsName = fileName as NSString
        let baseName = nsName.deletingPathExtension
        let fileExtension = nsName.pathExtension.isEmpty ? nil : nsName.pathExtension

        if let url = Bundle.main.url(forResource: baseName, withExtension: fileExtension, subdirectory: "Audio") {
            return url
        }

        if let url = Bundle.main.url(forResource: baseName, withExtension: fileExtension) {
            return url
        }

        throw NSError(
            domain: "MusicMemory.Audio",
            code: 404,
            userInfo: [NSLocalizedDescriptionKey: "Missing audio clip \(fileName). Add it under MusicMemoryApp/Resources/Audio."]
        )
    }
}
