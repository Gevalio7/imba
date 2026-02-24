const { pool } = require('./config/db');

async function checkTable() {
  try {
    const result = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'customer_users' ORDER BY ordinal_position");
    console.log('Table structure:');
    result.rows.forEach(c => console.log(c.column_name + ': ' + c.data_type));
    await pool.end();
  } catch (e) {
    console.error(e);
    await pool.end();
  }
}

checkTable();
