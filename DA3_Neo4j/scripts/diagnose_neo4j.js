/**
 * Read-only diagnostic script for Neo4j AuraDB connection and graph state.
 * Does NOT modify any data. Prints sanitized output (no credentials).
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const neo4j = require('neo4j-driver');

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;
const database = process.env.NEO4J_DATABASE;

console.log('=== Neo4j Diagnostic ===');
console.log('URI configured:', !!uri);
console.log('Username configured:', !!username);
console.log('Password configured:', !!password);
console.log('Database configured:', database ? '(set)' : '(not set)');

if (!uri || !username || !password) {
  console.error('FATAL: Missing Neo4j credentials in .env');
  process.exit(1);
}

async function run() {
  let driver;
  try {
    driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
      maxConnectionPoolSize: 5,
      connectionTimeout: 15000
    });

    console.log('\n--- Step 1: Verify connectivity ---');
    const verifyConfig = database ? { database } : undefined;
    const serverInfo = await driver.verifyConnectivity(verifyConfig);
    console.log('✅ Connected. Agent:', serverInfo?.agent || 'unknown');

  } catch (err) {
    console.error('❌ Connection FAILED:', err.message);
    console.error('   Code:', err.code);
    if (driver) await driver.close().catch(() => {});
    process.exit(1);
  }

  const session = driver.session({
    defaultAccessMode: neo4j.session.READ,
    ...(database ? { database } : {})
  });

  try {
    console.log('\n--- Step 2: Node counts by label ---');
    const nodeResult = await session.run(`
      MATCH (n) RETURN labels(n)[0] AS label, count(n) AS cnt ORDER BY label
    `);
    if (nodeResult.records.length === 0) {
      console.log('⚠️  Graph is EMPTY — zero nodes.');
    } else {
      for (const r of nodeResult.records) {
        console.log(`  ${r.get('label')}: ${r.get('cnt').toNumber ? r.get('cnt').toNumber() : r.get('cnt')}`);
      }
    }

    console.log('\n--- Step 3: Relationship counts by type ---');
    const relResult = await session.run(`
      MATCH ()-[r]->() RETURN type(r) AS relType, count(r) AS cnt ORDER BY relType
    `);
    if (relResult.records.length === 0) {
      console.log('⚠️  Zero relationships in graph.');
    } else {
      for (const r of relResult.records) {
        console.log(`  ${r.get('relType')}: ${r.get('cnt').toNumber ? r.get('cnt').toNumber() : r.get('cnt')}`);
      }
    }

    console.log('\n--- Step 4: Sample BloodUnit nodes (limit 5) ---');
    const unitResult = await session.run(`
      MATCH (u:BloodUnit) RETURN u.unit_id AS id, u.unit_code AS code, u.blood_group AS bg, u.status AS status LIMIT 5
    `);
    if (unitResult.records.length === 0) {
      console.log('⚠️  No BloodUnit nodes found.');
    } else {
      for (const r of unitResult.records) {
        const id = r.get('id');
        console.log(`  unit_id=${id?.toNumber ? id.toNumber() : id}, code=${r.get('code')}, blood_group=${r.get('bg')}, status=${r.get('status')}`);
      }
    }

    console.log('\n--- Step 5: Trace unit_id=1 (same as frontend) ---');
    const traceResult = await session.run(`
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
    `, { unitId: neo4j.int(1) });
    console.log('  Records returned:', traceResult.records.length);
    if (traceResult.records.length > 0) {
      const rec = traceResult.records[0];
      const unitNode = rec.get('unit');
      const ev = rec.get('donationEvent');
      const donorId = rec.get('donorId');
      const bank = rec.get('bloodBank');
      const tests = rec.get('bloodTests');
      console.log('  unit:', unitNode ? JSON.stringify(unitNode.properties || unitNode) : 'null');
      console.log('  donationEvent:', ev ? JSON.stringify(ev.properties || ev) : 'null');
      console.log('  donorId:', donorId ? (donorId.toNumber ? donorId.toNumber() : donorId) : 'null');
      console.log('  bloodBank:', bank ? JSON.stringify(bank.properties || bank) : 'null');
      console.log('  bloodTests:', tests ? tests.length : 0);
    }

    console.log('\n--- Step 6: Check full connectivity from a BloodUnit ---');
    const connResult = await session.run(`
      MATCH (u:BloodUnit) WHERE u.unit_id = $unitId
      OPTIONAL MATCH path = (n)-[*1..3]-(u)
      RETURN count(DISTINCT n) AS connectedNodes, count(DISTINCT path) AS paths
    `, { unitId: neo4j.int(1) });
    if (connResult.records.length > 0) {
      const rec = connResult.records[0];
      const cn = rec.get('connectedNodes');
      const p = rec.get('paths');
      console.log(`  Connected nodes to unit_id=1: ${cn?.toNumber ? cn.toNumber() : cn}, paths: ${p?.toNumber ? p.toNumber() : p}`);
    }

    console.log('\n--- Step 7: Check sample Donor connections ---');
    const donorResult = await session.run(`
      MATCH (d:Donor) 
      OPTIONAL MATCH (d)-[:DONATES]->(ev:DonationEvent)
      RETURN d.donor_id AS id, count(ev) AS events LIMIT 5
    `);
    for (const r of donorResult.records) {
      const id = r.get('id');
      const events = r.get('events');
      console.log(`  donor_id=${id?.toNumber ? id.toNumber() : id}, donationEvents=${events?.toNumber ? events.toNumber() : events}`);
    }

  } catch (err) {
    console.error('❌ Query error:', err.message);
    console.error('   Code:', err.code);
  } finally {
    await session.close();
    await driver.close();
    console.log('\n=== Diagnostic complete ===');
  }
}

run().catch(err => {
  console.error('Unhandled error:', err.message);
  process.exit(1);
});
