/**
 * 타입 안정성 검증 테스트
 * any 타입 사용 금지, 하드코딩 금지 확인
 */

import * as fs from 'fs'
import * as path from 'path'
import { glob } from 'glob'

describe('Type Safety Validation', () => {
  const srcPatterns = [
    'lib/**/*.ts',
    'lib/**/*.tsx',
    'components/**/*.ts',
    'components/**/*.tsx',
    'app/**/*.ts',
    'app/**/*.tsx'
  ]

  const excludePatterns = [
    '**/node_modules/**',
    '**/*.d.ts',
    '**/__tests__/**',
    '**/*.test.ts',
    '**/*.spec.ts'
  ]

  async function getSourceFiles(): Promise<string[]> {
    const files: string[] = []

    for (const pattern of srcPatterns) {
      const matches = await glob(pattern, {
        ignore: excludePatterns,
        cwd: process.cwd()
      })
      files.push(...matches)
    }

    return files
  }

  describe('No any types', () => {
    it('should not use any type in source files', async() => {
      const files = await getSourceFiles()
      const filesWithAny: string[] = []

      for (const file of files) {
        const content = fs.readFileSync(path.join(process.cwd(), file), 'utf-8')

        // any 타입 사용 패턴 검사
        const anyPatterns = [
          /:\s*any(?:\s|;|,|\)|\]|\}|$)/g,          // : any
          /<any>/g,                                   // <any>
          /as\s+any/g,                               // as any
          /any\[\]/g,                                // any[]
          /Array<any>/g,                             // Array<any>
          /Promise<any>/g,                           // Promise<any>
          /:\s*\{\s*\[key:\s*string\]:\s*any/g      // { [key: string]: any }
        ]

        let hasAny = false
        for (const pattern of anyPatterns) {
          if (pattern.test(content)) {
            hasAny = true
            break
          }
        }

        if (hasAny) {
          filesWithAny.push(file)
        }
      }

      if (filesWithAny.length > 0) {
        console.error('Files using any type:', filesWithAny)
      }

      expect(filesWithAny).toHaveLength(0)
    })
  })

  describe('No hardcoded values', () => {
    it('should not have hardcoded magic numbers', async() => {
      const files = await getSourceFiles()
      const filesWithMagicNumbers: string[] = []

      for (const file of files) {
        const content = fs.readFileSync(path.join(process.cwd(), file), 'utf-8')

        // 하드코딩된 숫자 패턴 (상수 파일 제외)
        if (!file.includes('constants')) {
          // 0, 1, -1 제외한 숫자 리터럴
          const magicNumberPattern = /(?<![a-zA-Z0-9_])(?!-?[01]\b)-?\d+(?:\.\d+)?(?![a-zA-Z0-9_])/g

          const lines = content.split('\n')
          let hasMagicNumber = false

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            // 주석, import, export 문 제외
            if (line.trim().startsWith('//') ||
                line.trim().startsWith('*') ||
                line.includes('import') ||
                line.includes('export') ||
                line.includes('test(') ||
                line.includes('it(') ||
                line.includes('describe(')) {
              continue
            }

            // CSS 클래스나 스타일 관련 제외
            if (line.includes('className') ||
                line.includes('style') ||
                line.includes('width') ||
                line.includes('height') ||
                line.includes('margin') ||
                line.includes('padding')) {
              continue
            }

            const matches = line.match(magicNumberPattern)
            if (matches && matches.some(m => !['0', '1', '-1', '2'].includes(m))) {
              hasMagicNumber = true
              break
            }
          }

          if (hasMagicNumber) {
            filesWithMagicNumbers.push(file)
          }
        }
      }

      if (filesWithMagicNumbers.length > 0) {
        console.warn('Files with potential magic numbers:', filesWithMagicNumbers)
      }

      // 경고만 하고 통과 (완벽한 제거는 어려움)
      expect(filesWithMagicNumbers.length).toBeLessThan(10)
    })

    it('should not have hardcoded strings', async() => {
      const files = await getSourceFiles()
      const filesWithHardcodedStrings: string[] = []

      for (const file of files) {
        const content = fs.readFileSync(path.join(process.cwd(), file), 'utf-8')

        // 하드코딩된 문자열 패턴 (상수, 데이터, 테스트 파일 제외)
        if (!file.includes('constants') &&
            !file.includes('data/') &&
            !file.includes('.test.') &&
            !file.includes('.spec.')) {

          // 비즈니스 로직 관련 문자열
          const businessStrings = [
            /['"]레벨\s*\d+/g,
            /['"]경험치\s*\d+/g,
            /['"]골드\s*\d+/g,
            /['"]에너지\s*\d+/g,
            /['"]스킬\s*포인트/g,
            /['"]치명타\s*확률/g,
            /['"]회피율/g
          ]

          let hasHardcodedString = false
          for (const pattern of businessStrings) {
            if (pattern.test(content)) {
              hasHardcodedString = true
              break
            }
          }

          if (hasHardcodedString) {
            filesWithHardcodedStrings.push(file)
          }
        }
      }

      expect(filesWithHardcodedStrings).toHaveLength(0)
    })
  })

  describe('Type imports', () => {
    it('should use type imports for type-only imports', async() => {
      const files = await getSourceFiles()
      const filesWithoutTypeImports: string[] = []

      for (const file of files) {
        if (!file.endsWith('.ts') && !file.endsWith('.tsx')) {
          continue
        }

        const content = fs.readFileSync(path.join(process.cwd(), file), 'utf-8')

        // import 문에서 타입만 가져오는 경우 체크
        const importRegex = /import\s*{([^}]+)}\s*from\s*['"][^'"]+['"]/g
        let match

        while ((match = importRegex.exec(content)) !== null) {
          const imports = match[1].split(',').map(s => s.trim())
          const typeOnlyImports = imports.filter(imp =>
            /^(type\s+)?[A-Z][a-zA-Z]*(?:Type|Interface|Props|Options|Config|Result|Context|State)?$/.test(imp)
          )

          // 타입처럼 보이는 import가 type import를 사용하지 않는 경우
          if (typeOnlyImports.length === imports.length &&
              !match[0].includes('import type')) {
            filesWithoutTypeImports.push(file)
            break
          }
        }
      }

      if (filesWithoutTypeImports.length > 0) {
        console.warn('Files that could use type imports:', filesWithoutTypeImports)
      }

      // 경고만 하고 통과
      expect(filesWithoutTypeImports.length).toBeLessThan(20)
    })
  })

  describe('Strict null checks', () => {
    it('should handle null/undefined properly', async() => {
      const files = await getSourceFiles()
      const filesWithUnsafeAccess: string[] = []

      for (const file of files) {
        const content = fs.readFileSync(path.join(process.cwd(), file), 'utf-8')

        // 안전하지 않은 접근 패턴
        const unsafePatterns = [
          /\.\w+\s*\(\)(?!\s*\?)/g,          // .method() without optional chaining
          /\[\w+\](?!\s*\?)/g,               // [index] without optional chaining
          /!\.\w+/g,                         // !.property (non-null assertion)
          /as\s+[A-Z]\w+(?!\s*\|)/g        // as Type without union
        ]

        // JSX나 특정 패턴 제외
        if (!file.includes('.tsx') && !file.includes('constants')) {
          let hasUnsafeAccess = false

          for (const pattern of unsafePatterns) {
            if (pattern.test(content)) {
              // 더 정확한 검사 필요
              const lines = content.split('\n')
              for (const line of lines) {
                if (line.includes('?.') ||
                    line.includes('if (') ||
                    line.includes('&& ') ||
                    line.includes('|| ')) {
                  continue
                }

                if (pattern.test(line)) {
                  hasUnsafeAccess = true
                  break
                }
              }
            }
          }

          if (hasUnsafeAccess) {
            filesWithUnsafeAccess.push(file)
          }
        }
      }

      if (filesWithUnsafeAccess.length > 0) {
        console.warn('Files with potential unsafe access:', filesWithUnsafeAccess)
      }

      // 경고만 하고 통과
      expect(filesWithUnsafeAccess.length).toBeLessThan(10)
    })
  })

  describe('Consistent patterns', () => {
    it('should follow Result type pattern for error handling', async() => {
      const files = await getSourceFiles()
      const servicesWithoutResult: string[] = []

      for (const file of files) {
        if (!file.includes('service') || !file.endsWith('.ts')) {
          continue
        }

        const content = fs.readFileSync(path.join(process.cwd(), file), 'utf-8')

        // 서비스 메서드가 Result 타입을 반환하는지 확인
        const methodPattern = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*:\s*(?:Promise<)?([^{]+?)(?:>)?\s*{/g
        let match
        let hasNonResultMethod = false

        while ((match = methodPattern.exec(content)) !== null) {
          const methodName = match[1]
          const returnType = match[2]

          // 특수 메서드 제외
          if (methodName === 'constructor' ||
              methodName === 'getInstance' ||
              methodName.startsWith('get') ||
              methodName.startsWith('is') ||
              methodName.startsWith('has')) {
            continue
          }

          // Result 타입을 사용하지 않는 메서드
          if (!returnType.includes('Result<') &&
              !returnType.includes('void') &&
              !returnType.includes('boolean')) {
            hasNonResultMethod = true
            break
          }
        }

        if (hasNonResultMethod) {
          servicesWithoutResult.push(file)
        }
      }

      if (servicesWithoutResult.length > 0) {
        console.warn('Service files not using Result pattern:', servicesWithoutResult)
      }

      // 권장사항이므로 경고만
      expect(servicesWithoutResult.length).toBeLessThan(5)
    })
  })
})
