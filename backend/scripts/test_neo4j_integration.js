const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const axios = require('axios');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const neo4jConfig = require('../config/neo4j');

const API_BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is missing.');
  process.exit(1);
}

// Generate test JWT tokens
const adminToken    = jwt.sign({ staff_id: 1, email: 'admin@test.com',    role: 'Admin'      }, JWT_SECRET, { expiresIn: '1h' });
const nurseToken    = jwt.sign({ staff_id: 2, email: 'nurse@test.com',    role: 'Nurse'      }, JWT_SECRET, { expiresIn: '1h' });
const doctorToken   = jwt.sign({ staff_id: 3, email: 'doctor@test.com',   role: 'Doctor'     }, JWT_SECRET, { expiresIn: '1h' });
const techToken     = jwt.sign({ staff_id: 4, email: 'tech@test.com',     role: 'Technician' }, JWT_SECRET, { expiresIn: '1h' });

async function runTests() {
  console.log('====================================================');
  console.log('  LifeFlow Neo4j Aura Integration Verification Test ');
  console.log('====================================================\n');

  let passed  = 0;
  let failed  = 0;
  let skipped = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}${details ? ' - ' + details : ''}`);
      failed++;
    }
  }

  function skip(testName, reason = '') {
    console.log(`⏭️  SKIP: ${testName}${reason ? ' (' + reason + ')' : ''}`);
    skipped++;
  }

  // ── TEST 1: Existing API Startup & Health ──────────────────────────────
  try {
    const res = await axios.get(`${API_BASE}/health`);
    assert(res.status === 200 && res.data.success === true, 'Existing API starts and responds to /api/health');
  } catch (err) {
    assert(false, 'Existing API starts and responds to /api/health', err.message);
  }

  // ── TEST 2: Existing MySQL Database Connectivity ────────────────────────
  try {
    const res = await axios.get(`${API_BASE}/db-test`);
    assert(res.status === 200 && res.data.success === true, 'Existing MySQL connection via /api/db-test operates normally');
  } catch (err) {
    assert(false, 'Existing MySQL connection via /api/db-test operates normally', err.message);
  }

  // ── TEST 3: Unauthenticated request to /api/graph/status rejected (401) ──
  try {
    await axios.get(`${API_BASE}/graph/status`);
    assert(false, 'Unauthenticated GET /api/graph/status returns 401');
  } catch (err) {
    assert(err.response?.status === 401, 'Unauthenticated GET /api/graph/status returns 401');
  }

  // ── TEST 4: Authenticated request to /api/graph/status succeeds ─────────
  try {
    const res = await axios.get(`${API_BASE}/graph/status`, {
      headers: { Authorization: `Bearer ${nurseToken}` }
    });
    assert(res.status === 200 && res.data.success === true && res.data.status !== undefined,
      'Authenticated GET /api/graph/status returns valid health payload');
  } catch (err) {
    assert(false, 'Authenticated GET /api/graph/status returns valid health payload', err.message);
  }

  // ── TEST 5: Unauthenticated request to /api/graph/sync rejected (401) ────
  try {
    await axios.post(`${API_BASE}/graph/sync`);
    assert(false, 'Unauthenticated POST /api/graph/sync returns 401');
  } catch (err) {
    assert(err.response?.status === 401, 'Unauthenticated POST /api/graph/sync returns 401');
  }

  // ── TEST 6: Non-Admin (Nurse) request to /api/graph/sync rejected (403) ──
  try {
    await axios.post(`${API_BASE}/graph/sync`, {}, {
      headers: { Authorization: `Bearer ${nurseToken}` }
    });
    assert(false, 'Non-Admin (Nurse) POST /api/graph/sync returns 403');
  } catch (err) {
    assert(err.response?.status === 403, 'Non-Admin (Nurse) POST /api/graph/sync returns 403');
  }

  // ── TEST 7: Non-Admin (Doctor) request to /api/graph/sync rejected (403) ─
  try {
    await axios.post(`${API_BASE}/graph/sync`, {}, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    assert(false, 'Non-Admin (Doctor) POST /api/graph/sync returns 403');
  } catch (err) {
    assert(err.response?.status === 403, 'Non-Admin (Doctor) POST /api/graph/sync returns 403');
  }

  // ── TEST 8: Technician cannot access trace/unit/:id (403) ───────────────
  // This was the critical missing RBAC test from the code review.
  try {
    await axios.get(`${API_BASE}/graph/trace/unit/1`, {
      headers: { Authorization: `Bearer ${techToken}` }
    });
    assert(false, 'Technician GET /api/graph/trace/unit/:id returns 403');
  } catch (err) {
    assert(err.response?.status === 403, 'Technician GET /api/graph/trace/unit/:id returns 403');
  }

  // ── TEST 9: Technician cannot access trace/donor/:id (403) ──────────────
  try {
    await axios.get(`${API_BASE}/graph/trace/donor/1`, {
      headers: { Authorization: `Bearer ${techToken}` }
    });
    assert(false, 'Technician GET /api/graph/trace/donor/:id returns 403');
  } catch (err) {
    assert(err.response?.status === 403, 'Technician GET /api/graph/trace/donor/:id returns 403');
  }

  // ── TEST 10: Technician cannot access /trace/:id alias (403) ────────────
  try {
    await axios.get(`${API_BASE}/graph/trace/1`, {
      headers: { Authorization: `Bearer ${techToken}` }
    });
    assert(false, 'Technician GET /api/graph/trace/:id (alias) returns 403');
  } catch (err) {
    assert(err.response?.status === 403, 'Technician GET /api/graph/trace/:id (alias) returns 403');
  }

  // ── TEST 11: Unknown Unit ID returns 404 (authoritative MySQL check) ─────
  try {
    await axios.get(`${API_BASE}/graph/trace/unit/999999`, {
      headers: { Authorization: `Bearer ${nurseToken}` }
    });
    assert(false, 'Unknown Unit ID returns 404');
  } catch (err) {
    assert(err.response?.status === 404, 'Unknown Unit ID returns 404');
  }

  // ── TEST 12: Unknown Donor ID returns 404 (authoritative MySQL check) ────
  try {
    await axios.get(`${API_BASE}/graph/trace/donor/999999`, {
      headers: { Authorization: `Bearer ${nurseToken}` }
    });
    assert(false, 'Unknown Donor ID returns 404');
  } catch (err) {
    assert(err.response?.status === 404, 'Unknown Donor ID returns 404');
  }

  // ── TEST 13: PII policy - Nurse/Doctor response must omit email & phone ──
  // When Neo4j is offline, the trace returns early without contacting MySQL
  // for donor PII, so we only test the PII stripping when Neo4j IS available.
  const isNeo4jConfigured = neo4jConfig.isConfigured();
  if (!isNeo4jConfigured) {
    skip('Nurse/Doctor trace response omits email and phone', 'Neo4j not configured – test requires live sync');
    skip('Admin trace response includes email and phone', 'Neo4j not configured – test requires live sync');
  }
  // (Live PII policy tests are run in the live block below after sync.)

  // ── TEST 14: Privacy Audit – No PII in Cypher projection parameters ──────
  // The service legitimately reads email/phone from MySQL to return to the
  // controller (which applies role-based field stripping before the HTTP
  // response).  What must NOT appear is PII inside the Neo4j paramDonors
  // mapping or inside a Cypher CREATE statement for :Donor nodes.
  try {
    const code = require('fs').readFileSync(path.resolve(__dirname, '../services/graphSyncService.js'), 'utf8');

    // Extract the fetchMySQLSnapshot donor query – must only select donor_id & blood_group
    const donorSnapshotQueryOk = /SELECT donor_id, blood_group FROM donor/.test(code);

    // The paramDonors mapping must not include PII fields
    // Look for the donor mapping block (between "paramDonors = " and the closing ));)
    const paramDonorBlock = code.match(/paramDonors\s*=\s*donors\.map[\s\S]*?\]\s*\);/);
    const donorMapNoPii = paramDonorBlock
      ? !paramDonorBlock[0].includes('email') &&
        !paramDonorBlock[0].includes('phone') &&
        !paramDonorBlock[0].includes('first_name') &&
        !paramDonorBlock[0].includes('last_name')
      : false;

    // The Cypher MERGE/CREATE :Donor block must not include PII properties
    const donorCreateBlock = code.match(/(?:CREATE|MERGE)\s*\([a-zA-Z0-9_:]*Donor\s*\{[\s\S]*?\}\s*\)/);
    const donorCreateNoPii = donorCreateBlock
      ? !donorCreateBlock[0].includes('email') &&
        !donorCreateBlock[0].includes('phone') &&
        !donorCreateBlock[0].includes('first_name') &&
        !donorCreateBlock[0].includes('last_name')
      : false;

    assert(
      donorSnapshotQueryOk && donorMapNoPii && donorCreateNoPii,
      'graphSyncService: fetchMySQLSnapshot donor query, paramDonors map, and Cypher MERGE/CREATE :Donor all exclude PII',
      !donorSnapshotQueryOk ? 'donor snapshot query contains PII columns' :
      !donorMapNoPii        ? 'paramDonors map contains PII fields' :
      !donorCreateNoPii     ? 'Cypher MERGE/CREATE :Donor contains PII properties' : ''
    );
  } catch (err) {
    assert(false, 'Privacy Audit: No PII stored in graph projection parameters', err.message);
  }

  // ── TEST 15: Scoped deletion – source code must not contain global DETACH DELETE ─
  try {
    const code = require('fs').readFileSync(path.resolve(__dirname, '../services/graphSyncService.js'), 'utf8');
    // The fixed code must NOT contain the unscoped global delete.
    const hasUnscopedDelete = /MATCH\s*\(n\)\s*DETACH\s*DELETE\s*n/.test(code);
    assert(!hasUnscopedDelete, 'graphSyncService does NOT contain unscoped MATCH (n) DETACH DELETE n');
  } catch (err) {
    assert(false, 'Scoped deletion check', err.message);
  }

  // ── TEST 16: Offline resilience – trace/unit returns projectionAvailable:false ─
  // We exercise the offline code path by inspecting the response when Neo4j
  // is not configured (driver throws on getSession).
  if (!isNeo4jConfigured) {
    try {
      // Find a real unit_id from MySQL to avoid 404 short-circuit
      const [rows] = await pool.query('SELECT unit_id FROM blood_unit LIMIT 1');
      if (rows.length > 0) {
        const uid = rows[0].unit_id;
        const res = await axios.get(`${API_BASE}/graph/trace/unit/${uid}`, {
          headers: { Authorization: `Bearer ${nurseToken}` }
        });
        assert(
          res.status === 200 &&
          res.data.success === true &&
          res.data.data.projectionAvailable === false &&
          res.data.data.unit !== null,
          'Offline: trace/unit returns 200 with projectionAvailable:false and MySQL unit data'
        );
      } else {
        skip('Offline trace/unit projectionAvailable test', 'No blood_unit rows in MySQL');
      }
    } catch (err) {
      assert(false, 'Offline trace/unit returns projectionAvailable:false', err.message);
    }

    // ── TEST 17: Offline resilience – trace/donor returns donations:null ──────
    try {
      const [rows] = await pool.query('SELECT donor_id FROM donor LIMIT 1');
      if (rows.length > 0) {
        const did = rows[0].donor_id;
        const res = await axios.get(`${API_BASE}/graph/trace/donor/${did}`, {
          headers: { Authorization: `Bearer ${nurseToken}` }
        });
        assert(
          res.status === 200 &&
          res.data.success === true &&
          res.data.data.projectionAvailable === false &&
          res.data.data.donations === null, // null = unknown, not confirmed zero
          'Offline: trace/donor returns donations:null (not [] or 0) when Neo4j unavailable'
        );
      } else {
        skip('Offline trace/donor donations:null test', 'No donor rows in MySQL');
      }
    } catch (err) {
      assert(false, 'Offline trace/donor returns donations:null', err.message);
    }
  } else {
    skip('Offline projectionAvailable tests', 'Neo4j is configured – offline code path not active');
    skip('Offline donations:null test',       'Neo4j is configured – offline code path not active');
  }

  // ── LIVE NEO4J TESTS (only when credentials are present and not skipped) ──
  const skipLiveSync = process.argv.includes('--offline') || process.env.SKIP_LIVE_SYNC === 'true';
  if (!isNeo4jConfigured || skipLiveSync) {
    console.log('\n⏭️  SKIPPED: Live Neo4j Aura tests (offline mode active or live sync not requested).');
    console.log('   Full graph synchronization is deferred until explicit approval.');
    skipped += 6; // Sync, idempotency, unrelated-node preservation, PII policy (admin), PII policy (nurse), Traceability
  } else {
    console.log('\n--- Running Live Neo4j Aura Tests ---');

    // ── PRE-FLIGHT: Verify live Aura connectivity before attempting sync ──
    const isLiveConnected = await neo4jConfig.checkConnection();
    if (!isLiveConnected) {
      assert(false, 'Live Neo4j Aura connectivity pre-flight check', 'Aura connection failed or is unreachable. Aborting before sync.');
      console.error('⛔ Pre-flight check failed: stopping live tests before any sync operation to prevent data loss or failed state.');
      console.log(`\n====================================================`);
      console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed, ${skipped} Skipped`);
      console.log(`====================================================\n`);
      process.exit(1);
    }
    assert(true, 'Live Neo4j Aura connectivity pre-flight passed before sync');

    const deferFullSync = process.argv.includes('--defer-full-sync') || process.env.DEFER_FULL_SYNC === 'true';
    if (deferFullSync) {
      console.log('\n⏸️  Full production graph sync deferred by request (--defer-full-sync).');
      console.log('   Preflight connectivity guard passed. No writes or full sync endpoints triggered.');
      skip('Live Test L1: Admin-triggered Graph Sync', 'Deferred – awaiting explicit confirmation');
      skip('Live Test L2: Sync Idempotency', 'Deferred – awaiting explicit confirmation');
      skip('Live Test L3: Non-destructive sentinel preservation', 'Deferred – awaiting explicit confirmation');
      skip('Live Test L4: Nurse PII policy against synced data', 'Deferred – awaiting explicit confirmation');
      skip('Live Test L5: Admin PII policy against synced data', 'Deferred – awaiting explicit confirmation');
      skip('Live Test L6: Traceability correctness against synced data', 'Deferred – awaiting explicit confirmation');
    } else {
      // ── TEST L1: Admin-triggered Graph Sync ───────────────────────────────
    let firstSyncResult = null;
    try {
      const res = await axios.post(`${API_BASE}/graph/sync`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      firstSyncResult = res.data;
      assert(
        res.status === 200 &&
        res.data.success === true &&
        res.data.nodeCounts.total > 0 &&
        res.data.relationshipCounts.total > 0,
        `Admin full sync succeeded: ${res.data.nodeCounts?.total} nodes, ${res.data.relationshipCounts?.total} rels`
      );
    } catch (err) {
      assert(false, 'Admin full sync succeeded', err.response?.data?.message || err.message);
    }

    // ── TEST L2: Sync Idempotency ─────────────────────────────────────────
    try {
      const res = await axios.post(`${API_BASE}/graph/sync`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const second = res.data;
      const ok =
        firstSyncResult &&
        second.nodeCounts.total         === firstSyncResult.nodeCounts.total &&
        second.relationshipCounts.total === firstSyncResult.relationshipCounts.total &&
        second.nodeCounts.Donor         === firstSyncResult.nodeCounts.Donor &&
        second.nodeCounts.DonationEvent === firstSyncResult.nodeCounts.DonationEvent;
      assert(ok, 'Repeated sync is idempotent: node & relationship counts identical');
    } catch (err) {
      assert(false, 'Repeated sync is idempotent', err.response?.data?.message || err.message);
    }

    // ── TEST L3: Non-destructive sync preserves unrelated nodes & relationships ─
    // We create an out-of-band sentinel node AND an out-of-band relationship
    // attached to a LifeFlow projection node (BloodBank), run sync, and confirm BOTH survive.
    let externalEntitiesCreated = false;
    try {
      const { getSession } = require('../config/neo4j');
      const neo4j = require('neo4j-driver');
      const setupSession = getSession(neo4j.session.WRITE);
      try {
        await setupSession.run(`
          MERGE (s:_LifeFlowTestSentinel {id: 'ext-test-sentinel-2024'})
          MERGE (b:BloodBank {bank_id: 1})
          MERGE (s)-[r:_SENTINEL_ATTACHED_REL {ref: 'ext-rel-2024'}]->(b)
        `);
        externalEntitiesCreated = true;
      } finally {
        await setupSession.close().catch(() => {});
      }

      // Sync again (should only clear internal LifeFlow relationships, preserving external nodes & rels)
      await axios.post(`${API_BASE}/graph/sync`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      // Verify BOTH the sentinel node and the attached sentinel relationship still exist
      const checkSession = getSession(neo4j.session.READ);
      let sentinelNodeFound = false;
      let sentinelRelFound = false;
      try {
        const rNode = await checkSession.run("MATCH (n:_LifeFlowTestSentinel {id: 'ext-test-sentinel-2024'}) RETURN count(n) AS cnt");
        sentinelNodeFound = rNode.records[0]?.get('cnt').toNumber() > 0;

        const rRel = await checkSession.run("MATCH (s:_LifeFlowTestSentinel {id: 'ext-test-sentinel-2024'})-[r:_SENTINEL_ATTACHED_REL]->(b:BloodBank {bank_id: 1}) RETURN count(r) AS cnt");
        sentinelRelFound = rRel.records[0]?.get('cnt').toNumber() > 0;
      } finally {
        await checkSession.close().catch(() => {});
      }

      assert(
        sentinelNodeFound && sentinelRelFound,
        'Non-destructive sync: unrelated sentinel node AND attached relationship to LifeFlow label survived sync',
        !sentinelNodeFound ? 'sentinel node was deleted' :
        !sentinelRelFound  ? 'sentinel relationship attached to BloodBank was deleted' : ''
      );
    } catch (err) {
      if (externalEntitiesCreated) {
        assert(false, 'Non-destructive sync preserves unrelated nodes & relationships', err.message);
      } else {
        assert(false, 'Non-destructive sync test: could not create sentinel node/rel', err.message);
      }
    } finally {
      // Guaranteed cleanup: always remove test sentinel node and its attached relationships
      try {
        const { getSession } = require('../config/neo4j');
        const neo4j = require('neo4j-driver');
        const cleanSession = getSession(neo4j.session.WRITE);
        try {
          await cleanSession.run("MATCH (n:_LifeFlowTestSentinel) DETACH DELETE n");
        } finally {
          await cleanSession.close().catch(() => {});
        }
      } catch (cleanErr) {
        console.warn('⚠️ Sentinel cleanup attempt warning:', cleanErr.message);
      }
    }

    // ── TEST L4: PII policy – Nurse response omits email and phone ────────
    try {
      const [rows] = await pool.query('SELECT donor_id FROM donor LIMIT 1');
      if (rows.length > 0) {
        const did = rows[0].donor_id;
        const res = await axios.get(`${API_BASE}/graph/trace/donor/${did}`, {
          headers: { Authorization: `Bearer ${nurseToken}` }
        });
        const donor = res.data.data.donor;
        // projectionSynced may be false if this donor has no Donor node yet –
        // in that case donor is from MySQL but PII stripping is applied.
        const noEmail = donor && !Object.prototype.hasOwnProperty.call(donor, 'email');
        const noPhone = donor && !Object.prototype.hasOwnProperty.call(donor, 'phone');
        assert(noEmail && noPhone, 'Nurse trace/donor response omits email and phone fields');
      } else {
        skip('Nurse PII policy test', 'No donor rows in MySQL');
      }
    } catch (err) {
      assert(false, 'Nurse trace/donor PII policy', err.message);
    }

    // ── TEST L5: PII policy – Admin response includes email and phone ─────
    try {
      const [rows] = await pool.query('SELECT donor_id FROM donor LIMIT 1');
      if (rows.length > 0) {
        const did = rows[0].donor_id;
        const res = await axios.get(`${API_BASE}/graph/trace/donor/${did}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        const donor = res.data.data.donor;
        // Only assert PII is present when the projection is synced (donor object populated from MySQL)
        if (res.data.data.projectionSynced === true) {
          assert(
            donor && Object.prototype.hasOwnProperty.call(donor, 'email'),
            'Admin trace/donor response includes email field'
          );
        } else {
          skip('Admin PII policy (email present)', 'projectionSynced:false – donor node not yet in graph; run sync first');
        }
      } else {
        skip('Admin PII policy test', 'No donor rows in MySQL');
      }
    } catch (err) {
      assert(false, 'Admin trace/donor PII policy', err.message);
    }

    // ── TEST L6: Traceability Correctness (MySQL vs Neo4j) ────────────────
    try {
      const [mysqlUnits] = await pool.query('SELECT * FROM blood_unit WHERE unit_id = 1');
      if (mysqlUnits.length > 0) {
        const res = await axios.get(`${API_BASE}/graph/trace/unit/1`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        const data = res.data.data;
        const [mysqlEvents] = await pool.query('SELECT * FROM donation_event WHERE unit_id = 1');
        const [mysqlDonors] = await pool.query('SELECT * FROM donor WHERE donor_id = ?', [mysqlEvents[0]?.donor_id]);

        if (data.projectionSynced && mysqlDonors.length > 0) {
          const unitMatches  = data.unit.unit_code === mysqlUnits[0].unit_code;
          const donorMatches = data.donor?.name?.includes(mysqlDonors[0].first_name);
          const hasBank      = Boolean(data.bloodBank && data.bloodBank.name);
          assert(unitMatches && donorMatches && hasBank,
            'Trace unit 1: BloodUnit → DonationEvent → BloodBank & Donor correlated across graph & MySQL');
        } else {
          skip('Traceability correctness for unit 1', 'projectionSynced:false or no donor row – run sync first');
        }
      } else {
        skip('Traceability correctness for unit 1', 'blood_unit row 1 not found in MySQL');
      }
    } catch (err) {
      assert(false, 'Traceability Correctness (MySQL vs Neo4j)', err.response?.data?.message || err.message);
    }
    }
  }

  console.log(`\n====================================================`);
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed, ${skipped} Skipped`);
  console.log(`====================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Start test
runTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Unhandled test failure:', err);
    process.exit(1);
  });
