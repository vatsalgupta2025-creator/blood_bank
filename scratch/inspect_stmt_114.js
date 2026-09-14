const fs = require('fs');
const path = require('path');

const backupPath = path.join(__dirname, '..', 'database', 'blood_bank_local_backup.sql');
const rawBuffer = fs.readFileSync(backupPath);
let sqlDump = '';

if (rawBuffer.length >= 2 && rawBuffer[0] === 0xFF && rawBuffer[1] === 0xFE) {
  sqlDump = rawBuffer.toString('utf16le');
  if (sqlDump.charCodeAt(0) === 0xFEFF) {
    sqlDump = sqlDump.slice(1);
  }
} else {
  sqlDump = rawBuffer.toString('utf8');
}

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

console.log('Total statements:', statements.length);
if (statements.length >= 114) {
  console.log('--- STATEMENT 114 ---');
  console.log(statements[113]); // 0-indexed
}
