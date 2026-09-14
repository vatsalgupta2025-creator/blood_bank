const pool = require('../config/db');

/**
 * Validates whether a given SQL string is strictly a read-only SELECT query.
 */
function isReadOnlySelectQuery(sql) {
  if (!sql || typeof sql !== 'string') {
    return { valid: false, reason: 'Query string is required.' };
  }

  // 1. Remove comments to prevent comment-injection tricks
  // Remove block comments /* ... */
  let cleaned = sql.replace(/\/\*[\s\S]*?\*\//g, ' ');
  // Remove single line comments -- ... and # ...
  cleaned = cleaned.replace(/(--|#)[^\r\n]*/g, ' ');

  cleaned = cleaned.trim();
  if (!cleaned) {
    return { valid: false, reason: 'Query is empty after removing comments.' };
  }

  // 2. Multi-statement check
  // Allow at most one trailing semicolon
  if (cleaned.endsWith(';')) {
    cleaned = cleaned.slice(0, -1).trim();
  }
  if (cleaned.includes(';')) {
    return { valid: false, reason: 'Multiple SQL statements are not permitted.' };
  }

  // 3. Must begin with SELECT or WITH (for CTEs)
  const startsWithSelect = /^(SELECT|WITH)\s/i.test(cleaned);
  if (!startsWithSelect) {
    return { valid: false, reason: 'Only SELECT queries are allowed in SQL Console.' };
  }

  // 4. Forbidden keywords check
  const forbiddenRegex = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|CALL|EXEC|EXECUTE|REPLACE|MERGE|LOCK|UNLOCK|SET|INTO|OUTFILE|DUMPFILE)\b/i;
  if (forbiddenRegex.test(cleaned)) {
    return { valid: false, reason: 'Query contains forbidden SQL modification or admin commands.' };
  }

  return { valid: true, cleanedSql: cleaned };
}

/**
 * POST /api/sql/query
 * Executes a SELECT query safely.
 */
exports.executeQuery = async (req, res) => {
  try {
    const { query } = req.body;
    const validation = isReadOnlySelectQuery(query);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.reason
      });
    }

    const [rows, fields] = await pool.query(validation.cleanedSql);

    let columns = [];
    if (fields && Array.isArray(fields) && fields.length > 0) {
      columns = fields.map(f => f.name);
    } else if (rows && rows.length > 0) {
      columns = Object.keys(rows[0]);
    }

    return res.json({
      success: true,
      columns,
      rows: rows || [],
      rowCount: Array.isArray(rows) ? rows.length : 0
    });
  } catch (err) {
    // Return clean error without exposing credentials, secrets or stack trace
    const cleanMessage = err.sqlMessage || err.message || 'Database query error';
    return res.status(400).json({
      success: false,
      message: `SQL Error: ${cleanMessage}`
    });
  }
};

/**
 * Whitelisted entities and their primary key mapping
 */
const ENTITY_MAP = {
  donor:          { table: 'donor',          pk: 'donor_id' },
  donors:         { table: 'donor',          pk: 'donor_id' },

  receiver:       { table: 'receiver',       pk: 'receiver_id' },
  receivers:      { table: 'receiver',       pk: 'receiver_id' },

  blood_bank:     { table: 'blood_bank',     pk: 'bank_id' },
  blood_banks:    { table: 'blood_bank',     pk: 'bank_id' },
  'blood-bank':   { table: 'blood_bank',     pk: 'bank_id' },
  'blood-banks':  { table: 'blood_bank',     pk: 'bank_id' },

  blood_unit:     { table: 'blood_unit',     pk: 'unit_id' },
  blood_units:    { table: 'blood_unit',     pk: 'unit_id' },
  'blood-unit':   { table: 'blood_unit',     pk: 'unit_id' },
  'blood-units':  { table: 'blood_unit',     pk: 'unit_id' },

  blood_request:  { table: 'blood_request',  pk: 'request_id' },
  blood_requests: { table: 'blood_request',  pk: 'request_id' },
  'blood-request':{ table: 'blood_request',  pk: 'request_id' },
  'blood-requests':{ table: 'blood_request',  pk: 'request_id' },

  staff:          { table: 'staff',          pk: 'staff_id' },

  donation_event: { table: 'donation_event', pk: 'event_id' },
  donation_events:{ table: 'donation_event', pk: 'event_id' },
  'donation-event':{ table: 'donation_event', pk: 'event_id' },
  'donation-events':{ table: 'donation_event', pk: 'event_id' },

  blood_test:     { table: 'blood_test',     pk: 'test_id' },
  blood_tests:    { table: 'blood_test',     pk: 'test_id' },
  'blood-test':   { table: 'blood_test',     pk: 'test_id' },
  'blood-tests':  { table: 'blood_test',     pk: 'test_id' }
};

/**
 * GET /api/db-verification/:entity/:id
 * Verifies live database record for a given entity and ID.
 */
exports.verifyRecord = async (req, res) => {
  try {
    const rawEntity = (req.params.entity || '').toLowerCase().trim();
    const id = req.params.id;

    if (!rawEntity || !id) {
      return res.status(400).json({
        success: false,
        message: 'Entity name and record ID are required.'
      });
    }

    const config = ENTITY_MAP[rawEntity];
    if (!config) {
      return res.status(400).json({
        success: false,
        message: `Invalid entity '${req.params.entity}'. Allowed entities: donor, receiver, blood_bank, blood_unit, blood_request, staff, donation_event, blood_test.`
      });
    }

    // Safely execute parameterized query with whitelisted table & primary key column
    const sql = `SELECT * FROM \`${config.table}\` WHERE \`${config.pk}\` = ?`;
    const [rows] = await pool.query(sql, [id]);

    if (!rows || rows.length === 0) {
      return res.json({
        success: true,
        found: false,
        entity: config.table,
        pkColumn: config.pk,
        id: id,
        message: 'Record not found — verified deleted from database.',
        data: null
      });
    }

    return res.json({
      success: true,
      found: true,
      entity: config.table,
      pkColumn: config.pk,
      id: id,
      data: rows[0]
    });
  } catch (err) {
    const cleanMessage = err.sqlMessage || err.message || 'Database verification error';
    return res.status(400).json({
      success: false,
      message: `Verification Error: ${cleanMessage}`
    });
  }
};
