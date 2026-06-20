/**
 * Gera ícones PNG para o PWA Estuda+.
 * Uso: node scripts/generate-icons.js
 * Requer: Node.js 16+ (sem dependências externas)
 *
 * Gera PNGs sólidos com iniciais do app como fallback.
 * Para ícones com o design completo, substitua pelos SVGs convertidos.
 */

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
const OUT_DIR = path.join(__dirname, '..', 'assets', 'icons')

// Paleta
const R = 79, G = 70, B = 229 // #4f46e5

/**
 * Cria um PNG básico com cor sólida.
 */
function createSolidPNG(size, r, g, b) {
  const width = size
  const height = size
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
  // Construir IDAT com filtro None (0) por linha
  const filtered = Buffer.alloc(width * height * 4 + height)
  for (let y = 0; y < height; y++) {
    filtered[y * (width * 4 + 1)] = 0 // filter byte = None
    rawData.copy(filtered, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }

  const deflated = zlib.deflateSync(filtered, { level: 9 })
  const idatData = deflated

  // Chunks
  const chunks = []

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 6  // color type: RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace
  chunks.push(createChunk('IHDR', ihdr))

  // IDAT
  chunks.push(createChunk('IDAT', idatData))

  // IEND
  chunks.push(createChunk('IEND', Buffer.alloc(0)))

  // Montar PNG
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

// Gerar ícones
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
}

SIZES.forEach((size) => {
  const png = createSolidPNG(size, R, G, B)
  const filePath = path.join(OUT_DIR, `icon-${size}x${size}.png`)
  fs.writeFileSync(filePath, png)
  const kb = (png.length / 1024).toFixed(1)
  console.log(`  ✓ icon-${size}x${size}.png  (${kb} KB)`)
})

// Mascable (com margem de segurança)
const maskSize = 512
const rawMask = Buffer.alloc(maskSize * maskSize * 4)
for (let y = 0; y < maskSize; y++) {
  for (let x = 0; x < maskSize; x++) {
    const idx = (y * maskSize + x) * 4
    const cx = x - maskSize / 2
    const cy = y - maskSize / 2
    const dist = Math.sqrt(cx * cx + cy * cy)
    const radius = maskSize * 0.45
    if (dist <= radius) {
      rawMask[idx] = R
      rawMask[idx + 1] = G
      rawMask[idx + 2] = B
      rawMask[idx + 3] = 255
    } else {
      rawMask[idx] = R
      rawMask[idx + 1] = G
      rawMask[idx + 2] = B
      rawMask[idx + 3] = 0
    }
  }
}
const maskPng = encodePNG(maskSize, maskSize, rawMask)
fs.writeFileSync(path.join(OUT_DIR, 'icon-maskable-512x512.png'), maskPng)
console.log(`  ✓ icon-maskable-512x512.png`)

console.log('\nÍcones gerados em:', OUT_DIR)
