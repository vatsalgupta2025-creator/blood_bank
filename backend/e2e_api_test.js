const axios = require('axios');
const assert = require('assert');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

const BASE_URL = 'http://localhost:5000/api';
const ROLES = ['Admin', 'Doctor', 'Nurse', 'Technician'];
const TOKENS = {};
const TEST_RESULTS = { passed: 0, failed: 0, failures: [] };
let testStaffIds = [];
const PASSWORD_HASH = '$2b$10$7yjfhBg7AmSrIBDkFgLI2./58M9bJnZM98PGzBcABX4Yqz3QGdNH2';

function logResult(name, success, message = '') {
  if (success) {
    console.log(`✅ PASS: ${name}`);
    TEST_RESULTS.passed++;
  } else {
    console.log(`❌ FAIL: ${name} - ${message}`);
    TEST_RESULTS.failed++;
    TEST_RESULTS.failures.push({ name, message });
  }
}

async function setupTestUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'blood_bank_db',
  });

  for (const role of ROLES) {
    const email = `test.${role.toLowerCase()}@lifeflow.local`;
    const [res] = await connection.query(
      `INSERT INTO staff (bank_id, first_name, last_name, role, phone, email, shift, hired_date) 
       VALUES (1, 'Test', ?, ?, '0000000000', ?, 'Morning', CURDATE())`,
      [role, role, email]
    );
    const staffId = res.insertId;
    testStaffIds.push(staffId);
    await connection.query(
      `INSERT INTO staff_credentials (staff_id, password_hash) VALUES (?, ?)`,
      [staffId, PASSWORD_HASH]
    );
  }
  await connection.end();
}

async function cleanupTestUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'blood_bank_db',
  });

  if (testStaffIds.length > 0) {
    await connection.query(`DELETE FROM staff_credentials WHERE staff_id IN (?)`, [testStaffIds]);
    await connection.query(`DELETE FROM staff WHERE staff_id IN (?)`, [testStaffIds]);
  }
  await connection.end();
}

async function testAuthentication() {
  for (const role of ROLES) {
    try {
      const email = `test.${role.toLowerCase()}@lifeflow.local`;
      const res = await axios.post(`${BASE_URL}/auth/login`, { email, password: 'password123', role: 'Staff' });
      TOKENS[role] = res.data.token;
    } catch (err) {}
  }
}

async function testCRUD() {
  console.log('\n--- Testing CRUD End-to-End ---');
  const headers = { headers: { Authorization: `Bearer ${TOKENS['Admin']}` } };
  
  const entities = [
    {
      name: 'Blood Bank',
      path: 'blood-banks',
      idField: 'bank_id',
      createData: { name: 'Test Bank', address: '123 Test St', city: 'Test City', state: 'TS', phone: '123', email: 'b@test.com', capacity: 100 },
      updateData: { name: 'Test Bank Updated', address: '123 Test St', city: 'Test City', state: 'TS', phone: '123', email: 'b@test.com', capacity: 150 }
    },
    {
      name: 'Donor',
      path: 'donors',
      idField: 'donor_id',
      createData: { first_name: 'Test', last_name: 'Donor', dob: '1990-01-01', gender: 'Male', blood_group: 'A+', phone: '1234567890', email: 'd@test.com', is_eligible: 1 },
      updateData: { first_name: 'Test Upd', last_name: 'Donor', dob: '1990-01-01', gender: 'Male', blood_group: 'A+', phone: '1234567890', email: 'd@test.com', is_eligible: 0 }
    },
    {
      name: 'Receiver',
      path: 'receivers',
      idField: 'receiver_id',
      createData: { first_name: 'Test', last_name: 'Receiver', dob: '1995-01-01', gender: 'Female', blood_group: 'O+', phone: '0987654321', email: 'r@test.com' },
      updateData: { first_name: 'Test Upd', last_name: 'Receiver', dob: '1995-01-01', gender: 'Female', blood_group: 'O+', phone: '0987654321', email: 'r@test.com' }
    },
    {
      name: 'Blood Unit',
      path: 'blood-units',
      idField: 'unit_id',
      createData: { bank_id: 1, unit_code: 'UNIT-TEST', blood_group: 'A+', collected_date: '2023-01-01', expiry_date: '2023-02-01', status: 'Available' },
      updateData: { bank_id: 1, unit_code: 'UNIT-TEST', blood_group: 'A+', collected_date: '2023-01-01', expiry_date: '2023-02-01', status: 'Expired' }
    }
  ];

  for (const ent of entities) {
    let createdId;
    
    // Create
    try {
      const res = await axios.post(`${BASE_URL}/${ent.path}`, ent.createData, headers);
      createdId = res.data.data[ent.idField];
      logResult(`Create ${ent.name}`, !!createdId);
    } catch (err) {
      logResult(`Create ${ent.name}`, false, err.response?.data?.message || err.message);
      continue;
    }

    // Read
    try {
      const res = await axios.get(`${BASE_URL}/${ent.path}/${createdId}`, headers);
      logResult(`Read ${ent.name}`, res.data.data[ent.idField] === createdId);
    } catch (err) {
      logResult(`Read ${ent.name}`, false, err.message);
    }

    // Update
    try {
      const res = await axios.put(`${BASE_URL}/${ent.path}/${createdId}`, ent.updateData, headers);
      logResult(`Update ${ent.name}`, true);
    } catch (err) {
      logResult(`Update ${ent.name}`, false, err.message);
    }

    // Delete
    try {
      await axios.delete(`${BASE_URL}/${ent.path}/${createdId}`, headers);
      logResult(`Delete ${ent.name}`, true);
    } catch (err) {
      logResult(`Delete ${ent.name}`, false, err.message);
    }
  }
}

async function runTests() {
  try {
    await setupTestUsers();
    await testAuthentication();
    await testCRUD();
    console.log('\n--- Final Report ---');
    console.log(`Total Passed: ${TEST_RESULTS.passed}`);
    console.log(`Total Failed: ${TEST_RESULTS.failed}`);
    if (TEST_RESULTS.failed > 0) {
      console.log('Failures:');
      TEST_RESULTS.failures.forEach(f => console.log(` - ${f.name}: ${f.message}`));
    }
  } catch (err) {
    console.error('Testing aborted due to fatal error:', err);
  } finally {
    await cleanupTestUsers();
  }
}

runTests();
