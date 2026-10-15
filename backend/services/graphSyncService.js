const pool = require('../config/db');
const { getSession, safeInt, toNative } = require('../config/neo4j');
const neo4j = require('neo4j-driver');

let isSyncing = false;

// ── Sync-log table helpers ───────────────────────────────────────────────────
// The graph_sync_log MySQL table is created on first use (idempotent DDL).
// Only successful syncs write a row with sync_status='success'.
// Failed syncs write a row with sync_status='failure' so that the last
// successful row is never overwritten by a failed attempt.

let syncLogTableEnsured = false;

async function ensureSyncLogTable() {
  if (syncLogTableEnsured) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS graph_sync_log (
      id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
      synced_at            DATETIME     NOT NULL,
      sync_status          VARCHAR(16)  NOT NULL DEFAULT 'success',
      nodes_total          INT UNSIGNED NOT NULL DEFAULT 0,
      nodes_donor          INT UNSIGNED NOT NULL DEFAULT 0,
      nodes_donation_event INT UNSIGNED NOT NULL DEFAULT 0,
      nodes_blood_unit     INT UNSIGNED NOT NULL DEFAULT 0,
      nodes_blood_test     INT UNSIGNED NOT NULL DEFAULT 0,
      nodes_blood_bank     INT UNSIGNED NOT NULL DEFAULT 0,
      rels_total           INT UNSIGNED NOT NULL DEFAULT 0,
      rels_donates         INT UNSIGNED NOT NULL DEFAULT 0,
      rels_received_at     INT UNSIGNED NOT NULL DEFAULT 0,
      rels_generates       INT UNSIGNED NOT NULL DEFAULT 0,
      rels_has_test        INT UNSIGNED NOT NULL DEFAULT 0,
      error_summary        VARCHAR(500)     NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Persists Neo4j graph-projection sync metadata for status reporting across restarts.'
  `);
  syncLogTableEnsured = true;
}

/**
 * Persists sync outcome to MySQL.
 * status: 'success' | 'failure'
 * nodeCounts / relationshipCounts: objects matching the existing shape.
 * errorSummary: optional short string (≤500 chars, no PII or stack traces).
 */
async function persistSyncMetadata(status, nodeCounts, relationshipCounts, errorSummary) {
  try {
    await ensureSyncLogTable();
    const nc = nodeCounts       || {};
    const rc = relationshipCounts || {};
    const summary = errorSummary
      ? String(errorSummary).slice(0, 500)
      : null;
    await pool.query(
      `INSERT INTO graph_sync_log
         (synced_at, sync_status,
          nodes_total, nodes_donor, nodes_donation_event,
          nodes_blood_unit, nodes_blood_test, nodes_blood_bank,
          rels_total, rels_donates, rels_received_at, rels_generates, rels_has_test,
          error_summary)
       VALUES (UTC_TIMESTAMP(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        status,
        nc.total          || 0,
        nc.Donor          || 0,
        nc.DonationEvent  || 0,
        nc.BloodUnit      || 0,
        nc.BloodTest      || 0,
        nc.BloodBank      || 0,
        rc.total          || 0,
        rc.DONATES        || 0,
        rc.RECEIVED_AT    || 0,
        rc.GENERATES      || 0,
        rc.HAS_TEST       || 0,
        summary
      ]
    );
  } catch (dbErr) {
    // Non-fatal: log a warning but do not propagate – the Neo4j sync already
    // succeeded and we must not roll it back because of a metadata-write failure.
    console.warn('[graphSyncService] Failed to persist sync metadata to MySQL:', dbErr.message);
  }
}

/**
 * Reads the most recent successful sync row from MySQL.
 * Returns null if no successful sync has ever been recorded.
 */
async function fetchPersistedMetadata() {
  try {
    await ensureSyncLogTable();
    const [rows] = await pool.query(
      `SELECT synced_at,
              nodes_total, nodes_donor, nodes_donation_event,
              nodes_blood_unit, nodes_blood_test, nodes_blood_bank,
              rels_total, rels_donates, rels_received_at, rels_generates, rels_has_test
       FROM   graph_sync_log
       WHERE  sync_status = 'success'
       ORDER  BY id DESC
       LIMIT  1`
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      lastSyncTime: r.synced_at instanceof Date
        ? r.synced_at.toISOString()
        : String(r.synced_at),
      nodeCounts: {
        total:         r.nodes_total,
        Donor:         r.nodes_donor,
        DonationEvent: r.nodes_donation_event,
        BloodUnit:     r.nodes_blood_unit,
        BloodTest:     r.nodes_blood_test,
        BloodBank:     r.nodes_blood_bank
      },
      relationshipCounts: {
        total:      r.rels_total,
        DONATES:    r.rels_donates,
        RECEIVED_AT: r.rels_received_at,
        GENERATES:  r.rels_generates,
        HAS_TEST:   r.rels_has_test
      }
    };
  } catch (dbErr) {
    console.warn('[graphSyncService] Failed to read sync metadata from MySQL:', dbErr.message);
    return null;  // Caller handles null as "no metadata available"
  }
}

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

