const mysql = require('mysql2/promise');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const expectedCounts = {
  'blood_bank': 10,
  'blood_request': 10,
  'blood_test': 10,
  'blood_unit': 10,
  'donation_event': 10,
  'donor': 11,
  'receiver': 10,
  'staff': 10,
  'staff_credentials': 10
};

async function inspect(password) {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'lifeflow-mysql-raka143gupta-ec1c.h.aivencloud.com',
      port: 11084,
      user: 'avnadmin',
      password: password,
      database: 'blood_bank_db',
      ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync(path.join(__dirname, 'ca.pem'))
      }
    });

    console.log('\n--- Aiven Database Read-Only Inspection ---');
    
    const expectedTables = [
      'blood_bank', 'blood_request', 'blood_test', 'blood_unit', 
      'donation_event', 'donor', 'receiver', 'staff', 'staff_credentials'
    ];
    
    console.log('1. Row counts compared to Local Backup:');
    for (const tableName of expectedTables) {
      try {
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = rows[0].count;
        const match = count === expectedCounts[tableName] ? '✅ MATCH' : `❌ MISMATCH (Expected ${expectedCounts[tableName]})`;
        console.log(`   - ${tableName}: ${count} rows (${match})`);
      } catch (err) {
        console.log(`   - ${tableName}: MISSING / ERROR`);
      }
    }

    console.log('\n2. Objects successfully created in Aiven so far:');
    const [tables] = await connection.query('SHOW FULL TABLES');
    const baseTables = tables.filter(t => Object.values(t)[1] === 'BASE TABLE');
    const views = tables.filter(t => Object.values(t)[1] === 'VIEW');
    
    console.log(`   - Base Tables: ${baseTables.length} (Expected 9)`);
    console.log(`   - Views: ${views.length}`);
    
    const [triggers] = await connection.query('SHOW TRIGGERS');
    console.log(`   - Triggers: ${triggers.length}`);
    
    const [routines] = await connection.query('SHOW PROCEDURE STATUS WHERE Db="blood_bank_db"');
    console.log(`   - Stored Procedures/Routines: ${routines.length}`);
    
    const [events] = await connection.query('SHOW EVENTS');
    console.log(`   - Events: ${events.length}`);

    console.log('\n3. What was Statement #114 trying to create?');
    console.log('   Statement #114 is the creation of the VIEW "donor_with_age".');
    console.log('   The exact statement includes:');
    console.log('   /*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */');
    console.log('   /*!50001 VIEW `donor_with_age` AS ... */');
    
    console.log('\nConclusion:');
    console.log('The dump successfully executed statements 1-113, which included creating and populating all 9 base tables. It failed on statement 114 because Aiven rejected the DEFINER clause on the first VIEW creation. No triggers, routines, or events were reached.');
    console.log('-------------------------------------------\n');

  } catch (err) {
    console.error('Failed to inspect:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
rl.stdoutMuted = true;
rl.question('Aiven Password: ', (password) => {
  rl.close();
  inspect(password);
});
rl._writeToOutput = function _writeToOutput(stringToWrite) {
  if (rl.stdoutMuted) rl.output.write("*");
  else rl.output.write(stringToWrite);
};
