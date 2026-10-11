const pool = require('../config/db');
const { getSession, safeInt, toNative } = require('../config/neo4j');
const neo4j = require('neo4j-driver');

let isSyncing = false;
let lastSyncMetadata = {
  lastSyncTime: null,
  nodeCounts: {
    total: 0,
    Donor: 0,
    DonationEvent: 0,
    BloodUnit: 0,
    BloodTest: 0,
    BloodBank: 0
  },
  relationshipCounts: {
    total: 0,
    DONATES: 0,
    RECEIVED_AT: 0,
    GENERATES: 0,
    HAS_TEST: 0
  }
};

function formatDate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'string') {
    return val.split('T')[0];
  }
  return String(val);
}

function formatTime(val) {
  if (!val) return null;
  return String(val);
}

// Ensure database constraints exist on Neo4j schema
async function ensureSchemaConstraints(session) {
  const constraints = [
    'CREATE CONSTRAINT donor_id_unique IF NOT EXISTS FOR (d:Donor) REQUIRE d.donor_id IS UNIQUE',
    'CREATE CONSTRAINT event_id_unique IF NOT EXISTS FOR (e:DonationEvent) REQUIRE e.event_id IS UNIQUE',
    'CREATE CONSTRAINT unit_id_unique IF NOT EXISTS FOR (u:BloodUnit) REQUIRE u.unit_id IS UNIQUE',
    'CREATE CONSTRAINT test_id_unique IF NOT EXISTS FOR (t:BloodTest) REQUIRE t.test_id IS UNIQUE',
    'CREATE CONSTRAINT bank_id_unique IF NOT EXISTS FOR (b:BloodBank) REQUIRE b.bank_id IS UNIQUE'
  ];

  for (const c of constraints) {
    await session.run(c);
  }
}

/**
 * Reads 5 source tables from MySQL within a single consistent snapshot.
 * STRICT PRIVACY: Omits donor names, phones, emails, streets, credentials, and PII.
 */