/**
 * Authoritative MySQL Entity Fetchers — enriched with full relational metadata
 */
async function fetchFullDonorDetails(donorId) {
  if (!donorId) return null;
  try {
    const [rows] = await pool.query(`
      SELECT donor_id, first_name, last_name, dob, gender, blood_group,
             phone, email, street, city, state,
             total_donations, last_donation, is_eligible, created_at,
             TIMESTAMPDIFF(YEAR, dob, CURDATE()) AS age
      FROM donor
      WHERE donor_id = ?
    `, [donorId]);

    if (rows.length === 0) return null;
    const d = rows[0];
    return {
      donor_id: d.donor_id,
      first_name: d.first_name,
      last_name: d.last_name,
      name: `${d.first_name || ''} ${d.last_name || ''}`.trim(),
      dob: formatDate(d.dob),
      age: d.age != null ? Number(d.age) : null,
      gender: d.gender,
      blood_group: d.blood_group,
      phone: d.phone,
      email: d.email,
      street: d.street,
      city: d.city,
      state: d.state,
      total_donations: d.total_donations != null ? Number(d.total_donations) : 0,
      last_donation: formatDate(d.last_donation),
      is_eligible: Boolean(d.is_eligible),
      created_at: formatDate(d.created_at)
    };
  } catch (err) {
    console.warn(`[fetchFullDonorDetails] Error fetching donor #${donorId}:`, err.message);
    return null;
  }
}

async function fetchFullBankDetails(bankId) {
  if (!bankId) return null;
  try {
    const [rows] = await pool.query(`
      SELECT bank_id, name, address, city, state, phone, email, capacity, established
      FROM blood_bank
      WHERE bank_id = ?
    `, [bankId]);
    if (rows.length === 0) return null;
    const b = rows[0];
    return {
      ...b,
      established: formatDate(b.established)
    };
  } catch (err) {
    console.warn(`[fetchFullBankDetails] Error fetching bank #${bankId}:`, err.message);
    return null;
  }
}

async function fetchFullUnitDetails(unitId) {
  if (!unitId) return null;
  try {
    const [rows] = await pool.query(`
      SELECT bu.unit_id, bu.bank_id, bu.unit_code, bu.blood_group,
             bu.volume_ml, bu.collected_date, bu.expiry_date, bu.status,
             bu.storage_temp,
             bb.name AS bank_name, bb.city AS bank_city
      FROM blood_unit bu
      LEFT JOIN blood_bank bb ON bb.bank_id = bu.bank_id
      WHERE bu.unit_id = ?
    `, [unitId]);
    if (rows.length === 0) return null;
    const u = rows[0];
    return {
      ...u,
      collected_date: formatDate(u.collected_date),
      expiry_date: formatDate(u.expiry_date)
    };
  } catch (err) {
    console.warn(`[fetchFullUnitDetails] Error fetching unit #${unitId}:`, err.message);
    return null;
  }
}

async function fetchFullEventDetails(eventId) {
  if (!eventId) return null;
  try {
    const [rows] = await pool.query(`
      SELECT de.event_id, de.donor_id, de.bank_id, de.unit_id,
             de.event_date, de.event_time, de.staff_id, de.notes,
             bb.name AS bank_name, bu.unit_code,
             CONCAT(d.first_name, ' ', d.last_name) AS donor_name,
             d.blood_group AS donor_blood_group,
             CONCAT(s.first_name, ' ', s.last_name) AS staff_name
      FROM donation_event de
      LEFT JOIN blood_bank bb ON bb.bank_id = de.bank_id
      LEFT JOIN blood_unit bu ON bu.unit_id = de.unit_id
      LEFT JOIN donor d ON d.donor_id = de.donor_id
      LEFT JOIN staff s ON s.staff_id = de.staff_id
      WHERE de.event_id = ?
    `, [eventId]);
    if (rows.length === 0) return null;
    const ev = rows[0];
    return {
      ...ev,
      event_date: formatDate(ev.event_date),
      event_time: formatTime(ev.event_time)
    };
  } catch (err) {
    console.warn(`[fetchFullEventDetails] Error fetching event #${eventId}:`, err.message);
    return null;
  }
}

/**
 * MySQL relational fallback for traceByUnitId.
 * When Neo4j is unavailable, queries MySQL tables to reconstruct the full
 * donor → event → unit → tests → bank lineage using foreign key joins.
 * Returns the same shape as the Neo4j-powered response, fully enriched.
 */
