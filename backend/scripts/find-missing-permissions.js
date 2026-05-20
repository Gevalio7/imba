const fs = require('node:fs')
const path = require('node:path')

function findCheckPermissions(dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'))
  const perms = new Set()
  for (const f of files) {
    const p = path.join(dir, f)
    const txt = fs.readFileSync(p, 'utf8')
    const re = /checkPermission\(['"]([^'")]+)['"]/g
    let m
    while ((m = re.exec(txt))) perms.add(m[1])
  }

  return Array.from(perms).sort()
}

function findModelMenuBases(file) {
  const txt = fs.readFileSync(file, 'utf8')
  const re = /\{\s*base:\s*['"`]([^'"`]+)['"`]/g
  const out = new Set()
  let m
  while ((m = re.exec(txt))) out.add(m[1])

  return Array.from(out).sort()
}

const routesDir = path.join(__dirname, '..', 'routes')
const modelFile = path.join(__dirname, '..', 'models', 'roles.js')

const routePerms = findCheckPermissions(routesDir)
const modelBases = findModelMenuBases(modelFile)

// produce list of missing: for each routePerm ensure either equal to a base or startsWith(base_) or has menu_ variant
const missing = []
for (const rp of routePerms) {
  // normalize: expect menu_ prefix in model; check direct or with/without menu_
  const hasDirect = modelBases.includes(rp)
  const alt = rp.startsWith('menu_') ? rp.replace(/^menu_/, '') : `menu_${rp}`
  const hasAlt = modelBases.includes(alt) || modelBases.includes(rp.replace(/_(read|write|delete)$/, ''))
  if (!hasDirect && !modelBases.includes(rp.replace(/_(read|write|delete)$/, '')) && !hasAlt)
    missing.push(rp)
}

console.log('Found route checkPermission codes:', routePerms.length)
console.log('Model menu bases:', modelBases.length)
console.log('\nMissing permission codes used in routes but not present in model.getMenuItems():')
console.log(missing.join('\n') || '(none)')

process.exit(0)
