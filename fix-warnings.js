#!/usr/bin/env node

/**
 * ESLint Warning 자동 수정 스크립트
 * 557개 경고를 카테고리별로 정리
 */

const { ESLint } = require('eslint')
const fs = require('fs').promises
const path = require('path')

async function fixWarnings() {
  const eslint = new ESLint({
    fix: true,
    baseConfig: {
      extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      rules: {
        // 미사용 변수는 언더스코어 prefix 자동 추가
        '@typescript-eslint/no-unused-vars': ['error', {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }],
        // any 타입을 unknown으로 변경
        '@typescript-eslint/no-explicit-any': 'error',
        // require를 import로 변경
        '@typescript-eslint/no-require-imports': 'error',
        // React 엔티티 이스케이프
        'react/no-unescaped-entities': 'error'
      }
    }
  })

  console.log('🔧 ESLint 자동 수정 시작...\n')

  const results = await eslint.lintFiles([
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}'
  ])

  // 자동 수정 가능한 파일들 수정
  await ESLint.outputFixes(results)

  // 수정 결과 요약
  let totalFixed = 0
  let remainingWarnings = 0
  let remainingErrors = 0

  for (const result of results) {
    if (result.output) {
      totalFixed++
      console.log(`✅ ${result.filePath} - 자동 수정됨`)
    }
    remainingWarnings += result.warningCount
    remainingErrors += result.errorCount
  }

  console.log(`\n📊 수정 결과:`)
  console.log(`- 자동 수정된 파일: ${totalFixed}개`)
  console.log(`- 남은 경고: ${remainingWarnings}개`)
  console.log(`- 남은 오류: ${remainingErrors}개`)

  return { remainingWarnings, remainingErrors }
}

// 미사용 import 제거
async function removeUnusedImports() {
  console.log('\n🔧 미사용 import 제거 시작...\n')

  const tsFiles = await findTypeScriptFiles()

  for (const file of tsFiles) {
    try {
      const content = await fs.readFile(file, 'utf8')
      const lines = content.split('\n')
      const importRegex = /^import\s+(?:type\s+)?{([^}]+)}\s+from\s+['"]([^'"]+)['"]/

      let modified = false
      const newLines = []

      for (const line of lines) {
        const match = line.match(importRegex)
        if (match) {
          const imports = match[1].split(',').map(i => i.trim())
          const usedImports = imports.filter(imp => {
            const importName = imp.split(' as ')[0].trim()
            const restOfFile = lines.slice(lines.indexOf(line) + 1).join('\n')
            return restOfFile.includes(importName)
          })

          if (usedImports.length === 0) {
            // 전체 import 제거
            modified = true
            continue
          } else if (usedImports.length < imports.length) {
            // 일부 import만 유지
            const newImportLine = line.replace(match[1], usedImports.join(', '))
            newLines.push(newImportLine)
            modified = true
            continue
          }
        }
        newLines.push(line)
      }

      if (modified) {
        await fs.writeFile(file, newLines.join('\n'), 'utf8')
        console.log(`✅ ${path.relative(process.cwd(), file)} - import 정리됨`)
      }
    } catch (error) {
      console.error(`❌ ${file} 처리 실패:`, error.message)
    }
  }
}

// TypeScript 파일 찾기
async function findTypeScriptFiles() {
  const files = []
  const dirs = ['app', 'components', 'lib']

  async function scanDir(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await scanDir(fullPath)
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        files.push(fullPath)
      }
    }
  }

  for (const dir of dirs) {
    await scanDir(dir)
  }

  return files
}

// any 타입을 unknown으로 변경
async function replaceAnyWithUnknown() {
  console.log('\n🔧 any 타입을 unknown으로 변경...\n')

  const files = await findTypeScriptFiles()

  for (const file of files) {
    try {
      let content = await fs.readFile(file, 'utf8')
      const originalContent = content

      // any 타입 패턴들
      content = content.replace(/:\s*any\b/g, ': unknown')
      content = content.replace(/as\s+any\b/g, 'as unknown')
      content = content.replace(/<any>/g, '<unknown>')
      content = content.replace(/\[\]\s*as\s*any/g, '[] as unknown[]')

      if (content !== originalContent) {
        await fs.writeFile(file, content, 'utf8')
        console.log(`✅ ${path.relative(process.cwd(), file)} - any 타입 변경됨`)
      }
    } catch (error) {
      console.error(`❌ ${file} 처리 실패:`, error.message)
    }
  }
}

// 메인 실행
async function main() {
  console.log('🚀 Life RPG PWA Warning 자동 수정 도구\n')

  // 1. ESLint 자동 수정
  const { remainingWarnings, remainingErrors } = await fixWarnings()

  // 2. 추가 수정이 필요한 경우
  if (remainingWarnings > 100) {
    await removeUnusedImports()
    await replaceAnyWithUnknown()
  }

  console.log('\n✅ Warning 수정 프로세스 완료!')
  console.log('📌 남은 경고들은 수동으로 검토가 필요합니다.')
}

main().catch(console.error)