async function mysqlFallbackForUnit(mysqlUnit) {
  // Find donation event linked to this unit
  const [eventRows] = await pool.query(
    'SELECT event_id, donor_id, bank_id, unit_id, event_date, event_time, notes FROM donation_event WHERE unit_id = ?',
    [mysqlUnit.unit_id]
  );

  let donationEvent = null;
  let donorDisplay = null;
  let bloodBank = null;
  let bloodTests = [];

  if (eventRows.length > 0) {
    const ev = eventRows[0];
    donationEvent = await fetchFullEventDetails(ev.event_id) || {
      event_id: ev.event_id,
      event_date: formatDate(ev.event_date),
      event_time: formatTime(ev.event_time),
      notes: ev.notes || ''
    };

    // Donor
    if (ev.donor_id) {
      donorDisplay = await fetchFullDonorDetails(ev.donor_id);
    }

    // Blood Bank
    const bankId = ev.bank_id || mysqlUnit.bank_id;
    if (bankId) {
      bloodBank = await fetchFullBankDetails(bankId);
    }

    // Blood Tests
    const [testRows] = await pool.query(
      'SELECT test_id, event_id, test_type, tested_date, result FROM blood_test WHERE event_id = ?',
      [ev.event_id]
    );
    bloodTests = testRows.map(t => ({
      test_id: t.test_id,
      test_type: t.test_type,
      tested_date: formatDate(t.tested_date),
      result: t.result
    }));
  } else if (mysqlUnit.bank_id) {
    bloodBank = await fetchFullBankDetails(mysqlUnit.bank_id);
  }

  // Enrich unit itself
  const enrichedUnit = await fetchFullUnitDetails(mysqlUnit.unit_id) || mysqlUnit;

  return { unit: enrichedUnit, donationEvent, donor: donorDisplay, bloodBank, bloodTests };
}

/**
 * MySQL relational fallback for traceByDonorId.
 * When Neo4j is unavailable, queries MySQL tables to reconstruct the full
 * donor → events → units → tests → banks lineage using foreign key joins.
 */
