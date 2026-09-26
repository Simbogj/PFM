require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running migrations...');
    const migrationDir = path.join(__dirname, '../../../database/migrations');
    const files = fs.readdirSync(migrationDir).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
      console.log(`  Running: ${file}`);
      await client.query(sql);
      console.log(`  ✅ ${file} done`);
    }

    console.log('✅ All migrations completed');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
