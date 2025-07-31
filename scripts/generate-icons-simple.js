const fs = require('fs');
const path = require('path');

// 원본 아이콘 파일 읽기
const originalPath = path.join(__dirname, '../public/icons/original-icon.png');
const iconsDir = path.join(__dirname, '../public/icons');

// 아이콘 크기 정의
const sizes = [48, 72, 96, 128, 144, 152, 192, 384, 512];
const maskableSizes = [192, 512];

try {
  // 원본 파일이 있는지 확인
  if (!fs.existsSync(originalPath)) {
    console.error('Error: original-icon.png not found in public/icons/');
    process.exit(1);
  }

  // 원본 파일 읽기
  const originalBuffer = fs.readFileSync(originalPath);
  console.log('Original icon found! Size:', originalBuffer.length, 'bytes');

  // 모든 크기에 대해 같은 이미지 복사 (실제 리사이징 없이)
  // 실제 프로덕션에서는 sharp 같은 라이브러리를 사용해야 하지만
  // 지금은 임시로 같은 이미지를 사용
  sizes.forEach(size => {
    const filename = `icon-${size}x${size}.png`;
    const filepath = path.join(iconsDir, filename);
    fs.writeFileSync(filepath, originalBuffer);
    console.log(`Created: ${filename}`);
  });

  // Maskable 아이콘도 생성
  maskableSizes.forEach(size => {
    const filename = `icon-maskable-${size}x${size}.png`;
    const filepath = path.join(iconsDir, filename);
    fs.writeFileSync(filepath, originalBuffer);
    console.log(`Created: ${filename}`);
  });

  console.log('\nAll icons created successfully!');
  console.log('Note: For production, you should use an image resizing library like sharp to create properly sized icons.');
  
} catch (error) {
  console.error('Error:', error.message);
}