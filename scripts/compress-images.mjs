import sharp from 'sharp'
import { readdir, stat, readFile, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { fileTypeFromBuffer } from 'file-type'

const IMGS_DIR = new URL('../docs/public/imgs', import.meta.url).pathname

const QUALITY = {
  jpeg: 80,
  png: 80,
  webp: 80,
}

const MIN_SIZE = 10 * 1024 // skip files smaller than 10KB
const SKIP_EXTENSIONS = new Set(['.gif', '.svg', '.ico'])

async function getAllFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) return getAllFiles(fullPath)
      if (entry.name === '.DS_Store') return []
      return [fullPath]
    })
  )
  return files.flat()
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
}

async function compressFile(filePath) {
  const ext = extname(filePath).toLowerCase()
  if (SKIP_EXTENSIONS.has(ext)) return null

  const fileInfo = await stat(filePath)
  if (fileInfo.size < MIN_SIZE) return null

  const buffer = await readFile(filePath)
  const type = await fileTypeFromBuffer(buffer)

  if (!type) return null

  let pipeline = sharp(buffer)
  let outputBuffer

  switch (type.mime) {
    case 'image/jpeg':
      outputBuffer = await pipeline.jpeg({ quality: QUALITY.jpeg, mozjpeg: true }).toBuffer()
      break
    case 'image/png':
      outputBuffer = await pipeline
        .png({ quality: QUALITY.png, compressionLevel: 9, palette: true })
        .toBuffer()
      break
    case 'image/webp':
      outputBuffer = await pipeline.webp({ quality: QUALITY.webp }).toBuffer()
      break
    default:
      return null
  }

  const saved = fileInfo.size - outputBuffer.length
  const ratio = ((saved / fileInfo.size) * 100).toFixed(1)

  if (saved <= 0) {
    return { filePath, before: fileInfo.size, after: fileInfo.size, saved: 0, skipped: true }
  }

  await writeFile(filePath, outputBuffer)
  return { filePath, before: fileInfo.size, after: outputBuffer.length, saved, ratio }
}

async function main() {
  console.log(`\n🔍 Scanning: ${IMGS_DIR}\n`)

  const files = await getAllFiles(IMGS_DIR)
  console.log(`Found ${files.length} files\n`)

  let totalBefore = 0
  let totalAfter = 0
  let compressedCount = 0

  for (const file of files) {
    try {
      const result = await compressFile(file)
      if (!result) continue

      const rel = file.replace(IMGS_DIR + '/', '')

      if (result.skipped) {
        console.log(`  ⏭  ${rel} (already optimized)`)
        totalBefore += result.before
        totalAfter += result.after
        continue
      }

      compressedCount++
      totalBefore += result.before
      totalAfter += result.after
      console.log(
        `  ✅ ${rel}: ${formatSize(result.before)} → ${formatSize(result.after)} (-${result.ratio}%)`
      )
    } catch (err) {
      console.error(`  ❌ ${file}: ${err.message}`)
    }
  }

  const totalSaved = totalBefore - totalAfter
  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Compressed: ${compressedCount} files`)
  console.log(`Total: ${formatSize(totalBefore)} → ${formatSize(totalAfter)}`)
  console.log(`Saved: ${formatSize(totalSaved)} (${((totalSaved / totalBefore) * 100).toFixed(1)}%)`)
  console.log()
}

main().catch(console.error)
