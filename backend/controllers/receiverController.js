const pool = require('../config/db');

const getAll = async (req, res, next) => {
  try {
    const { blood_group } = req.query;
    let sql = `SELECT r.*, TIMESTAMPDIFF(YEAR, r.dob, CURDATE()) AS age FROM receiver r`;
    const params = [];
    if (blood_group) { sql += ' WHERE r.blood_group = ?'; params.push(blood_group); }
    sql += ' ORDER BY r.first_name ASC';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, TIMESTAMPDIFF(YEAR, r.dob, CURDATE()) AS age FROM receiver r WHERE r.receiver_id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Receiver not found' });
    const [requests] = await pool.query(
      `SELECT br.*, bb.name AS bank_name FROM blood_request br
       JOIN blood_bank bb ON bb.bank_id = br.bank_id
       WHERE br.receiver_id = ? ORDER BY br.request_date DESC`, [req.params.id]
    );
    res.json({ success: true, data: { ...rows[0], blood_requests: requests } });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { first_name, last_name, dob, gender, blood_group, phone, email,
            hospital_name, hospital_city, medical_condition } = req.body;
    const [result] = await pool.query(
      `INSERT INTO receiver (first_name,last_name,dob,gender,blood_group,phone,email,hospital_name,hospital_city,medical_condition)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [first_name, last_name, dob || null, gender || null, blood_group, phone || null,
       email || null, hospital_name || null, hospital_city || null, medical_condition || null]
    );
    const [rows] = await pool.query('SELECT * FROM receiver WHERE receiver_id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { first_name, last_name, dob, gender, blood_group, phone, email,
            hospital_name, hospital_city, medical_condition } = req.body;
    const [result] = await pool.query(
      `UPDATE receiver SET first_name=?,last_name=?,dob=?,gender=?,blood_group=?,phone=?,
       email=?,hospital_name=?,hospital_city=?,medical_condition=? WHERE receiver_id=?`,
      [first_name, last_name, dob || null, gender || null, blood_group, phone || null,
       email || null, hospital_name || null, hospital_city || null, medical_condition || null, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Receiver not found' });
    const [rows] = await pool.query('SELECT * FROM receiver WHERE receiver_id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM receiver WHERE receiver_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Receiver not found' });
    res.json({ success: true, message: 'Receiver deleted' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
