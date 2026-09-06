const pool = require('../config/db');

const getAll = async (req, res, next) => {
  try {
    const { blood_group, status, bank_id } = req.query;
    let sql = `
      SELECT bu.*, bb.name AS bank_name,
             DATEDIFF(bu.expiry_date, CURDATE()) AS days_to_expiry
      FROM blood_unit bu
      JOIN blood_bank bb ON bb.bank_id = bu.bank_id
    `;
    const conditions = [], params = [];
    if (blood_group) { conditions.push('bu.blood_group = ?'); params.push(blood_group); }
    if (status)      { conditions.push('bu.status = ?');      params.push(status); }
    if (bank_id)     { conditions.push('bu.bank_id = ?');     params.push(bank_id); }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY bu.expiry_date ASC';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT bu.*, bb.name AS bank_name, DATEDIFF(bu.expiry_date, CURDATE()) AS days_to_expiry
       FROM blood_unit bu JOIN blood_bank bb ON bb.bank_id=bu.bank_id WHERE bu.unit_id=?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Blood unit not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const getInventorySummary = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT blood_group,
             SUM(CASE WHEN status='Available' THEN 1 ELSE 0 END) AS available,
             SUM(CASE WHEN status='Reserved'  THEN 1 ELSE 0 END) AS reserved,
             SUM(CASE WHEN status='Used'      THEN 1 ELSE 0 END) AS used,
             SUM(CASE WHEN status='Expired'   THEN 1 ELSE 0 END) AS expired,
             COUNT(*) AS total
      FROM blood_unit GROUP BY blood_group ORDER BY blood_group
    `);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { bank_id, unit_code, blood_group, volume_ml, collected_date, expiry_date, status, storage_temp } = req.body;
    const [result] = await pool.query(
      `INSERT INTO blood_unit (bank_id,unit_code,blood_group,volume_ml,collected_date,expiry_date,status,storage_temp)
       VALUES (?,?,?,?,?,?,?,?)`,
      [bank_id, unit_code, blood_group, volume_ml || 450, collected_date, expiry_date,
       status || 'Available', storage_temp || 4.0]
    );
    const [rows] = await pool.query('SELECT * FROM blood_unit WHERE unit_id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { bank_id, unit_code, blood_group, volume_ml, collected_date, expiry_date, status, storage_temp } = req.body;
    const [result] = await pool.query(
      `UPDATE blood_unit SET bank_id=?,unit_code=?,blood_group=?,volume_ml=?,collected_date=?,
       expiry_date=?,status=?,storage_temp=? WHERE unit_id=?`,
      [bank_id, unit_code, blood_group, volume_ml, collected_date, expiry_date,
       status, storage_temp, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Blood unit not found' });
    const [rows] = await pool.query('SELECT * FROM blood_unit WHERE unit_id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM blood_unit WHERE unit_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Blood unit not found' });
    res.json({ success: true, message: 'Blood unit deleted' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, getInventorySummary, create, update, remove };
