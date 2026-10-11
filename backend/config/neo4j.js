const neo4j = require('neo4j-driver');

let driver = null;
let isConnected = false;

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;
const database = process.env.NEO4J_DATABASE;

if (uri && username && password) {
  try {
    driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
      maxConnectionPoolSize: 20,
      connectionTimeout: 10000
    });

    const verifyConfig = database ? { database } : undefined;
    // Asynchronously verify connectivity without blocking server startup
    driver.verifyConnectivity(verifyConfig)
      .then(serverInfo => {
        isConnected = true;
        console.log('✅ Neo4j Aura connected successfully (Agent: ' + (serverInfo?.agent || 'Neo4j') + ')');
      })
      .catch(err => {
        isConnected = false;
        console.warn('⚠️ Neo4j Aura connection check failed: ' + err.message);
      });
  } catch (err) {
    isConnected = false;
    driver = null;
    console.warn('⚠️ Neo4j driver initialization failed: ' + err.message);
  }
} else {
  console.log('ℹ️ Neo4j credentials not configured. Graph features running in offline/mock mode.');
}

function getDriver() {
  return driver;
}

function getSession(mode = neo4j.session.READ) {
  if (!driver) {
    const error = new Error('Neo4j driver is not initialized or configured.');
    error.statusCode = 503;
    throw error;
  }
  const sessionConfig = { defaultAccessMode: mode };
  if (database) {
    sessionConfig.database = database;
  }
  return driver.session(sessionConfig);
}

async function checkConnection() {
  if (!driver) return false;
  try {
    const verifyConfig = database ? { database } : undefined;
    await driver.verifyConnectivity(verifyConfig);
    isConnected = true;
    return true;
  } catch (err) {
    isConnected = false;
    return false;
  }
}

function isConfigured() {
  return Boolean(uri && username && password);
}

function isAvailable() {
  return Boolean(driver && isConnected);
}

async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
    isConnected = false;
  }
}

// Helper to convert Neo4j types (Integers, Dates) safely to standard JS primitives
function toNative(val) {
  if (val === null || val === undefined) return val;
  if (neo4j.isInt(val)) return val.toNumber();
  if (Array.isArray(val)) return val.map(toNative);
  if (typeof val === 'object') {
    // If it's a Neo4j Node or Relationship
    if (val.properties) {
      return toNative(val.properties);
    }
    const res = {};
    for (const key of Object.keys(val)) {
      res[key] = toNative(val[key]);
    }
    return res;
  }
  return val;
}

// Helper to convert numbers to safe Neo4j Integers
function safeInt(val) {
  if (val === null || val === undefined) return null;
  const num = Number(val);
  return isNaN(num) ? null : neo4j.int(num);
}

module.exports = {
  getDriver,
  getSession,
  checkConnection,
  isConfigured,
  isAvailable,
  closeDriver,
  toNative,
  safeInt,
  neo4j
};
