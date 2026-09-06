const pool = require('../config/db');

// GET /api/blood-banks
const getAll = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM blood_bank ORDER BY name ASC'
    );
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) { next(err); }
};

// GET /api/blood-banks/:id
const getOne = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM blood_bank WHERE bank_id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Blood bank not found' });
    
    // Aggregate inventory
    const [inventory] = await pool.query(
      'SELECT blood_group, COUNT(*) as count FROM blood_unit WHERE bank_id = ? AND status = "Available" GROUP BY blood_group',
      [req.params.id]
    );
    
    res.json({ success: true, data: { ...rows[0], inventory } });
  } catch (err) { next(err); }
};

// GET /api/blood-banks/:id/stats
const getStats = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [[staffCount]]   = await pool.query('SELECT COUNT(*) AS count FROM staff WHERE bank_id = ?', [id]);
    const [[unitCount]]    = await pool.query('SELECT COUNT(*) AS count FROM blood_unit WHERE bank_id = ? AND status="Available"', [id]);
    const [[eventCount]]   = await pool.query('SELECT COUNT(*) AS count FROM donation_event WHERE bank_id = ?', [id]);
    const [[requestCount]] = await pool.query('SELECT COUNT(*) AS count FROM blood_request WHERE bank_id = ?', [id]);
    res.json({
      success: true,
      data: {
        staffCount:   staffCount.count,
        unitCount:    unitCount.count,
        eventCount:   eventCount.count,
        requestCount: requestCount.count,
      }
    });
  } catch (err) { next(err); }
};

// POST /api/blood-banks
const create = async (req, res, next) => {
  try {
    const { name, address, city, state, phone, email, capacity, established } = req.body;
    const [result] = await pool.query(
      'INSERT INTO blood_bank (name, address, city, state, phone, email, capacity, established) VALUES (?,?,?,?,?,?,?,?)',
      [name, address, city, state, phone, email, capacity || 0, established || null]
    );
    const [rows] = await pool.query('SELECT * FROM blood_bank WHERE bank_id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

// PUT /api/blood-banks/:id
const update = async (req, res, next) => {
  try {
    const { name, address, city, state, phone, email, capacity, established } = req.body;
    const [result] = await pool.query(
      'UPDATE blood_bank SET name=?, address=?, city=?, state=?, phone=?, email=?, capacity=?, established=? WHERE bank_id=?',
      [name, address, city, state, phone, email, capacity, established || null, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Blood bank not found' });
    const [rows] = await pool.query('SELECT * FROM blood_bank WHERE bank_id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

// DELETE /api/blood-banks/:id
const remove = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM blood_bank WHERE bank_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Blood bank not found' });
    res.json({ success: true, message: 'Blood bank deleted' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, getStats, create, update, remove };
