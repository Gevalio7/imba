const fs = require('node:fs')
const path = require('node:path')
const { pool } = require('../config/db')

const migrationFile = process.argv[2]

if (!migrationFile) {
  console.error('Usage: node apply-migration.js <migration-file>')
  process.exit(1)
}

const sql = fs.readFileSync(path.join(__dirname, migrationFile), 'utf8')

pool.query(sql)
  .then(() => {
    console.log('✅ Migration applied successfully')
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ Error applying migration:', err)
    process.exit(1)
  })
