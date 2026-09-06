require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../config/db');
const bcrypt = require('bcrypt');

async function seed() {
  try {
    console.log('Creating staff_credentials table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_credentials (
        staff_id INT PRIMARY KEY,
        password_hash VARCHAR(255) NOT NULL,
        FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE RESTRICT
      )
    `);
    console.log('Table created.');

    const [staff] = await pool.query('SELECT staff_id FROM staff');
    const passwordHash = await bcrypt.hash('password123', 10);

    console.log(`Seeding passwords for ${staff.length} staff members...`);
    for (const s of staff) {
      await pool.query(
        'INSERT IGNORE INTO staff_credentials (staff_id, password_hash) VALUES (?, ?)',
        [s.staff_id, passwordHash]
      );
    }
    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
