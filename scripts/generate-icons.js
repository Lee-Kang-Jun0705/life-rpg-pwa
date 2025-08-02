const sharp = require('sharp')
const fs = require('fs').promises
const path = require('path')

// 아이콘 크기 정의
const sizes = [48, 72, 96, 128, 144, 152, 192, 384, 512]
const maskableSizes = [192, 512]

async function generateIcons() {
  const inputPath = path.join(__dirname, '../public/icons/original-icon.png')
  const outputDir = path.join(__dirname, '../public/icons')

  try {
    // 원본 아이콘이 있는지 확인
    await fs.access(inputPath)

    // 일반 아이콘 생성
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`)
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'cover',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath)
      console.log(`Generated: icon-${size}x${size}.png`)
    }

    // Maskable 아이콘 생성 (여백 추가)
    for (const size of maskableSizes) {
      const outputPath = path.join(outputDir, `icon-maskable-${size}x${size}.png`)
      const padding = Math.floor(size * 0.1) // 10% 여백

      await sharp(inputPath)
        .resize(size - padding * 2, size - padding * 2, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath)
      console.log(`Generated: icon-maskable-${size}x${size}.png`)
    }

    console.log('All icons generated successfully!')
  } catch (error) {
    console.error('Error generating icons:', error)
    console.log('Please make sure to place your icon as "original-icon.png" in the public/icons directory')
  }
}

generateIcons()
