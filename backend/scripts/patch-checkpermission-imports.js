const fs = require('node:fs')
const path = require('node:path')

const dir = path.join(__dirname, '..', 'routes')
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'))
const patched = []

files.forEach(file => {
  const fp = path.join(dir, file)
  const txt = fs.readFileSync(fp, 'utf8')
  if (txt.includes('checkPermission(') && !txt.includes("require('../middleware/permissions')") && !txt.includes('const { checkPermission')) {
    // find protect require line
    const lines = txt.split('\n')
    let insertAt = 0
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      if (lines[i].includes("require('../middleware/auth')") || lines[i].includes('require("../middleware/auth")')) {
        insertAt = i + 1; break
      }
    }
    const importLine = "const { checkPermission } = require('../middleware/permissions');"

    lines.splice(insertAt, 0, importLine)
    fs.writeFileSync(fp, lines.join('\n'), 'utf8')
    patched.push(file)
  }
})
console.log('Patched files:', patched)
