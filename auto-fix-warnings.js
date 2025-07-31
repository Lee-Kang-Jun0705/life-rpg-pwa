#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

async function findAllTypeScriptFiles() {
  const files = [];
  const dirs = ['app', 'components', 'lib'];
  
  async function scanDir(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await scanDir(fullPath);
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error scanning ${dir}:`, error.message);
    }
  }
  
  for (const dir of dirs) {
    await scanDir(dir);
  }
  
  return files;
}

// 1. 미사용 변수에 _ prefix 추가
async function fixUnusedVariables() {
  console.log(`\n${colors.blue}=== 미사용 변수에 _ prefix 추가 ===${colors.reset}\n`);
  
  const files = await findAllTypeScriptFiles();
  let totalFixed = 0;
  
  for (const file of files) {
    try {
      let content = await fs.readFile(file, 'utf8');
      let modified = false;
      
      // 함수 파라미터에서 미사용 변수 찾기
      // (parameter: type) 패턴에서 사용되지 않는 파라미터
      const paramRegex = /\(([^)]+)\)\s*(?::|=>)/g;
      let match;
      
      while ((match = paramRegex.exec(content)) !== null) {
        const params = match[1];
        const paramNames = params.split(',').map(p => {
          const trimmed = p.trim();
          const name = trimmed.split(':')[0].trim();
          return name;
        });
        
        for (const paramName of paramNames) {
          if (!paramName || paramName.startsWith('_')) continue;
          
          // 파라미터가 함수 내에서 사용되는지 확인
          const funcBody = content.substring(match.index + match[0].length);
          const funcEndMatch = funcBody.match(/^[^{]*{([^}]*)}/);
          
          if (funcEndMatch) {
            const bodyContent = funcEndMatch[1];
            const usageRegex = new RegExp(`\\b${paramName}\\b`);
            if (!usageRegex.test(bodyContent)) {
              // 미사용 파라미터에 _ prefix 추가
              content = content.replace(
                new RegExp(`\\b${paramName}\\b(?=\\s*:)`, 'g'),
                `_${paramName}`
              );
              modified = true;
              totalFixed++;
            }
          }
        }
      }
      
      if (modified) {
        await fs.writeFile(file, content, 'utf8');
        console.log(`${colors.green}✓${colors.reset} ${path.relative(process.cwd(), file)}`);
      }
    } catch (error) {
      console.error(`${colors.red}✗${colors.reset} Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\n${colors.green}총 ${totalFixed}개의 미사용 변수 수정됨${colors.reset}`);
}

// 2. 미사용 import 제거
async function removeUnusedImports() {
  console.log(`\n${colors.blue}=== 미사용 import 제거 ===${colors.reset}\n`);
  
  // ESLint를 사용하여 자동 수정
  try {
    const { stdout } = await execAsync('npx eslint . --ext .ts,.tsx --fix --rule "@typescript-eslint/no-unused-vars: error"', {
      cwd: process.cwd()
    });
    console.log(`${colors.green}✓ ESLint 자동 수정 완료${colors.reset}`);
  } catch (error) {
    console.log(`${colors.yellow}⚠ ESLint 자동 수정 일부 실패 (정상)${colors.reset}`);
  }
}

// 3. any 타입을 unknown으로 변경
async function replaceAnyWithUnknown() {
  console.log(`\n${colors.blue}=== any 타입을 unknown으로 변경 ===${colors.reset}\n`);
  
  const files = await findAllTypeScriptFiles();
  let totalFixed = 0;
  
  for (const file of files) {
    try {
      let content = await fs.readFile(file, 'utf8');
      const originalContent = content;
      
      // any 타입 패턴들
      content = content.replace(/:\s*any\b/g, ': unknown');
      content = content.replace(/as\s+any\b/g, 'as unknown');
      content = content.replace(/<any>/g, '<unknown>');
      content = content.replace(/\[\]\s*as\s*any/g, '[] as unknown[]');
      content = content.replace(/Array<any>/g, 'Array<unknown>');
      content = content.replace(/Promise<any>/g, 'Promise<unknown>');
      
      if (content !== originalContent) {
        await fs.writeFile(file, content, 'utf8');
        const matches = (content.match(/unknown/g) || []).length - (originalContent.match(/unknown/g) || []).length;
        totalFixed += matches;
        console.log(`${colors.green}✓${colors.reset} ${path.relative(process.cwd(), file)} (${matches}개 변경)`);
      }
    } catch (error) {
      console.error(`${colors.red}✗${colors.reset} Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\n${colors.green}총 ${totalFixed}개의 any 타입 변경됨${colors.reset}`);
}

// 4. require를 import로 변경
async function replaceRequireWithImport() {
  console.log(`\n${colors.blue}=== require를 import로 변경 ===${colors.reset}\n`);
  
  const files = await findAllTypeScriptFiles();
  let totalFixed = 0;
  
  for (const file of files) {
    try {
      let content = await fs.readFile(file, 'utf8');
      let modified = false;
      
      // const x = require('y') 패턴
      content = content.replace(
        /const\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        "import $1 from '$2'"
      );
      
      // const { x, y } = require('z') 패턴
      content = content.replace(
        /const\s*\{([^}]+)\}\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        "import { $1 } from '$2'"
      );
      
      if (content.includes('import')) {
        modified = true;
        totalFixed++;
      }
      
      if (modified) {
        await fs.writeFile(file, content, 'utf8');
        console.log(`${colors.green}✓${colors.reset} ${path.relative(process.cwd(), file)}`);
      }
    } catch (error) {
      console.error(`${colors.red}✗${colors.reset} Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\n${colors.green}총 ${totalFixed}개 파일에서 require 변경됨${colors.reset}`);
}

// 5. 특정 파일의 미사용 변수 수정
async function fixSpecificUnusedVars() {
  console.log(`\n${colors.blue}=== 특정 미사용 변수 수정 ===${colors.reset}\n`);
  
  const fixes = [
    {
      file: 'app/api/energy/state/route.ts',
      old: 'export async function GET(request: Request)',
      new: 'export async function GET(_request: Request)'
    },
    {
      file: 'app/api/stats/route.ts',
      old: 'export async function GET(request: Request)',
      new: 'export async function GET(_request: Request)'
    },
    {
      file: 'app/api/tickets/state/route.ts',
      old: 'export async function GET(request: Request)',
      new: 'export async function GET(_request: Request)'
    },
    {
      file: 'app/api/sync/energy-tickets/route.ts',
      old: 'export async function POST(request: Request)',
      new: 'export async function POST(_request: Request)'
    },
    {
      file: 'app/providers/service-worker-provider.tsx',
      old: 'event: MessageEvent',
      new: '_event: MessageEvent'
    }
  ];
  
  for (const fix of fixes) {
    try {
      const filePath = path.join(process.cwd(), fix.file);
      let content = await fs.readFile(filePath, 'utf8');
      
      if (content.includes(fix.old)) {
        content = content.replace(fix.old, fix.new);
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`${colors.green}✓${colors.reset} ${fix.file}`);
      }
    } catch (error) {
      console.error(`${colors.red}✗${colors.reset} Error fixing ${fix.file}:`, error.message);
    }
  }
}

// 메인 실행 함수
async function main() {
  console.log(`${colors.cyan}🚀 Life RPG PWA - 경고 자동 수정 도구${colors.reset}`);
  console.log(`${colors.yellow}557개 경고를 자동으로 수정합니다...${colors.reset}\n`);
  
  try {
    await fixUnusedVariables();
    await removeUnusedImports();
    await replaceAnyWithUnknown();
    await replaceRequireWithImport();
    await fixSpecificUnusedVars();
    
    console.log(`\n${colors.cyan}✨ 자동 수정 완료!${colors.reset}`);
    console.log(`${colors.yellow}다시 빌드를 실행하여 남은 경고를 확인하세요: npm run build${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}오류 발생:${colors.reset}`, error);
    process.exit(1);
  }
}

// 실행
main();