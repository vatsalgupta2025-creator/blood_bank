require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/db');

async function test() {
  try {
    const [cols] = await pool.query('DESCRIBE donor');
    console.log('--- Donor columns ---');
    cols.forEach(c => console.log(`  ${c.Field} (${c.Type})`));

    const [donors] = await pool.query('SELECT *, TIMESTAMPDIFF(YEAR, dob, CURDATE()) as age FROM donor WHERE donor_id IN (1, 2, 3)');
    console.log('\n--- Sample Donor Rows ---');
    console.log(JSON.stringify(donors, null, 2));

    const [events] = await pool.query('SELECT de.*, bb.name as bank_name, bu.unit_code, bu.status as unit_status FROM donation_event de LEFT JOIN blood_bank bb ON bb.bank_id = de.bank_id LEFT JOIN blood_unit bu ON bu.unit_id = de.unit_id WHERE de.donor_id = 1');
    console.log('\n--- Donor 1 Donation Events ---');
    console.log(JSON.stringify(events, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}
test();
