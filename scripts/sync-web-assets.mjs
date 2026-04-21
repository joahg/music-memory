import { mkdir, readFile, rm, writeFile, copyFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const piecesSource = path.join(
  rootDir,
  'local',
  'MusicMemoryCore',
  'Sources',
  'MusicMemoryCore',
  'Resources',
  'pieces.json',
)
const audioSourceDir = path.join(rootDir, 'MusicMemoryApp', 'Resources', 'Audio')
const publicDir = path.join(rootDir, 'public')
const publicLibraryDir = path.join(publicDir, 'library')
const publicAudioDir = path.join(publicDir, 'audio')

async function main() {
  const pieces = JSON.parse(await readFile(piecesSource, 'utf8'))

  if (!Array.isArray(pieces) || pieces.length === 0) {
    throw new Error('pieces.json did not contain any piece entries.')
  }

  const expectedAudioFiles = []
  const seenAudioFiles = new Set()

  for (const piece of pieces) {
    if (typeof piece?.audioFile !== 'string' || piece.audioFile.length === 0) {
      throw new Error(`Invalid audioFile for piece ${piece?.id ?? '(unknown)'}.`)
    }

    if (seenAudioFiles.has(piece.audioFile)) {
      throw new Error(`Duplicate audioFile mapping detected for ${piece.audioFile}.`)
    }

    seenAudioFiles.add(piece.audioFile)
    expectedAudioFiles.push(piece.audioFile)
  }

  const missingFiles = []

  for (const audioFile of expectedAudioFiles) {
    try {
      await access(path.join(audioSourceDir, audioFile))
    } catch {
      missingFiles.push(audioFile)
    }
  }

  if (missingFiles.length > 0) {
    throw new Error(`Missing bundled audio files:\n${missingFiles.map((file) => `- ${file}`).join('\n')}`)
  }

  await rm(publicLibraryDir, { recursive: true, force: true })
  await rm(publicAudioDir, { recursive: true, force: true })

  await mkdir(publicLibraryDir, { recursive: true })
  await mkdir(publicAudioDir, { recursive: true })

  await writeFile(path.join(publicLibraryDir, 'pieces.json'), `${JSON.stringify(pieces, null, 2)}\n`)

  for (const audioFile of expectedAudioFiles) {
    await copyFile(path.join(audioSourceDir, audioFile), path.join(publicAudioDir, audioFile))
  }

  process.stdout.write(`Synced ${pieces.length} pieces and ${expectedAudioFiles.length} audio files for the web app.\n`)
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
