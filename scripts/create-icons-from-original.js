const fs = require('fs')
const path = require('path')

// 아이콘 생성을 위한 설정
const sizes = [48, 72, 96, 128, 144, 152, 192, 384, 512]
const maskableSizes = [192, 512]

console.log('=== Life RPG 아이콘 생성 가이드 ===\n')
console.log('1. 제공하신 아이콘 이미지를 다음 경로에 저장해주세요:')
console.log(`   ${path.join(__dirname, '../public/icons/original-icon.png')}\n`)
console.log('2. 이미지를 저장한 후, 다음 명령어를 실행하세요:')
console.log('   npm install sharp (아직 설치하지 않았다면)')
console.log('   node scripts/generate-icons.js\n')
console.log('3. 또는 온라인 도구를 사용하여 아이콘을 생성할 수 있습니다:')
console.log('   - https://www.favicon-generator.org/')
console.log('   - https://realfavicongenerator.net/\n')

// 임시로 디렉토리 구조 확인
const iconsDir = path.join(__dirname, '../public/icons')
if (fs.existsSync(iconsDir)) {
  const files = fs.readdirSync(iconsDir)
  console.log('현재 icons 폴더의 파일들:')
  files.forEach(file => {
    const stats = fs.statSync(path.join(iconsDir, file))
    console.log(`  - ${file} (${stats.size} bytes)`)
  })
}
