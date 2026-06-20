/**
 * Gera splash screens (placeholder) para iOS PWA.
 * Uso: node scripts/generate-splash.js
 *
 * Cria imagens de splash sólidas na cor do tema.
 * Para produção, substitua por um design real.
 */

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const SPLASHES = [
  { file: 'apple-splash-1170x2532.png', w: 1170, h: 2532 },
  { file: 'apple-splash-1179x2556.png', w: 1179, h: 2556 },
  { file: 'apple-splash-1290x2796.png', w: 1290, h: 2796 },
  { file: 'apple-splash-1125x2436.png', w: 1125, h: 2436 },
  { file: 'apple-splash-828x1792.png', w: 828, h: 1792 },
  { file: 'apple-splash-1242x2688.png', w: 1242, h: 2688 },
  { file: 'apple-splash-1668x2388.png', w: 1668, h: 2388 },
  { file: 'apple-splash-2048x2732.png', w: 2048, h: 2732 }
]

const OUT_DIR = path.join(__dirname, '..', 'assets', 'splash')

const R = 79, G = 70, B = 229

function createPNG(width, height, r, g, b) {
  const rawData = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      rawData[idx] = r
      rawData[idx + 1] = g
      rawData[idx + 2] = b
      rawData[idx + 3] = 255
    }
  }
  return encodePNG(width, height, rawData)
}

function encodePNG(width, height, rawData) {
  const filtered = Buffer.alloc(width * height * 4 + height)
  for (let y = 0; y < height; y++) {
    filtered[y * (width * 4 + 1)] = 0
    rawData.copy(filtered, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const deflated = zlib.deflateSync(filtered, { level: 9 })
  const chunks = []
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  chunks.push(createChunk('IHDR', ihdr))
  chunks.push(createChunk('IDAT', deflated))
  chunks.push(createChunk('IEND', Buffer.alloc(0)))
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([signature, ...chunks])
}

function createChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeB = Buffer.from(type, 'ascii')
  const crcData = Buffer.concat([typeB, data])
  const crc = crc32(crcData)
  const crcB = Buffer.alloc(4)
  crcB.writeUInt32BE(crc, 0)
  return Buffer.concat([len, typeB, data, crcB])
}

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

SPLASHES.forEach(({ file, w, h }) => {
  const png = createPNG(w, h, R, G, B)
  fs.writeFileSync(path.join(OUT_DIR, file), png)
  console.log(`  ✓ ${file}  (${w}x${h})`)
})

console.log('\nSplash screens geradas em:', OUT_DIR)
