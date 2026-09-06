const pool = require('../config/db');

const getAll = async (req, res, next) => {
  try {
    const { result, test_type } = req.query;
    let sql = `
      SELECT bt.*,
             CONCAT(d.first_name,' ',d.last_name) AS donor_name, d.blood_group,
             CONCAT(s.first_name,' ',s.last_name) AS tester_name,
             de.event_date
      FROM blood_test bt
      JOIN donor d ON d.donor_id = bt.donor_id
      LEFT JOIN staff s ON s.staff_id = bt.tested_by
      LEFT JOIN donation_event de ON de.event_id = bt.event_id
    `;
    const conditions = [], params = [];
    if (result)    { conditions.push('bt.result = ?');    params.push(result); }
    if (test_type) { conditions.push('bt.test_type = ?'); params.push(test_type); }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY bt.tested_date DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT bt.*, CONCAT(d.first_name,' ',d.last_name) AS donor_name,
              CONCAT(s.first_name,' ',s.last_name) AS tester_name
       FROM blood_test bt
       JOIN donor d ON d.donor_id = bt.donor_id
       LEFT JOIN staff s ON s.staff_id = bt.tested_by
       WHERE bt.test_id = ?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Blood test not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { event_id, donor_id, test_type, tested_date, result, tested_by, remarks } = req.body;
    const [r] = await pool.query(
      `INSERT INTO blood_test (event_id,donor_id,test_type,tested_date,result,tested_by,remarks)
       VALUES (?,?,?,?,?,?,?)`,
      [event_id, donor_id, test_type, tested_date, result || 'Pending',
       tested_by || null, remarks || null]
    );
    const [rows] = await pool.query('SELECT * FROM blood_test WHERE test_id = ?', [r.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { event_id, donor_id, test_type, tested_date, result, tested_by, remarks } = req.body;
    const [r] = await pool.query(
      `UPDATE blood_test SET event_id=?,donor_id=?,test_type=?,tested_date=?,
       result=?,tested_by=?,remarks=? WHERE test_id=?`,
      [event_id, donor_id, test_type, tested_date, result, tested_by || null,
       remarks || null, req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ success: false, message: 'Blood test not found' });
    const [rows] = await pool.query('SELECT * FROM blood_test WHERE test_id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const [r] = await pool.query('DELETE FROM blood_test WHERE test_id = ?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ success: false, message: 'Blood test not found' });
    res.json({ success: true, message: 'Blood test deleted' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
