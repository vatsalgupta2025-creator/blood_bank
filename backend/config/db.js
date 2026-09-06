const mysql = require('mysql2/promise');
const fs = require('fs');

const dbConfig = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  database: process.env.DB_NAME     || 'blood_bank_db',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+00:00',
};

if (process.env.DB_SSL_CA) {
  dbConfig.ssl = {
    rejectUnauthorized: true,
    ca: fs.readFileSync(process.env.DB_SSL_CA)
  };
}

const pool = mysql.createPool(dbConfig);

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  });

module.exports = pool;
