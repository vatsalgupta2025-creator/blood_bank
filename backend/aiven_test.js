const mysql = require('mysql2/promise');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

async function testConnection(password) {
  try {
    const connection = await mysql.createConnection({
      host: 'lifeflow-mysql-raka143gupta-ec1c.h.aivencloud.com',
      port: 11084,
      user: 'avnadmin',
      password: password,
      ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync(path.join(__dirname, 'ca.pem'))
      }
    });
    
    // Test SELECT 1
    await connection.query('SELECT 1');
    const connSuccess = true;

    // Create Database
    await connection.query('CREATE DATABASE IF NOT EXISTS blood_bank_db');
    const dbSuccess = true;

    await connection.end();

    console.log('\n--- Aiven Test Report ---');
    console.log(`Aiven connection succeeded: ${connSuccess ? 'Yes' : 'No'}`);
    console.log(`blood_bank_db created successfully: ${dbSuccess ? 'Yes' : 'No'}`);
    console.log('-------------------------\n');

  } catch (err) {
    console.log('\n--- Aiven Test Report ---');
    console.log('Aiven connection succeeded: No');
    console.error(`Error details: ${err.message}`);
    console.log('-------------------------\n');
  }
}

// Support reading securely from env var or interactive prompt
if (process.env.AIVEN_PASSWORD) {
  testConnection(process.env.AIVEN_PASSWORD);
} else {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Custom logic to hide password typing (replaces characters with *)
  rl.stdoutMuted = true;
  
  rl.question('Aiven Password: ', (password) => {
    rl.close();
    console.log('\nTesting connection...');
    testConnection(password);
  });

  rl._writeToOutput = function _writeToOutput(stringToWrite) {
    if (rl.stdoutMuted)
      rl.output.write("*");
    else
      rl.output.write(stringToWrite);
  };
}
