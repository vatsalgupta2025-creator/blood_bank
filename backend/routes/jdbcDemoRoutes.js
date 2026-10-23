const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// GET /api/jdbc-demo/info - Safe read-only metadata about the JDBC demonstration module
router.get('/info', (req, res) => {
  const rootDir = path.resolve(__dirname, '../../');
  const javaPath = path.join(rootDir, 'jdbc-demo', 'src', 'main', 'java', 'com', 'bloodbank', 'DBConnection.java');
  const pomPath = path.join(rootDir, 'jdbc-demo', 'pom.xml');
  const jarPath = path.join(rootDir, 'jdbc-demo', 'lib', 'mysql-connector-j-8.0.33.jar');

  const filesStatus = {
    sourceExists: fs.existsSync(javaPath),
    pomExists: fs.existsSync(pomPath),
    driverJarExists: fs.existsSync(jarPath)
  };

  res.json({
    success: true,
    data: {
      title: 'JDBC Database Connectivity Demonstration',
      academicPurpose: 'Academic verification of Java JDBC Database Connectivity for DBMS submission',
      architecture: 'Java Application → JDBC API (java.sql) → MySQL Driver (Connector/J) → MySQL Database',
      targetDatabase: process.env.DB_NAME || 'blood_bank_db',
      targetHost: process.env.DB_HOST || 'localhost',
      targetPort: Number(process.env.DB_PORT) || 3306,
      targetUser: process.env.DB_USER || 'root',
      driverClass: 'com.mysql.cj.jdbc.Driver',
      modulePath: 'jdbc-demo/src/main/java/com/bloodbank/DBConnection.java',
      pomPath: 'jdbc-demo/pom.xml',
      separationNotice: 'This is a separate Java demonstration module created for academic submission. The active Node.js web application connects independently using the mysql2 connection pool.',
      filesStatus
    }
  });
});

// GET /api/jdbc-demo/source - Return the actual DBConnection.java source code safely
router.get('/source', (req, res) => {
  try {
    const javaPath = path.resolve(__dirname, '../../jdbc-demo/src/main/java/com/bloodbank/DBConnection.java');
    if (!fs.existsSync(javaPath)) {
      return res.status(404).json({ success: false, message: 'DBConnection.java not found on disk' });
    }
    const sourceCode = fs.readFileSync(javaPath, 'utf8');
    res.json({
      success: true,
      filename: 'DBConnection.java',
      language: 'java',
      sourceCode
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to read source file', error: err.message });
  }
});

module.exports = router;
