const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// Tokens
const adminToken = jwt.sign({ staff_id: 1, email: 'admin@test.com', role: 'Admin' }, JWT_SECRET, { expiresIn: '1h' });
const nurseToken = jwt.sign({ staff_id: 2, email: 'nurse@test.com', role: 'Nurse' }, JWT_SECRET, { expiresIn: '1h' });

async function runTests() {
  console.log('--- STARTING FEATURE 3 VERIFICATION TESTS ---\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${details}`);
      failed++;
    }
  }

  // 1. Admin SELECT query works
  try {
    const res = await axios.post(`${API_BASE}/sql/query`, { query: 'SELECT * FROM donor;' }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res.data.success === true && Array.isArray(res.data.rows) && Array.isArray(res.data.columns), 'Admin SELECT query works');
  } catch (err) {
    assert(false, 'Admin SELECT query works', err.response?.data?.message || err.message);
  }

  // 2. Select with WHERE clause
  try {
    const res = await axios.post(`${API_BASE}/sql/query`, { query: "SELECT first_name, blood_group, city FROM donor WHERE blood_group = 'O+';" }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res.data.success === true && res.data.columns.includes('first_name'), 'SELECT with WHERE clause works');
  } catch (err) {
    assert(false, 'SELECT with WHERE clause works', err.response?.data?.message || err.message);
  }

  // 3. Invalid SQL gives clean error
  try {
    await axios.post(`${API_BASE}/sql/query`, { query: 'SELECT * FROM non_existent_table_123;' }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(false, 'Invalid SQL gives clean error');
  } catch (err) {
    assert(err.response?.status === 400 && err.response?.data?.message && !err.response?.data?.stack, 'Invalid SQL gives clean error (400 response with message)');
  }

  // 4. INSERT is rejected
  try {
    await axios.post(`${API_BASE}/sql/query`, { query: "INSERT INTO donor (first_name, last_name) VALUES ('Test', 'User');" }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(false, 'INSERT is rejected');
  } catch (err) {
    assert(err.response?.status === 400 && err.response?.data?.message.includes('Only SELECT'), 'INSERT is rejected (400 error)');
  }

  // 5. UPDATE is rejected
  try {
    await axios.post(`${API_BASE}/sql/query`, { query: "UPDATE donor SET first_name = 'Hacked';" }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(false, 'UPDATE is rejected');
  } catch (err) {
    assert(err.response?.status === 400 && err.response?.data?.message.includes('Only SELECT'), 'UPDATE is rejected (400 error)');
  }

  // 6. DELETE is rejected
  try {
    await axios.post(`${API_BASE}/sql/query`, { query: 'DELETE FROM donor;' }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(false, 'DELETE is rejected');
  } catch (err) {
    assert(err.response?.status === 400 && err.response?.data?.message.includes('Only SELECT'), 'DELETE is rejected (400 error)');
  }

  // 7. DROP is rejected
  try {
    await axios.post(`${API_BASE}/sql/query`, { query: 'DROP TABLE donor;' }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(false, 'DROP is rejected');
  } catch (err) {
    assert(err.response?.status === 400 && err.response?.data?.message.includes('Only SELECT'), 'DROP is rejected (400 error)');
  }

  // 8. Multiple statements rejected
  try {
    await axios.post(`${API_BASE}/sql/query`, { query: 'SELECT * FROM donor; SELECT * FROM receiver;' }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(false, 'Multiple statements rejected');
  } catch (err) {
    assert(err.response?.status === 400 && err.response?.data?.message.includes('Multiple SQL statements'), 'Multiple statements rejected');
  }

  // 9. Non-admin receives 403
  try {
    await axios.post(`${API_BASE}/sql/query`, { query: 'SELECT * FROM donor;' }, {
      headers: { Authorization: `Bearer ${nurseToken}` }
    });
    assert(false, 'Non-admin receives 403 on SQL console');
  } catch (err) {
    assert(err.response?.status === 403, 'Non-admin receives 403 on SQL console');
  }

  // 10. Unauthenticated user receives 401
  try {
    await axios.post(`${API_BASE}/sql/query`, { query: 'SELECT * FROM donor;' });
    assert(false, 'Unauthenticated user receives 401 on SQL console');
  } catch (err) {
    assert(err.response?.status === 401, 'Unauthenticated user receives 401 on SQL console');
  }

  // 11. Database verification finds existing record
  try {
    const res = await axios.get(`${API_BASE}/db-verification/donor/1`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res.data.success === true && res.data.found === true && res.data.data !== null && res.data.pkColumn === 'donor_id', 'Database verification finds existing record');
  } catch (err) {
    assert(false, 'Database verification finds existing record', err.response?.data?.message || err.message);
  }

  // 12. Database verification correctly shows nonexistent ID
  try {
    const res = await axios.get(`${API_BASE}/db-verification/donor/999999`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res.data.success === true && res.data.found === false && res.data.data === null && res.data.message.includes('verified deleted'), 'Database verification shows nonexistent record');
  } catch (err) {
    assert(false, 'Database verification shows nonexistent record', err.response?.data?.message || err.message);
  }

  // 13. DB Verification invalid entity rejected
  try {
    await axios.get(`${API_BASE}/db-verification/invalid_table/1`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(false, 'DB verification invalid entity rejected');
  } catch (err) {
    assert(err.response?.status === 400 && err.response?.data?.message.includes('Invalid entity'), 'DB verification invalid entity rejected');
  }

  // 14. Non-admin receives 403 on DB verification
  try {
    await axios.get(`${API_BASE}/db-verification/donor/1`, {
      headers: { Authorization: `Bearer ${nurseToken}` }
    });
    assert(false, 'Non-admin receives 403 on DB verification');
  } catch (err) {
    assert(err.response?.status === 403, 'Non-admin receives 403 on DB verification');
  }

  // 15. Unauthenticated receives 401 on DB verification
  try {
    await axios.get(`${API_BASE}/db-verification/donor/1`);
    assert(false, 'Unauthenticated receives 401 on DB verification');
  } catch (err) {
    assert(err.response?.status === 401, 'Unauthenticated receives 401 on DB verification');
  }

  console.log(`\nRESULTS: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests();