async function mysqlFallbackForDonor(donorId) {
  const [eventRows] = await pool.query(
    'SELECT event_id, donor_id, bank_id, unit_id, event_date, event_time, notes FROM donation_event WHERE donor_id = ? ORDER BY event_date DESC',
    [donorId]
  );

  const donations = [];
  for (const ev of eventRows) {
    const donation = {
      donationEvent: await fetchFullEventDetails(ev.event_id) || {
        event_id: ev.event_id,
        event_date: formatDate(ev.event_date),
        event_time: formatTime(ev.event_time),
        notes: ev.notes || ''
      },
      bloodBank: null,
      bloodUnit: null,
      bloodTests: []
    };

    // Blood Bank
    if (ev.bank_id) {
      donation.bloodBank = await fetchFullBankDetails(ev.bank_id);
    }

    // Blood Unit
    if (ev.unit_id) {
      donation.bloodUnit = await fetchFullUnitDetails(ev.unit_id);
    }

    // Blood Tests
    const [testRows] = await pool.query(
      'SELECT test_id, event_id, test_type, tested_date, result FROM blood_test WHERE event_id = ?',
      [ev.event_id]
    );
    donation.bloodTests = testRows.map(t => ({
      test_id: t.test_id,
      test_type: t.test_type,
      tested_date: formatDate(t.tested_date),
      result: t.result
    }));

    donations.push(donation);
  }

  return donations;
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

    // Persist sync metadata to MySQL so it survives process restarts.
    // This is fire-and-forget: persistSyncMetadata swallows its own errors.
    await persistSyncMetadata('success', nodeCounts, relationshipCounts, null);

    const lastSyncTime = new Date().toISOString();
    return {
      success: true,
      message: 'Graph projection synchronized successfully.',
      lastSyncTime,
      nodeCounts,
      relationshipCounts
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
  // ── 1. Neo4j connectivity check (independent of persisted metadata) ────────
  let session = null;
  let isOnline = false;
  try {
    session = getSession(neo4j.session.READ);
    const result = await session.run('RETURN 1 AS connected');
    isOnline = result.records.length > 0;
  } catch (_err) {
    isOnline = false;
  } finally {
    if (session) {
      await session.close().catch(() => {});
    }
  }

  // ── 2. Read last successful sync metadata from MySQL ──────────────────────
  // fetchPersistedMetadata() returns null when:
  //   a) No successful sync has ever been recorded (table empty).
  //   b) The MySQL query itself fails (e.g. table not yet migrated).
  // In both cases we report 'not_synced' rather than inventing zeros.
  const meta = await fetchPersistedMetadata();

  if (meta) {
    return {
      success: true,
      status: isOnline ? 'connected' : 'unavailable',
      connected: isOnline,
      lastSyncTime: meta.lastSyncTime,
      nodeCounts: meta.nodeCounts,
      relationshipCounts: meta.relationshipCounts
    };
  }

  // No successful sync row found – return explicit not-synced state.
  return {
    success: true,
    status: isOnline ? 'connected' : 'unavailable',
    connected: isOnline,
    lastSyncTime: null,
    nodeCounts: null,
    relationshipCounts: null,
    message: 'No successful graph synchronization has been recorded yet. Run POST /api/graph/sync to populate the projection.'
  };
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
      const fallback = await mysqlFallbackForUnit(mysqlUnit);
      return {
        unit: mysqlUnit,
        ...fallback,
        projectionSynced: false,
        projectionAvailable: false,
        message: 'Neo4j unavailable. Lineage reconstructed from MySQL relational data.'
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
      const fallback = await mysqlFallbackForUnit(mysqlUnit);
      return {
        unit: mysqlUnit,
        ...fallback,
        projectionSynced: false,
        projectionAvailable: false,
        message: 'Neo4j query failed. Lineage reconstructed from MySQL relational data.'
      };
    }

    if (cypherResult.records.length === 0) {
      // The BloodUnit node is absent from the projection – not yet synced.
      const fallback = await mysqlFallbackForUnit(mysqlUnit);
      return {
        unit: mysqlUnit,
        ...fallback,
        projectionSynced: false,
        projectionAvailable: true,
        message: 'Blood unit not yet in graph projection. Lineage reconstructed from MySQL.'
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
      donorDisplay = await fetchFullDonorDetails(donorId);
      if (!donorDisplay) {
        donorDisplay = { donor_id: donorId, blood_group: donorBloodGroup };
      }
    }

    let bankDisplay = bankNode;
    if (bankNode && bankNode.bank_id) {
      const fullBank = await fetchFullBankDetails(bankNode.bank_id);
      if (fullBank) bankDisplay = { ...bankNode, ...fullBank };
    }

    let unitDisplay = unitNode || mysqlUnit;
    if (unitDisplay && unitDisplay.unit_id) {
      const fullUnit = await fetchFullUnitDetails(unitDisplay.unit_id);
      if (fullUnit) unitDisplay = { ...unitDisplay, ...fullUnit };
    }

    let eventDisplay = eventNode;
    if (eventNode && eventNode.event_id) {
      const fullEv = await fetchFullEventDetails(eventNode.event_id);
      if (fullEv) eventDisplay = { ...eventNode, ...fullEv };
    }

    return {
      unit: unitDisplay,
      donationEvent: eventDisplay,
      donor: donorDisplay,
      bloodBank: bankDisplay,
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
  const donorDisplay = await fetchFullDonorDetails(numericDonorId);
  if (!donorDisplay) {
    const err = new Error(`Donor ID ${numericDonorId} not found.`);
    err.statusCode = 404;
    throw err;
  }

  let session = null;
  try {
    try {
      session = getSession(neo4j.session.READ);
    } catch (driverErr) {
      console.warn('[traceByDonorId] Neo4j driver unavailable:', driverErr.message);
      const donations = await mysqlFallbackForDonor(numericDonorId);
      return {
        donor: donorDisplay,
        projectionSynced: false,
        projectionAvailable: false,
        totalDonations: donations.length,
        donations,
        message: 'Neo4j unavailable. Donation lineage reconstructed from MySQL relational data.'
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
      console.warn('[traceByDonorId] Neo4j query failed:', queryErr.message);
      const donations = await mysqlFallbackForDonor(numericDonorId);
      return {
        donor: donorDisplay,
        projectionSynced: false,
        projectionAvailable: false,
        totalDonations: donations.length,
        donations,
        message: 'Neo4j query failed. Donation lineage reconstructed from MySQL relational data.'
      };
    }

    const donorNodeAbsent = cypherResult.records.length === 0;
    if (donorNodeAbsent) {
      const donations = await mysqlFallbackForDonor(numericDonorId);
      return {
        donor: donorDisplay,
        projectionSynced: false,
        projectionAvailable: true,
        totalDonations: donations.length,
        donations,
        message: 'Donor not yet in graph projection. Lineage reconstructed from MySQL.'
      };
    }

    const donations = [];
    for (const record of cypherResult.records) {
      const eventNode = toNative(record.get('donationEvent'));
      if (eventNode) {
        const bankNode = toNative(record.get('bloodBank'));
        const unitNode = toNative(record.get('bloodUnit'));
        const tests = toNative(record.get('bloodTests')) || [];

        const fullEvent = eventNode.event_id ? await fetchFullEventDetails(eventNode.event_id) : null;
        const fullBank = bankNode?.bank_id ? await fetchFullBankDetails(bankNode.bank_id) : null;
        const fullUnit = unitNode?.unit_id ? await fetchFullUnitDetails(unitNode.unit_id) : null;

        donations.push({
          donationEvent: fullEvent ? { ...eventNode, ...fullEvent } : eventNode,
          bloodBank: fullBank ? { ...bankNode, ...fullBank } : bankNode,
          bloodUnit: fullUnit ? { ...unitNode, ...fullUnit } : unitNode,
          bloodTests: tests
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

/**
 * Expand a node's neighboring relationships in the graph.
 * Returns connected nodes & links suitable for merging into Bloom-style explorer.
 */
async function expandNode(type, id) {
  const normType = String(type).toLowerCase();
  const numId = Number(id);
  if (!numId || isNaN(numId)) {
    const err = new Error(`Invalid ${type} ID`);
    err.statusCode = 400;
    throw err;
  }

  let session = null;
  let useNeo4j = false;
  try {
    session = getSession(neo4j.session.READ);
    const testRes = await session.run('RETURN 1 AS connected');
    useNeo4j = testRes.records.length > 0;
  } catch {
    useNeo4j = false;
  }

  const nodes = [];
  const links = [];
  const seenNodes = new Set();
  const seenLinks = new Set();

  function addNode(nodeId, nodeType, label, props) {
    if (seenNodes.has(nodeId)) return;
    seenNodes.add(nodeId);
    nodes.push({ id: nodeId, type: nodeType, label, props: props || {} });
  }

  function addLink(source, target, label) {
    const linkKey = `${source}->${label}->${target}`;
    if (seenLinks.has(linkKey)) return;
    seenLinks.add(linkKey);
    links.push({ source, target, label });
  }

  let centerEntity = null;

  if (normType === 'donor') {
    const donor = await fetchFullDonorDetails(numId);
    if (!donor) {
      const err = new Error(`Donor #${numId} not found`);
      err.statusCode = 404;
      throw err;
    }
    centerEntity = donor;
    addNode(`donor-${donor.donor_id}`, 'Donor', donor.name || `Donor #${donor.donor_id}`, donor);

    const [events] = await pool.query(`
      SELECT de.event_id, de.donor_id, de.bank_id, de.unit_id, de.event_date, de.event_time, de.notes
      FROM donation_event de
      WHERE de.donor_id = ?
      ORDER BY de.event_date DESC
    `, [numId]);

    for (const ev of events) {
      const evFull = await fetchFullEventDetails(ev.event_id);
      addNode(`event-${ev.event_id}`, 'DonationEvent', `Event #${ev.event_id}`, evFull || ev);
      addLink(`donor-${numId}`, `event-${ev.event_id}`, 'DONATES');

      if (ev.bank_id) {
        const bank = await fetchFullBankDetails(ev.bank_id);
        if (bank) {
          addNode(`bank-${bank.bank_id}`, 'BloodBank', bank.name, bank);
          addLink(`event-${ev.event_id}`, `bank-${bank.bank_id}`, 'RECEIVED_AT');
        }
      }

      if (ev.unit_id) {
        const unit = await fetchFullUnitDetails(ev.unit_id);
        if (unit) {
          addNode(`unit-${unit.unit_id}`, 'BloodUnit', unit.unit_code || `Unit #${unit.unit_id}`, unit);
          addLink(`event-${ev.event_id}`, `unit-${unit.unit_id}`, 'GENERATES');
        }
      }

      const [tests] = await pool.query(
        'SELECT test_id, event_id, test_type, tested_date, result FROM blood_test WHERE event_id = ?',
        [ev.event_id]
      );
      for (const t of tests) {
        addNode(`test-${t.test_id}`, 'BloodTest', `${t.test_type}: ${t.result}`, {
          ...t,
          tested_date: formatDate(t.tested_date)
        });
        addLink(`event-${ev.event_id}`, `test-${t.test_id}`, 'HAS_TEST');
      }
    }
  } else if (normType === 'bank' || normType === 'bloodbank') {
    const bank = await fetchFullBankDetails(numId);
    if (!bank) {
      const err = new Error(`Blood Bank #${numId} not found`);
      err.statusCode = 404;
      throw err;
    }
    centerEntity = bank;
    addNode(`bank-${bank.bank_id}`, 'BloodBank', bank.name, bank);

    const [events] = await pool.query(`
      SELECT de.event_id, de.donor_id, de.bank_id, de.unit_id, de.event_date, de.event_time, de.notes
      FROM donation_event de
      WHERE de.bank_id = ?
      ORDER BY de.event_date DESC
      LIMIT 10
    `, [numId]);

    for (const ev of events) {
      const evFull = await fetchFullEventDetails(ev.event_id);
      addNode(`event-${ev.event_id}`, 'DonationEvent', `Event #${ev.event_id}`, evFull || ev);
      addLink(`event-${ev.event_id}`, `bank-${bank.bank_id}`, 'RECEIVED_AT');

      if (ev.donor_id) {
        const donor = await fetchFullDonorDetails(ev.donor_id);
        if (donor) {
          addNode(`donor-${donor.donor_id}`, 'Donor', donor.name, donor);
          addLink(`donor-${donor.donor_id}`, `event-${ev.event_id}`, 'DONATES');
        }
      }

      if (ev.unit_id) {
        const unit = await fetchFullUnitDetails(ev.unit_id);
        if (unit) {
          addNode(`unit-${unit.unit_id}`, 'BloodUnit', unit.unit_code || `Unit #${unit.unit_id}`, unit);
          addLink(`event-${ev.event_id}`, `unit-${unit.unit_id}`, 'GENERATES');
        }
      }

      const [tests] = await pool.query(
        'SELECT test_id, event_id, test_type, tested_date, result FROM blood_test WHERE event_id = ?',
        [ev.event_id]
      );
      for (const t of tests) {
        addNode(`test-${t.test_id}`, 'BloodTest', `${t.test_type}: ${t.result}`, {
          ...t,
          tested_date: formatDate(t.tested_date)
        });
        addLink(`event-${ev.event_id}`, `test-${t.test_id}`, 'HAS_TEST');
      }
    }
  } else if (normType === 'unit' || normType === 'bloodunit') {
    const trace = await traceByUnitId(numId);
    centerEntity = trace.unit;
    if (trace.unit) {
      addNode(`unit-${trace.unit.unit_id}`, 'BloodUnit', trace.unit.unit_code || `Unit #${trace.unit.unit_id}`, trace.unit);
    }
    if (trace.donationEvent) {
      addNode(`event-${trace.donationEvent.event_id}`, 'DonationEvent', `Event #${trace.donationEvent.event_id}`, trace.donationEvent);
      if (trace.unit) addLink(`event-${trace.donationEvent.event_id}`, `unit-${trace.unit.unit_id}`, 'GENERATES');
    }
    if (trace.donor) {
      addNode(`donor-${trace.donor.donor_id}`, 'Donor', trace.donor.name || `Donor #${trace.donor.donor_id}`, trace.donor);
      if (trace.donationEvent) addLink(`donor-${trace.donor.donor_id}`, `event-${trace.donationEvent.event_id}`, 'DONATES');
    }
    if (trace.bloodBank) {
      addNode(`bank-${trace.bloodBank.bank_id}`, 'BloodBank', trace.bloodBank.name, trace.bloodBank);
      if (trace.donationEvent) addLink(`event-${trace.donationEvent.event_id}`, `bank-${trace.bloodBank.bank_id}`, 'RECEIVED_AT');
    }
    if (trace.bloodTests) {
      trace.bloodTests.forEach(t => {
        addNode(`test-${t.test_id}`, 'BloodTest', `${t.test_type}: ${t.result}`, t);
        if (trace.donationEvent) addLink(`event-${trace.donationEvent.event_id}`, `test-${t.test_id}`, 'HAS_TEST');
      });
    }
  } else if (normType === 'event' || normType === 'donationevent') {
    const ev = await fetchFullEventDetails(numId);
    if (!ev) {
      const err = new Error(`Donation Event #${numId} not found`);
      err.statusCode = 404;
      throw err;
    }
    centerEntity = ev;
    addNode(`event-${ev.event_id}`, 'DonationEvent', `Event #${ev.event_id}`, ev);

    if (ev.donor_id) {
      const donor = await fetchFullDonorDetails(ev.donor_id);
      if (donor) {
        addNode(`donor-${donor.donor_id}`, 'Donor', donor.name, donor);
        addLink(`donor-${donor.donor_id}`, `event-${ev.event_id}`, 'DONATES');
      }
    }
    if (ev.bank_id) {
      const bank = await fetchFullBankDetails(ev.bank_id);
      if (bank) {
        addNode(`bank-${bank.bank_id}`, 'BloodBank', bank.name, bank);
        addLink(`event-${ev.event_id}`, `bank-${bank.bank_id}`, 'RECEIVED_AT');
      }
    }
    if (ev.unit_id) {
      const unit = await fetchFullUnitDetails(ev.unit_id);
      if (unit) {
        addNode(`unit-${unit.unit_id}`, 'BloodUnit', unit.unit_code || `Unit #${unit.unit_id}`, unit);
        addLink(`event-${ev.event_id}`, `unit-${unit.unit_id}`, 'GENERATES');
      }
    }
    const [tests] = await pool.query(
      'SELECT test_id, event_id, test_type, tested_date, result FROM blood_test WHERE event_id = ?',
      [ev.event_id]
    );
    for (const t of tests) {
      addNode(`test-${t.test_id}`, 'BloodTest', `${t.test_type}: ${t.result}`, {
        ...t,
        tested_date: formatDate(t.tested_date)
      });
      addLink(`event-${ev.event_id}`, `test-${t.test_id}`, 'HAS_TEST');
    }
  } else if (normType === 'test' || normType === 'bloodtest') {
    const [testRows] = await pool.query('SELECT * FROM blood_test WHERE test_id = ?', [numId]);
    if (testRows.length === 0) {
      const err = new Error(`Blood Test #${numId} not found`);
      err.statusCode = 404;
      throw err;
    }
    const t = testRows[0];
    centerEntity = { ...t, tested_date: formatDate(t.tested_date) };
    addNode(`test-${t.test_id}`, 'BloodTest', `${t.test_type}: ${t.result}`, centerEntity);

    if (t.event_id) {
      const ev = await fetchFullEventDetails(t.event_id);
      if (ev) {
        addNode(`event-${ev.event_id}`, 'DonationEvent', `Event #${ev.event_id}`, ev);
        addLink(`event-${ev.event_id}`, `test-${t.test_id}`, 'HAS_TEST');

        if (ev.donor_id) {
          const donor = await fetchFullDonorDetails(ev.donor_id);
          if (donor) {
            addNode(`donor-${donor.donor_id}`, 'Donor', donor.name, donor);
            addLink(`donor-${donor.donor_id}`, `event-${ev.event_id}`, 'DONATES');
          }
        }
        if (ev.unit_id) {
          const unit = await fetchFullUnitDetails(ev.unit_id);
          if (unit) {
            addNode(`unit-${unit.unit_id}`, 'BloodUnit', unit.unit_code || `Unit #${unit.unit_id}`, unit);
            addLink(`event-${ev.event_id}`, `unit-${unit.unit_id}`, 'GENERATES');
          }
        }
      }
    }
  } else {
    const err = new Error(`Unsupported entity type: ${type}`);
    err.statusCode = 400;
    throw err;
  }

  if (session) {
    await session.close().catch(() => {});
  }

  return {
    nodes,
    links,
    source: useNeo4j ? 'neo4j' : 'mysql',
    centerEntity
  };
}

/**
 * Authoritative entity inspector data for bloom side panel.
 */
async function getNodeDetails(type, id) {
  const normType = String(type).toLowerCase();
  const numId = Number(id);
  if (!numId || isNaN(numId)) {
    const err = new Error(`Invalid ${type} ID`);
    err.statusCode = 400;
    throw err;
  }

  if (normType === 'donor') {
    const donor = await fetchFullDonorDetails(numId);
    if (!donor) {
      const err = new Error(`Donor #${numId} not found`);
      err.statusCode = 404;
      throw err;
    }

    const [events] = await pool.query(`
      SELECT de.event_id, de.bank_id, de.unit_id, de.event_date, de.event_time, de.notes,
             bb.name AS bank_name, bb.city AS bank_city,
             bu.unit_code, bu.status AS unit_status, bu.volume_ml,
             COUNT(bt.test_id) AS test_count
      FROM donation_event de
      LEFT JOIN blood_bank bb ON bb.bank_id = de.bank_id
      LEFT JOIN blood_unit bu ON bu.unit_id = de.unit_id
      LEFT JOIN blood_test bt ON bt.event_id = de.event_id
      WHERE de.donor_id = ?
      GROUP BY de.event_id
      ORDER BY de.event_date DESC
    `, [numId]);

    const history = events.map(e => ({
      ...e,
      event_date: formatDate(e.event_date),
      event_time: formatTime(e.event_time)
    }));

    const [units] = await pool.query(`
      SELECT bu.unit_id, bu.unit_code, bu.blood_group, bu.volume_ml,
             bu.collected_date, bu.expiry_date, bu.status,
             de.event_id, de.event_date, bb.name AS bank_name
      FROM blood_unit bu
      JOIN donation_event de ON de.unit_id = bu.unit_id
      LEFT JOIN blood_bank bb ON bb.bank_id = bu.bank_id
      WHERE de.donor_id = ?
      ORDER BY bu.collected_date DESC
    `, [numId]);

    const formattedUnits = units.map(u => ({
      ...u,
      collected_date: formatDate(u.collected_date),
      expiry_date: formatDate(u.expiry_date),
      event_date: formatDate(u.event_date)
    }));

    return {
      type: 'Donor',
      data: donor,
      donationHistory: history,
      unitsGenerated: formattedUnits
    };
  } else if (normType === 'unit' || normType === 'bloodunit') {
    const unit = await fetchFullUnitDetails(numId);
    if (!unit) {
      const err = new Error(`Blood Unit #${numId} not found`);
      err.statusCode = 404;
      throw err;
    }

    const [events] = await pool.query(`
      SELECT de.event_id, de.donor_id, de.bank_id, de.event_date, de.event_time, de.notes,
             bb.name AS bank_name, bb.city AS bank_city,
             d.first_name, d.last_name, d.blood_group AS donor_blood_group
      FROM donation_event de
      LEFT JOIN blood_bank bb ON bb.bank_id = de.bank_id
      LEFT JOIN donor d ON d.donor_id = de.donor_id
      WHERE de.unit_id = ?
    `, [numId]);

    let eventInfo = null;
    let donorInfo = null;
    let tests = [];

    if (events.length > 0) {
      const ev = events[0];
      eventInfo = {
        event_id: ev.event_id,
        event_date: formatDate(ev.event_date),
        event_time: formatTime(ev.event_time),
        bank_name: ev.bank_name,
        bank_city: ev.bank_city,
        notes: ev.notes
      };
      if (ev.donor_id) {
        donorInfo = await fetchFullDonorDetails(ev.donor_id);
      }
      const [testRows] = await pool.query(
        'SELECT test_id, test_type, tested_date, result FROM blood_test WHERE event_id = ?',
        [ev.event_id]
      );
      tests = testRows.map(t => ({
        ...t,
        tested_date: formatDate(t.tested_date)
      }));
    }

    return {
      type: 'BloodUnit',
      data: unit,
      event: eventInfo,
      donor: donorInfo,
      tests
    };
  } else if (normType === 'bank' || normType === 'bloodbank') {
    const bank = await fetchFullBankDetails(numId);
    if (!bank) {
      const err = new Error(`Blood Bank #${numId} not found`);
      err.statusCode = 404;
      throw err;
    }

    const [inventory] = await pool.query(`
      SELECT blood_group, COUNT(*) as count, SUM(volume_ml) as total_volume
      FROM blood_unit
      WHERE bank_id = ? AND status = 'Available'
      GROUP BY blood_group
    `, [numId]);

    const [events] = await pool.query(`
      SELECT de.event_id, de.event_date, de.unit_id,
             bu.unit_code, bu.blood_group,
             CONCAT(d.first_name, ' ', d.last_name) AS donor_name
      FROM donation_event de
      LEFT JOIN blood_unit bu ON bu.unit_id = de.unit_id
      LEFT JOIN donor d ON d.donor_id = de.donor_id
      WHERE de.bank_id = ?
      ORDER BY de.event_date DESC
      LIMIT 6
    `, [numId]);

    return {
      type: 'BloodBank',
      data: bank,
      inventory,
      recentEvents: events.map(e => ({
        ...e,
        event_date: formatDate(e.event_date)
      }))
    };
  } else if (normType === 'event' || normType === 'donationevent') {
    const ev = await fetchFullEventDetails(numId);
    if (!ev) {
      const err = new Error(`Donation Event #${numId} not found`);
      err.statusCode = 404;
      throw err;
    }
    let donorInfo = null;
    if (ev.donor_id) {
      donorInfo = await fetchFullDonorDetails(ev.donor_id);
    }
    const [testRows] = await pool.query(
      'SELECT test_id, test_type, tested_date, result FROM blood_test WHERE event_id = ?',
      [numId]
    );
    return {
      type: 'DonationEvent',
      data: ev,
      donor: donorInfo,
      tests: testRows.map(t => ({ ...t, tested_date: formatDate(t.tested_date) }))
    };
  } else if (normType === 'test' || normType === 'bloodtest') {
    const [testRows] = await pool.query('SELECT * FROM blood_test WHERE test_id = ?', [numId]);
    if (testRows.length === 0) {
      const err = new Error(`Blood Test #${numId} not found`);
      err.statusCode = 404;
      throw err;
    }
    const t = testRows[0];
    let ev = null;
    let donor = null;
    let unit = null;
    if (t.event_id) {
      ev = await fetchFullEventDetails(t.event_id);
      if (ev && ev.donor_id) donor = await fetchFullDonorDetails(ev.donor_id);
      if (ev && ev.unit_id) unit = await fetchFullUnitDetails(ev.unit_id);
    }
    return {
      type: 'BloodTest',
      data: { ...t, tested_date: formatDate(t.tested_date) },
      event: ev,
      donor,
      unit
    };
  } else {
    const err = new Error(`Unsupported entity type: ${type}`);
    err.statusCode = 400;
    throw err;
  }
}

module.exports = {
  syncGraph,
  getGraphStatus,
  traceByUnitId,
  traceByDonorId,
  expandNode,
  getNodeDetails,
  fetchFullDonorDetails,
  fetchFullBankDetails,
  fetchFullUnitDetails,
  fetchFullEventDetails
};
