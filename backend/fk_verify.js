const mysql = require('mysql2/promise');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

async function runCheck(password) {
  let connection;
  try {
    console.log('\nConnecting to Aiven MySQL for read-only FK integrity check...');
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

    console.log('✅ Connected successfully.');
    console.log('\n--- Data Integrity Verification ---');
    
    // Testing blood_unit to blood_bank relationship
    const [fkCheck1] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM blood_unit u 
      LEFT JOIN blood_bank b ON u.bank_id = b.bank_id 
      WHERE u.bank_id IS NOT NULL AND b.bank_id IS NULL
    `);
    
    if (fkCheck1[0].count === 0) {
      console.log('✅ FK Check 1 (blood_unit -> blood_bank): PASSED (0 orphaned units)');
    } else {
      console.log(`❌ FK Check 1 FAILED: Found ${fkCheck1[0].count} orphaned blood units.`);
    }

    // Testing staff to blood_bank relationship
    const [fkCheck2] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM staff s
      LEFT JOIN blood_bank b ON s.bank_id = b.bank_id 
      WHERE s.bank_id IS NOT NULL AND b.bank_id IS NULL
    `);
    
    if (fkCheck2[0].count === 0) {
      console.log('✅ FK Check 2 (staff -> blood_bank): PASSED (0 orphaned staff records)');
    } else {
      console.log(`❌ FK Check 2 FAILED: Found ${fkCheck2[0].count} orphaned staff records.`);
    }

    console.log('-----------------------------------\n');

  } catch (err) {
    console.error('\n❌ Check failed with error:', err.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Support reading securely from env var or interactive prompt
if (process.env.AIVEN_PASSWORD) {
  runCheck(process.env.AIVEN_PASSWORD);
} else {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.stdoutMuted = true;
  rl.question('Aiven Password: ', (password) => {
    rl.close();
    runCheck(password);
  });
  rl._writeToOutput = function _writeToOutput(stringToWrite) {
    if (rl.stdoutMuted) rl.output.write("*");
    else rl.output.write(stringToWrite);
  };
}
