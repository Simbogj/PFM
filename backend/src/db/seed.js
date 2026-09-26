require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Running seed data...');
    const seedDir = path.join(__dirname, '../../../database/seeds');
    const files = fs.readdirSync(seedDir).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(seedDir, file), 'utf8');
      console.log(`  Seeding: ${file}`);
      await client.query(sql);
      console.log(`  ✅ ${file} done`);
    }

    console.log('✅ All seeds completed');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
