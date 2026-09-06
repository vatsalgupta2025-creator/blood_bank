const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function getRowCounts() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'blood_bank_db',
  });

  const tables = [
    'blood_bank',
    'blood_request',
    'blood_test',
    'blood_unit',
    'donation_event',
    'donor',
    'receiver',
    'staff',
    'staff_credentials'
  ];

  const counts = {};
  for (const table of tables) {
    const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
    counts[table] = rows[0].count;
  }
  
  console.log("BASELINE ROW COUNTS:");
  console.log(JSON.stringify(counts, null, 2));
  await connection.end();
}

getRowCounts().catch(console.error);
