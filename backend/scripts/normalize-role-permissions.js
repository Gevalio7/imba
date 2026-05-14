const Roles = require('../models/roles')
const { pool } = require('../config/db')

;(async () => {
  try {
    console.log('Starting permission normalization script')
    const available = await Roles.getAvailablePermissions()
    const availableSet = new Set(available.map(p => p.code))

    const dbPermsRes = await pool.query('SELECT id, role_id, permission FROM role_permissions WHERE permission NOT LIKE $1', ['menu_%'])
    const rows = dbPermsRes.rows
    console.log(`Found ${rows.length} non-menu_ permission rows`)

    let updated = 0
    let removed = 0

    for (const r of rows) {
      const old = r.permission
      const roleId = r.role_id
      const newPerm = `menu_${old}`

      if (!availableSet.has(newPerm)) {
        // if menu_ variant not in model list, skip
        continue
      }

      // check if same role has newPerm
      const existsRes = await pool.query('SELECT id FROM role_permissions WHERE role_id = $1 AND permission = $2', [roleId, newPerm])
      if (existsRes.rows.length === 0) {
        // update old row to newPerm
        await pool.query('UPDATE role_permissions SET permission = $1 WHERE id = $2', [newPerm, r.id])
        updated++
      } else {
        // delete old redundant row
        await pool.query('DELETE FROM role_permissions WHERE id = $1', [r.id])
        removed++
      }
    }

    console.log(`Normalization complete. Updated: ${updated}, Removed: ${removed}`)
    process.exit(0)
  } catch (err) {
    console.error('Error in normalization script:', err)
    process.exit(2)
  }
})()