async function fetchMySQLSnapshot() {
  const conn = await pool.getConnection();
  try {
    await conn.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    await conn.query('START TRANSACTION WITH CONSISTENT SNAPSHOT');

    // 1. Donors: strictly non-PII only
    const [donors] = await conn.query('SELECT donor_id, blood_group FROM donor ORDER BY donor_id ASC');

    // 2. Blood Banks
    const [banks] = await conn.query('SELECT bank_id, name, city, state FROM blood_bank ORDER BY bank_id ASC');

    // 3. Blood Units
    const [units] = await conn.query('SELECT unit_id, unit_code, blood_group, volume_ml, collected_date, expiry_date, status FROM blood_unit ORDER BY unit_id ASC');

    // 4. Donation Events
    const [events] = await conn.query('SELECT event_id, donor_id, bank_id, unit_id, event_date, event_time, notes FROM donation_event ORDER BY event_id ASC');

    // 5. Blood Tests
    const [tests] = await conn.query('SELECT test_id, event_id, test_type, tested_date, result FROM blood_test ORDER BY test_id ASC');

    await conn.query('COMMIT');

    return { donors, banks, units, events, tests };
  } catch (err) {
    await conn.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Full replacement synchronization:
 * 1. Concurrency guard prevents concurrent syncs.
 * 2. Fetches MySQL snapshot.
 * 3. Atomic Neo4j transaction replaces entire projection.
 * If any error occurs, Neo4j rolls back and previously committed state remains intact.
 */
async function syncGraph() {
  if (isSyncing) {
    const error = new Error('Graph synchronization is already in progress.');
    error.statusCode = 409;
    throw error;
  }

  isSyncing = true;
  let session = null;

  try {
    session = getSession(neo4j.session.WRITE);

    // Ensure schema constraints are in place
    await ensureSchemaConstraints(session);

    // Fetch consistent snapshot from MySQL
    const { donors, banks, units, events, tests } = await fetchMySQLSnapshot();

    // Prepare bounded, sanitized parameters
    const paramDonors = donors.map(d => ({
      donor_id: safeInt(d.donor_id),
      blood_group: d.blood_group
    }));

    const paramBanks = banks.map(b => ({
      bank_id: safeInt(b.bank_id),
      name: b.name,
      city: b.city,
      state: b.state
    }));

    const paramUnits = units.map(u => ({
      unit_id: safeInt(u.unit_id),
      unit_code: u.unit_code,
      blood_group: u.blood_group,
      volume_ml: safeInt(u.volume_ml),
      collected_date: formatDate(u.collected_date),
      expiry_date: formatDate(u.expiry_date),
      status: u.status
    }));

    const paramEvents = events.map(e => ({
      event_id: safeInt(e.event_id),
      donor_id: safeInt(e.donor_id),
      bank_id: safeInt(e.bank_id),
      unit_id: e.unit_id ? safeInt(e.unit_id) : null,
      event_date: formatDate(e.event_date),
      event_time: formatTime(e.event_time),
      notes: e.notes || ''
    }));

    const paramTests = tests.map(t => ({
      test_id: safeInt(t.test_id),
      event_id: safeInt(t.event_id),
      test_type: t.test_type,
      tested_date: formatDate(t.tested_date),
      result: t.result
    }));

    // Safe, non-destructive atomic write transaction.
    // 1. Clears ONLY internal LifeFlow-managed relationship types between LifeFlow node pairs.
    //    Unrelated nodes and relationships (including any attached to LifeFlow nodes) are strictly preserved.
    // 2. Prunes obsolete unlinked LifeFlow nodes that are no longer in MySQL.
    // 3. Upserts (MERGE) current projection nodes and sets non-PII properties.
    // 4. Recreates internal LifeFlow relationships.
    // If any step fails, Neo4j rolls back the entire transaction.
    const bankIds  = paramBanks.map(b => b.bank_id);
    const donorIds = paramDonors.map(d => d.donor_id);
    const unitIds  = paramUnits.map(u => u.unit_id);
    const eventIds = paramEvents.map(e => e.event_id);
    const testIds  = paramTests.map(t => t.test_id);

    await session.executeWrite(async tx => {
      // Step A: Clear ONLY internal LifeFlow relationship types connecting projection nodes.
      // Unrelated relationships (even if attached to Donor, BloodBank, etc.) are NOT touched.
      await tx.run('MATCH (d:Donor)-[r:DONATES]->(ev:DonationEvent) DELETE r');
      await tx.run('MATCH (ev:DonationEvent)-[r:RECEIVED_AT]->(b:BloodBank) DELETE r');
      await tx.run('MATCH (ev:DonationEvent)-[r:GENERATES]->(u:BloodUnit) DELETE r');
      await tx.run('MATCH (ev:DonationEvent)-[r:HAS_TEST]->(bt:BloodTest) DELETE r');

      // Step B: Prune obsolete LifeFlow nodes if any were removed from MySQL.
      // ONLY delete if node has NO remaining relationships (unlinked) and ONLY the single LifeFlow label.
      await tx.run('MATCH (bt:BloodTest) WHERE NOT bt.test_id IN $testIds AND NOT (bt)--() AND labels(bt) = ["BloodTest"] DELETE bt', { testIds });
      await tx.run('MATCH (u:BloodUnit) WHERE NOT u.unit_id IN $unitIds AND NOT (u)--() AND labels(u) = ["BloodUnit"] DELETE u', { unitIds });
      await tx.run('MATCH (ev:DonationEvent) WHERE NOT ev.event_id IN $eventIds AND NOT (ev)--() AND labels(ev) = ["DonationEvent"] DELETE ev', { eventIds });
      await tx.run('MATCH (d:Donor) WHERE NOT d.donor_id IN $donorIds AND NOT (d)--() AND labels(d) = ["Donor"] DELETE d', { donorIds });
      await tx.run('MATCH (b:BloodBank) WHERE NOT b.bank_id IN $bankIds AND NOT (b)--() AND labels(b) = ["BloodBank"] DELETE b', { bankIds });

      // Step C: Upsert (MERGE) BloodBank nodes
      if (paramBanks.length > 0) {
        await tx.run(`
          UNWIND $banks AS b
          MERGE (bank:BloodBank {bank_id: b.bank_id})
          SET bank.name = b.name,
              bank.city = b.city,
              bank.state = b.state
        `, { banks: paramBanks });
      }

      // Step D: Upsert (MERGE) Donor nodes (strictly non-PII only)
      if (paramDonors.length > 0) {
        await tx.run(`
          UNWIND $donors AS d
          MERGE (donor:Donor {donor_id: d.donor_id})
          SET donor.blood_group = d.blood_group
        `, { donors: paramDonors });
      }

      // Step E: Upsert (MERGE) BloodUnit nodes
      if (paramUnits.length > 0) {
        await tx.run(`
          UNWIND $units AS u
          MERGE (unit:BloodUnit {unit_id: u.unit_id})
          SET unit.unit_code = u.unit_code,
              unit.blood_group = u.blood_group,
              unit.volume_ml = u.volume_ml,
              unit.collected_date = u.collected_date,
              unit.expiry_date = u.expiry_date,
              unit.status = u.status
        `, { units: paramUnits });
      }

      // Step F: Upsert (MERGE) DonationEvent nodes & recreate relationships
      if (paramEvents.length > 0) {
        await tx.run(`
          UNWIND $events AS e
          MERGE (ev:DonationEvent {event_id: e.event_id})
          SET ev.event_date = e.event_date,
              ev.event_time = e.event_time,
              ev.notes = e.notes
        `, { events: paramEvents });

        await tx.run(`
          UNWIND $events AS e
          MATCH (d:Donor {donor_id: e.donor_id})
          MATCH (ev:DonationEvent {event_id: e.event_id})
          CREATE (d)-[:DONATES]->(ev)
        `, { events: paramEvents });

        await tx.run(`
          UNWIND $events AS e
          MATCH (ev:DonationEvent {event_id: e.event_id})
          MATCH (b:BloodBank {bank_id: e.bank_id})
          CREATE (ev)-[:RECEIVED_AT]->(b)
        `, { events: paramEvents });

        await tx.run(`
          UNWIND $events AS e
          WITH e WHERE e.unit_id IS NOT NULL
          MATCH (ev:DonationEvent {event_id: e.event_id})
          MATCH (u:BloodUnit {unit_id: e.unit_id})
          CREATE (ev)-[:GENERATES]->(u)
        `, { events: paramEvents });
      }

      // Step G: Upsert (MERGE) BloodTest nodes & recreate HAS_TEST relationships
      if (paramTests.length > 0) {
        await tx.run(`
          UNWIND $tests AS t
          MERGE (bt:BloodTest {test_id: t.test_id})
          SET bt.test_type = t.test_type,
              bt.tested_date = t.tested_date,
              bt.result = t.result
        `, { tests: paramTests });

        await tx.run(`
          UNWIND $tests AS t
          MATCH (ev:DonationEvent {event_id: t.event_id})
          MATCH (bt:BloodTest {test_id: t.test_id})
          CREATE (ev)-[:HAS_TEST]->(bt)
        `, { tests: paramTests });
      }
    });

    // Gather node counts
    const nodeCountsResult = await session.run(`
      MATCH (n)
      RETURN labels(n)[0] AS label, count(n) AS cnt
    `);
    const nodeCounts = { total: 0, Donor: 0, DonationEvent: 0, BloodUnit: 0, BloodTest: 0, BloodBank: 0 };
    nodeCountsResult.records.forEach(r => {
      const label = r.get('label');
      const count = toNative(r.get('cnt'));
      if (nodeCounts[label] !== undefined) {
        nodeCounts[label] = count;
      }
      nodeCounts.total += count;
    });

    // Gather relationship counts
    const relCountsResult = await session.run(`
      MATCH ()-[r]->()
      RETURN type(r) AS relType, count(r) AS cnt
    `);
    const relationshipCounts = { total: 0, DONATES: 0, RECEIVED_AT: 0, GENERATES: 0, HAS_TEST: 0 };
    relCountsResult.records.forEach(r => {
      const relType = r.get('relType');
      const count = toNative(r.get('cnt'));
      if (relationshipCounts[relType] !== undefined) {
        relationshipCounts[relType] = count;
      }
      relationshipCounts.total += count;
    });

    lastSyncMetadata = {
      lastSyncTime: new Date().toISOString(),
      nodeCounts,
      relationshipCounts
    };

    return {
      success: true,
      message: 'Graph projection synchronized successfully.',
      ...lastSyncMetadata
    };
  } finally {
    isSyncing = false;
    if (session) {
      await session.close().catch(() => {});
    }
  }
}

/**
 * Returns current status of graph projection.
 */
async function getGraphStatus() {
  let session = null;
  try {
    session = getSession(neo4j.session.READ);
    const result = await session.run(`
      RETURN 1 AS connected
    `);
    const isOnline = result.records.length > 0;

    return {
      success: true,
      status: isOnline ? 'connected' : 'unavailable',
      connected: isOnline,
      lastSyncTime: lastSyncMetadata.lastSyncTime,
      nodeCounts: lastSyncMetadata.nodeCounts,
      relationshipCounts: lastSyncMetadata.relationshipCounts
    };
  } catch (err) {
    return {
      success: true,
      status: 'unavailable',
      connected: false,
      message: 'Neo4j service is offline or unreachable.',
      lastSyncTime: lastSyncMetadata.lastSyncTime,
      nodeCounts: lastSyncMetadata.nodeCounts,
      relationshipCounts: lastSyncMetadata.relationshipCounts
    };
  } finally {
    if (session) {
      await session.close().catch(() => {});
    }
  }
}

/**
 * Trace by Unit ID:
 * End-to-end traceability path from BloodUnit back to DonationEvent, BloodBank, BloodTests, and Donor.
 * Donor personal display information is fetched securely from MySQL.
 */
async function traceByUnitId(unitId) {
  const numericUnitId = Number(unitId);
  if (!numericUnitId || isNaN(numericUnitId)) {
    const err = new Error('Invalid blood unit ID.');
    err.statusCode = 400;
    throw err;
  }

  // Authoritative check in MySQL
  const [unitRows] = await pool.query(
    'SELECT unit_id, bank_id, unit_code, blood_group, volume_ml, collected_date, expiry_date, status FROM blood_unit WHERE unit_id = ?',
    [numericUnitId]
  );

  if (unitRows.length === 0) {
    const err = new Error(`Blood unit ID ${numericUnitId} not found.`);
    err.statusCode = 404;
    throw err;
  }

  const mysqlUnit = unitRows[0];
  let session = null;

  try {
    // Attempt to open a session – driver not configured → offline mode.
    try {
      session = getSession(neo4j.session.READ);
    } catch (driverErr) {
      console.warn('[traceByUnitId] Neo4j driver unavailable:', driverErr.message);
      return {
        unit: mysqlUnit,
        donationEvent: null,
        donor: null,
        bloodBank: null,
        bloodTests: [],
        projectionSynced: false,
        projectionAvailable: false,
        message: 'Graph projection unavailable. Unit data sourced from MySQL only.'
      };
    }

    let cypherResult;
    try {
      cypherResult = await session.run(`
        MATCH (u:BloodUnit {unit_id: $unitId})
        OPTIONAL MATCH (ev:DonationEvent)-[:GENERATES]->(u)
        OPTIONAL MATCH (d:Donor)-[:DONATES]->(ev)
        OPTIONAL MATCH (ev)-[:RECEIVED_AT]->(b:BloodBank)
        OPTIONAL MATCH (ev)-[:HAS_TEST]->(t:BloodTest)
        RETURN u AS unit,
               ev AS donationEvent,
               d.donor_id AS donorId,
               d.blood_group AS donorBloodGroup,
               b AS bloodBank,
               collect(DISTINCT t) AS bloodTests
      `, { unitId: safeInt(numericUnitId) });
    } catch (queryErr) {
      // Network failure, auth error, or Aura timeout – do not leak details.
      console.warn('[traceByUnitId] Neo4j query failed:', queryErr.message);
      return {
        unit: mysqlUnit,
        donationEvent: null,
        donor: null,
        bloodBank: null,
        bloodTests: [],
        projectionSynced: false,
        projectionAvailable: false,
        message: 'Graph projection query failed. Unit data sourced from MySQL only.'
      };
    }

    if (cypherResult.records.length === 0) {
      // The BloodUnit node is absent from the projection – not yet synced.
      return {
        unit: mysqlUnit,
        donationEvent: null,
        donor: null,
        bloodBank: null,
        bloodTests: [],
        projectionSynced: false,
        projectionAvailable: true,
        message: 'Blood unit not yet present in graph projection. Run /api/graph/sync.'
      };
    }

    const record = cypherResult.records[0];
    const unitNode = toNative(record.get('unit'));
    const eventNode = toNative(record.get('donationEvent'));
    const donorId = toNative(record.get('donorId'));
    const donorBloodGroup = toNative(record.get('donorBloodGroup'));
    const bankNode = toNative(record.get('bloodBank'));
    const tests = toNative(record.get('bloodTests')) || [];

    let donorDisplay = null;
    if (donorId) {
      // Fetch donor display info from the authoritative MySQL source.
      // email and phone are included here; the controller applies
      // role-based PII policy before sending to the client.
      const [donorRows] = await pool.query(
        'SELECT donor_id, first_name, last_name, email, phone, blood_group FROM donor WHERE donor_id = ?',
        [donorId]
      );
      if (donorRows.length > 0) {
        const d = donorRows[0];
        donorDisplay = {
          donor_id: d.donor_id,
          name: `${d.first_name} ${d.last_name}`,
          email: d.email,
          phone: d.phone,
          blood_group: d.blood_group
        };
      } else {
        donorDisplay = {
          donor_id: donorId,
          blood_group: donorBloodGroup
        };
      }
    }

    return {
      unit: unitNode || mysqlUnit,
      donationEvent: eventNode,
      donor: donorDisplay,
      bloodBank: bankNode,
      bloodTests: tests,
      projectionSynced: true,
      projectionAvailable: true
    };
  } finally {
    if (session) {
      await session.close().catch(() => {});
    }
  }
}

/**
 * Trace by Donor ID:
 * Traceability path from Donor to all DonationEvents, BloodBanks, BloodUnits, and BloodTests.
 * Zero-donation donors return a valid empty trace.
 * Unknown IDs return 404.
 */
async function traceByDonorId(donorId) {
  const numericDonorId = Number(donorId);
  if (!numericDonorId || isNaN(numericDonorId)) {
    const err = new Error('Invalid donor ID.');
    err.statusCode = 400;
    throw err;
  }

  // Authoritative check in MySQL
  const [donorRows] = await pool.query(
    'SELECT donor_id, first_name, last_name, email, phone, blood_group FROM donor WHERE donor_id = ?',
    [numericDonorId]
  );

  if (donorRows.length === 0) {
    const err = new Error(`Donor ID ${numericDonorId} not found.`);
    err.statusCode = 404;
    throw err;
  }

  const mysqlDonorRow = donorRows[0];
  const donorDisplay = {
    donor_id: mysqlDonorRow.donor_id,
    name: `${mysqlDonorRow.first_name} ${mysqlDonorRow.last_name}`,
    email: mysqlDonorRow.email,
    phone: mysqlDonorRow.phone,
    blood_group: mysqlDonorRow.blood_group
  };

  let session = null;
  try {
    // Attempt to open a session – driver not configured → offline mode.
    // IMPORTANT: returning totalDonations:0 with projectionSynced:false
    // must never be interpreted as a confirmed "no donations" result.
    try {
      session = getSession(neo4j.session.READ);
    } catch (driverErr) {
      console.warn('[traceByDonorId] Neo4j driver unavailable:', driverErr.message);
      return {
        donor: donorDisplay,
        projectionSynced: false,
        projectionAvailable: false,
        donations: null,  // null signals "unknown", not confirmed zero
        message: 'Graph projection unavailable. Donor identity confirmed via MySQL; donation graph data not available.'
      };
    }

    let cypherResult;
    try {
      cypherResult = await session.run(`
        MATCH (d:Donor {donor_id: $donorId})
        OPTIONAL MATCH (d)-[:DONATES]->(ev:DonationEvent)
        OPTIONAL MATCH (ev)-[:RECEIVED_AT]->(b:BloodBank)
        OPTIONAL MATCH (ev)-[:GENERATES]->(u:BloodUnit)
        OPTIONAL MATCH (ev)-[:HAS_TEST]->(t:BloodTest)
        WITH d, ev, b, u, collect(DISTINCT t) AS tests
        ORDER BY ev.event_date DESC
        RETURN ev AS donationEvent,
               b AS bloodBank,
               u AS bloodUnit,
               tests AS bloodTests
      `, { donorId: safeInt(numericDonorId) });
    } catch (queryErr) {
      // Network failure, auth error, or Aura timeout – do not leak details.
      console.warn('[traceByDonorId] Neo4j query failed:', queryErr.message);
      return {
        donor: donorDisplay,
        projectionSynced: false,
        projectionAvailable: false,
        donations: null,  // null signals "unknown", not confirmed zero
        message: 'Graph projection query failed. Donor identity confirmed via MySQL; donation graph data not available.'
      };
    }

    // If the Donor node is missing from the projection the query returns
    // zero rows (no MATCH on d:Donor).  Distinguish from a confirmed
    // empty donation history (rows returned but all donationEvent = null).
    const donorNodeAbsent = cypherResult.records.length === 0;
    if (donorNodeAbsent) {
      return {
        donor: donorDisplay,
        projectionSynced: false,
        projectionAvailable: true,
        donations: null,  // null signals "unknown", not confirmed zero
        message: 'Donor node absent from graph projection. Run /api/graph/sync to populate.'
      };
    }

    const donations = [];
    for (const record of cypherResult.records) {
      const eventNode = toNative(record.get('donationEvent'));
      if (eventNode) {
        donations.push({
          donationEvent: eventNode,
          bloodBank: toNative(record.get('bloodBank')),
          bloodUnit: toNative(record.get('bloodUnit')),
          bloodTests: toNative(record.get('bloodTests')) || []
        });
      }
    }

    return {
      donor: donorDisplay,
      totalDonations: donations.length,
      donations,
      projectionSynced: true,
      projectionAvailable: true
    };
  } finally {
    if (session) {
      await session.close().catch(() => {});
    }
  }
}

module.exports = {
  syncGraph,
  getGraphStatus,
  traceByUnitId,
  traceByDonorId
};
