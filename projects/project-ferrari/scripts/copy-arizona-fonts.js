const fs = require('fs')
const path = require('path')

const srcDir = path.resolve(__dirname, '../../2021 Microsite/src/assets/fonts/arizona')
const destDir = path.resolve(__dirname, '../public/fonts/arizona')

if (!fs.existsSync(srcDir)) {
  console.error('Source fonts directory not found:', srcDir)
  process.exit(1)
}

fs.mkdirSync(destDir, { recursive: true })

const files = fs.readdirSync(srcDir)
files.forEach(file => {
  const src = path.join(srcDir, file)
  const dest = path.join(destDir, file)
  fs.copyFileSync(src, dest)
  console.log('Copied', file)
})

console.log('Arizona fonts copied to', destDir)
