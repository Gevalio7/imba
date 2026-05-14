const { pool } = require('./config/db');
const fs = require('fs');

async function runMigration() {
  try {
    const sql = fs.readFileSync('./migrations/alter-session-management-add-user-id.sql', 'utf8');
    await pool.query(sql);
    console.log('Migration applied successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    pool.end();
  }
}

runMigration();