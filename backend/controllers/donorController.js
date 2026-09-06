const pool = require('../config/db');

const getAll = async (req, res, next) => {
  try {
    const { blood_group, eligible } = req.query;
    let sql = `
      SELECT d.*, TIMESTAMPDIFF(YEAR, d.dob, CURDATE()) AS age,
             MAX(bb.name) AS preferred_bank
      FROM donor d
      LEFT JOIN donation_event de ON de.donor_id = d.donor_id
      LEFT JOIN blood_bank bb ON bb.bank_id = de.bank_id
      GROUP BY d.donor_id
      ORDER BY d.first_name ASC
    `;
    const params = [];
    const conditions = [];
    if (blood_group) conditions.push('d.blood_group = ?') && params.push(blood_group);
    if (eligible !== undefined) conditions.push('d.is_eligible = ?') && params.push(eligible === 'true' ? 1 : 0);

    if (conditions.length) {
      sql = sql.replace('WHERE', '').replace('GROUP BY', `WHERE ${conditions.join(' AND ')} GROUP BY`);
    }
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, TIMESTAMPDIFF(YEAR, d.dob, CURDATE()) AS age FROM donor d WHERE d.donor_id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Donor not found' });
    const [events] = await pool.query(
      `SELECT de.*, bb.name AS bank_name FROM donation_event de
       JOIN blood_bank bb ON bb.bank_id = de.bank_id
       WHERE de.donor_id = ? ORDER BY de.event_date DESC`, [req.params.id]
    );
    res.json({ success: true, data: { ...rows[0], donation_history: events } });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { first_name, last_name, dob, gender, blood_group, phone, email,
            street, city, state, is_eligible } = req.body;
    const [result] = await pool.query(
      `INSERT INTO donor (first_name,last_name,dob,gender,blood_group,phone,email,street,city,state,is_eligible)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [first_name, last_name, dob, gender, blood_group, phone, email || null,
       street || null, city || null, state || null, is_eligible ?? 1]
    );
    const [rows] = await pool.query('SELECT * FROM donor WHERE donor_id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { first_name, last_name, dob, gender, blood_group, phone, email,
            street, city, state, is_eligible } = req.body;
    const [result] = await pool.query(
      `UPDATE donor SET first_name=?,last_name=?,dob=?,gender=?,blood_group=?,
       phone=?,email=?,street=?,city=?,state=?,is_eligible=? WHERE donor_id=?`,
      [first_name, last_name, dob, gender, blood_group, phone, email || null,
       street || null, city || null, state || null, is_eligible ?? 1, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Donor not found' });
    const [rows] = await pool.query('SELECT * FROM donor WHERE donor_id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM donor WHERE donor_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Donor not found' });
    res.json({ success: true, message: 'Donor deleted' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
