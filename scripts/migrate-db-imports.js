const fs = require('fs')
const path = require('path')
const glob = require('glob')

// Files to update
const patterns = [
  'components/**/*.{ts,tsx}',
  'app/**/*.{ts,tsx}',
  'hooks/**/*.{ts,tsx}',
  'contexts/**/*.{ts,tsx}',
  'lib/**/*.{ts,tsx}'
]

// Replacement patterns
const replacements = [
  {
    from: "from '@/lib/database'",
    to: "from '@/lib/database/client'",
    description: "Update database imports to client-only pattern"
  },
  {
    from: 'import { db, dbHelpers } from',
    to: 'import { dbHelpers } from',
    description: "Remove direct db import"
  }
]

// Files to skip
const skipFiles = [
  'lib/database/index.ts',
  'lib/database/client.ts',
  'lib/database/client-only.ts',
  'lib/database/client-helpers.ts',
  'lib/database/types.ts'
]

let updatedFiles = []

// Process each pattern
patterns.forEach(pattern => {
  const files = glob.sync(pattern, { cwd: process.cwd() })
  
  files.forEach(file => {
    // Skip certain files
    if (skipFiles.some(skip => file.includes(skip))) {
      return
    }
    
    const filePath = path.join(process.cwd(), file)
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    
    replacements.forEach(replacement => {
      if (content.includes(replacement.from)) {
        content = content.replace(new RegExp(replacement.from, 'g'), replacement.to)
        modified = true
      }
    })
    
    if (modified) {
      fs.writeFileSync(filePath, content)
      updatedFiles.push(file)
      console.log(`✅ Updated: ${file}`)
    }
  })
})

console.log(`\n📊 Summary: Updated ${updatedFiles.length} files`)
if (updatedFiles.length > 0) {
  console.log('\n📝 Updated files:')
  updatedFiles.forEach(file => console.log(`  - ${file}`))
}