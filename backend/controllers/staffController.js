const pool = require('../config/db');

const getAll = async (req, res, next) => {
  try {
    const { bank_id, role } = req.query;
    let sql = `
      SELECT s.*, bb.name AS bank_name,
             CONCAT(s.first_name,' ',s.last_name) AS full_name
      FROM staff s
      JOIN blood_bank bb ON bb.bank_id = s.bank_id
    `;
    const conditions = [], params = [];
    if (bank_id) { conditions.push('s.bank_id = ?'); params.push(bank_id); }
    if (role)    { conditions.push('s.role = ?');    params.push(role); }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY s.first_name ASC';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, bb.name AS bank_name FROM staff s
       JOIN blood_bank bb ON bb.bank_id=s.bank_id WHERE s.staff_id=?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { bank_id, first_name, last_name, role, phone, email, shift, hired_date } = req.body;
    const [result] = await pool.query(
      `INSERT INTO staff (bank_id,first_name,last_name,role,phone,email,shift,hired_date)
       VALUES (?,?,?,?,?,?,?,?)`,
      [bank_id, first_name, last_name, role, phone || null, email || null,
       shift || 'Morning', hired_date || null]
    );
    const [rows] = await pool.query('SELECT * FROM staff WHERE staff_id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { bank_id, first_name, last_name, role, phone, email, shift, hired_date } = req.body;
    const [result] = await pool.query(
      `UPDATE staff SET bank_id=?,first_name=?,last_name=?,role=?,phone=?,email=?,
       shift=?,hired_date=? WHERE staff_id=?`,
      [bank_id, first_name, last_name, role, phone || null, email || null,
       shift || 'Morning', hired_date || null, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Staff not found' });
    const [rows] = await pool.query('SELECT * FROM staff WHERE staff_id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM staff WHERE staff_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.json({ success: true, message: 'Staff deleted' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
