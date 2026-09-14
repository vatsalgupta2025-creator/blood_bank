const mysql = require('mysql2/promise');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

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
        ca: fs.readFileSync(path.join(__dirname, '..', 'backend', 'ca.pem'))
      }
    });

    console.log('\n--- Aiven Database Inspection ---');
    const [tables] = await connection.query('SHOW FULL TABLES');
    
    if (tables.length === 0) {
      console.log('Database is currently empty.');
    } else {
      tables.forEach(row => {
        const vals = Object.values(row);
        console.log(`- ${vals[0]} (${vals[1]})`);
      });
    }
    console.log('---------------------------------\n');

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
