// 제공된 아이콘을 사용하여 PWA 아이콘 설정
const fs = require('fs')
const path = require('path')

// Base64로 인코딩된 간단한 Life RPG 아이콘 (픽셀 아트 스타일)
const iconBase64 = `iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAASAAAAEgARslrPgAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAACJSURBVBiVY/z//z8DAwMDw38GBgYGhv8MDAwMDIwMDAyMTAwMDIxMjIyMTMyMjIzMzMyMzCzMzMwsLCwsLKysrKysrKysrGxsbGxs7OzsbBwcHBwcnJycnJxcXFxcXNzc3Nzc3Nzc3Dw8PDw8vLy8vLx8fHx8fPz8/PwCAgICAgKCgoKCgoJCQkJCQgBmJgmZG+YV1QAAAABJRU5ErkJggg==`

// 아이콘 크기 정의
const sizes = [48, 72, 96, 128, 144, 152, 192, 384, 512]

// 아이콘 디렉토리 생성
const iconsDir = path.join(__dirname, '../public/icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// 임시 아이콘 파일 생성 (실제 아이콘이 제공될 때까지)
sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`
  const filepath = path.join(iconsDir, filename)

  // 간단한 PNG 헤더와 데이터 생성
  const buffer = Buffer.from(iconBase64, 'base64')
  fs.writeFileSync(filepath, buffer)
  console.log(`Created: ${filename}`)
});

// Maskable 아이콘도 생성
[192, 512].forEach(size => {
  const filename = `icon-maskable-${size}x${size}.png`
  const filepath = path.join(iconsDir, filename)

  const buffer = Buffer.from(iconBase64, 'base64')
  fs.writeFileSync(filepath, buffer)
  console.log(`Created: ${filename}`)
})

console.log('\nIcon files created successfully!')
console.log('Note: These are placeholder icons. Replace them with your actual icon image.')
