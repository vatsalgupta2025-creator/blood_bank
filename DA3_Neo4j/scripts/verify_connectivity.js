const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const neo4j = require('neo4j-driver');

async function testConnectivity() {
  const uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USERNAME;
  const password = process.env.NEO4J_PASSWORD;
  const database = process.env.NEO4J_DATABASE;

  if (!uri || !username || !password) {
    console.error('❌ Configuration error: NEO4J_URI, NEO4J_USERNAME, or NEO4J_PASSWORD is not set.');
    process.exit(1);
  }

  console.log(`Connecting to URI: ${uri}`);
  console.log(`Username: ${username}`);
  console.log(`Database: ${database || 'default'}`);
  console.log('Password: [REDACTED]');

  let driver = null;
  try {
    driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
      maxConnectionPoolSize: 5,
      connectionTimeout: 20000
    });

    console.log('\nExecuting driver.verifyConnectivity()...');
    const verifyConfig = database ? { database } : undefined;
    const serverInfo = await driver.verifyConnectivity(verifyConfig);

    console.log('\n========================================');
    console.log('✅ AUTHENTICATION & CONNECTIVITY SUCCESS');
    console.log('========================================');
    if (serverInfo) {
      if (serverInfo.address) console.log(`Server Address: ${serverInfo.address}`);
      if (serverInfo.agent) console.log(`Agent / Version: ${serverInfo.agent}`);
      if (serverInfo.protocolVersion) console.log(`Protocol Version: ${serverInfo.protocolVersion}`);
    } else {
      console.log('Connected to Neo4j Aura successfully (verifyConnectivity returned successfully with no error).');
    }
  } catch (err) {
    console.error('\n========================================');
    console.error('❌ CONNECTIVITY / AUTHENTICATION FAILED');
    console.error('========================================');
    console.error(`Error Code: ${err.code || 'UNKNOWN'}`);
    console.error(`Error Message: ${err.message}`);
    process.exit(1);
  } finally {
    if (driver) {
      await driver.close();
      console.log('Driver connection closed cleanly.');
    }
  }
}

testConnectivity();
