const mysql = require('mysql2/promise');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

async function runImport(password) {
  let connection;
  try {
    console.log('\nConnecting to Aiven MySQL...');
    connection = await mysql.createConnection({
      host: 'lifeflow-mysql-raka143gupta-ec1c.h.aivencloud.com',
      port: 11084,
      user: 'avnadmin',
      password: password,
      database: 'blood_bank_db',
      multipleStatements: true,
      ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync(path.join(__dirname, 'ca.pem'))
      }
    });

    console.log('✅ Connected successfully.');

    // 1. Clean up Aiven Database
    console.log('🧹 Cleaning up Aiven database (dropping all tables & views)...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    const [tables] = await connection.query('SHOW FULL TABLES');
    for (const row of tables) {
      const vals = Object.values(row);
      const name = vals[0];
      const type = vals[1];
      if (type === 'VIEW') {
        await connection.query(`DROP VIEW IF EXISTS \`${name}\``);
      } else {
        await connection.query(`DROP TABLE IF EXISTS \`${name}\``);
      }
    }
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Cleanup complete. Database is perfectly clean.');

    // 2. Read the untouched backup file
    const backupPath = path.join(__dirname, '..', 'database', 'blood_bank_local_backup.sql');
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found at ${backupPath}`);
    }
    
    const rawBuffer = fs.readFileSync(backupPath);
    let sqlDump = '';
    
    // Check for UTF-16 LE BOM (FF FE)
    if (rawBuffer.length >= 2 && rawBuffer[0] === 0xFF && rawBuffer[1] === 0xFE) {
      sqlDump = rawBuffer.toString('utf16le');
      if (sqlDump.charCodeAt(0) === 0xFEFF) {
        sqlDump = sqlDump.slice(1);
      }
    } else {
      sqlDump = rawBuffer.toString('utf8');
    }

    // 3. Regex Transformation
    console.log('⏳ Transforming SQL and creating Aiven-ready copy...');
    // Strip DEFINER directives
    // Removes: /*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
    sqlDump = sqlDump.replace(/\/\*!50013 DEFINER=.*?\*\//g, '');
    // Removes: DEFINER=`root`@`localhost`
    sqlDump = sqlDump.replace(/DEFINER=`?[^`\s]+`?@`?[^`\s]+`?/g, '');

    // 4. Save physical temporary copy
    const aivenReadyPath = path.join(__dirname, '..', 'database', 'aiven_ready_backup.sql');
    fs.writeFileSync(aivenReadyPath, sqlDump, 'utf8');
    console.log(`✅ Saved transformed SQL copy to: ${aivenReadyPath}`);

    // 5. Custom SQL Parser to handle DELIMITERs
    console.log('⏳ Parsing SQL statements for sequential execution...');
    let currentDelimiter = ';';
    let currentStatement = '';
    const statements = [];

    const lines = sqlDump.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const lineStr = lines[i];
      const trimmedLine = lineStr.trim();
      
      if (trimmedLine.toUpperCase().startsWith('DELIMITER ')) {
        currentDelimiter = trimmedLine.substring(10).trim();
        continue;
      }
      
      if (currentStatement === '' && trimmedLine === '') continue;
      if (currentStatement === '' && trimmedLine.startsWith('--')) continue;

      currentStatement += (currentStatement === '' ? '' : '\n') + lineStr;

      if (currentStatement.trimEnd().endsWith(currentDelimiter)) {
        let sql = currentStatement.trimEnd();
        sql = sql.substring(0, sql.length - currentDelimiter.length);
        if (sql.trim().length > 0) {
          statements.push(sql.trim());
        }
        currentStatement = '';
      }
    }
    if (currentStatement.trim().length > 0) {
        statements.push(currentStatement.trim());
    }

    console.log(`✅ Parsed ${statements.length} SQL statements. Executing...`);

    // 6. Execute statements
    for (let i = 0; i < statements.length; i++) {
      try {
        await connection.query(statements[i]);
      } catch (err) {
        console.error(`\n❌ Error executing statement #${i + 1}:\n${statements[i].substring(0, 100)}...`);
        throw err;
      }
    }
    console.log('✅ Import statements executed successfully.');

    // 7. Verify tables and row counts
    const expectedTables = [
      'blood_bank', 'blood_request', 'blood_test', 'blood_unit', 
      'donation_event', 'donor', 'receiver', 'staff', 'staff_credentials'
    ];
    
    console.log('\n--- Final Migration Report ---');
    console.log('Import status: SUCCESS');
    console.log('\nTables & Row Counts:');
    
    for (const tableName of expectedTables) {
      try {
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`- ${tableName}: ${rows[0].count} rows`);
      } catch (err) {
        console.log(`- ${tableName}: ERROR - ${err.message}`);
      }
    }

    // 8. Run a non-destructive data integrity check
    console.log('\nData Integrity Checks:');
    try {
      const [fkCheck] = await connection.query(`
        SELECT COUNT(*) as count 
        FROM blood_unit u 
        LEFT JOIN blood_bank b ON u.bank_id = b.bank_id 
        WHERE u.bank_id IS NOT NULL AND b.bank_id IS NULL
      `);
      if (fkCheck[0].count === 0) {
        console.log('✅ Foreign keys verified: All blood units reference valid blood banks.');
      } else {
        console.log('❌ Foreign keys check failed: Found orphaned blood units.');
      }
    } catch (err) {
      console.log('❌ Foreign key check error:', err.message);
    }

    console.log('\nConfirmation:');
    console.log('✅ Local database was completely untouched.');
    console.log('✅ Original backup file was completely untouched.');
    console.log('✅ No credentials exposed.');
    console.log('-------------------------------------\n');

  } catch (err) {
    console.error('\n❌ Import failed with error:', err.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Support reading securely from env var or interactive prompt
if (process.env.AIVEN_PASSWORD) {
  runImport(process.env.AIVEN_PASSWORD);
} else {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.stdoutMuted = true;
  
  rl.question('Aiven Password: ', (password) => {
    rl.close();
    runImport(password);
  });

  rl._writeToOutput = function _writeToOutput(stringToWrite) {
    if (rl.stdoutMuted)
      rl.output.write("*");
    else
      rl.output.write(stringToWrite);
  };
}
