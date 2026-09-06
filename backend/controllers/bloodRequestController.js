const pool = require('../config/db');

const getAll = async (req, res, next) => {
  try {
    const { status, urgency, blood_group } = req.query;
    let sql = `
      SELECT br.*,
             CONCAT(r.first_name,' ',r.last_name) AS receiver_name,
             r.blood_group AS receiver_blood_group,
             bb.name AS bank_name,
             CONCAT(s.first_name,' ',s.last_name) AS handled_by_name
      FROM blood_request br
      JOIN receiver r ON r.receiver_id = br.receiver_id
      JOIN blood_bank bb ON bb.bank_id = br.bank_id
      LEFT JOIN staff s ON s.staff_id = br.handled_by
    `;
    const conditions = [], params = [];
    if (status)      { conditions.push('br.status = ?');      params.push(status); }
    if (urgency)     { conditions.push('br.urgency = ?');     params.push(urgency); }
    if (blood_group) { conditions.push('br.blood_group = ?'); params.push(blood_group); }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += " ORDER BY FIELD(br.urgency,'Critical','Urgent','Normal'), br.request_date DESC";
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT br.*, CONCAT(r.first_name,' ',r.last_name) AS receiver_name,
              r.medical_condition, r.hospital_name, bb.name AS bank_name,
              CONCAT(s.first_name,' ',s.last_name) AS handled_by_name
       FROM blood_request br
       JOIN receiver r ON r.receiver_id = br.receiver_id
       JOIN blood_bank bb ON bb.bank_id = br.bank_id
       LEFT JOIN staff s ON s.staff_id = br.handled_by
       WHERE br.request_id = ?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    let { receiver_id, receiver_name, bank_id, blood_group, quantity_ml, urgency, request_date, required_by, notes } = req.body;
    
    // Auto-create receiver if receiver_name is provided but no receiver_id
    if (!receiver_id && receiver_name) {
      const parts = receiver_name.trim().split(/\s+/);
      const first = parts.slice(0, parts.length > 1 ? parts.length - 1 : 1).join(' ');
      const last = parts.length > 1 ? parts[parts.length - 1] : '';
      const [insertRes] = await pool.query(
        `INSERT INTO receiver (first_name, last_name, blood_group) VALUES (?, ?, ?)`,
        [first, last, blood_group || 'O+']
      );
      receiver_id = insertRes.insertId;
    }

    const [result] = await pool.query(
      `INSERT INTO blood_request (receiver_id,bank_id,blood_group,quantity_ml,urgency,request_date,required_by,notes)
       VALUES (?,?,?,?,?,?,?,?)`,
      [receiver_id, bank_id, blood_group, quantity_ml || 450, urgency || 'Normal',
       request_date, required_by || null, notes || null]
    );
    const [rows] = await pool.query('SELECT * FROM blood_request WHERE request_id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { receiver_id, bank_id, unit_id, blood_group, quantity_ml, urgency,
            request_date, required_by, status, handled_by, notes } = req.body;
    const [result] = await pool.query(
      `UPDATE blood_request SET receiver_id=?,bank_id=?,unit_id=?,blood_group=?,quantity_ml=?,
       urgency=?,request_date=?,required_by=?,status=?,handled_by=?,notes=? WHERE request_id=?`,
      [receiver_id, bank_id, unit_id || null, blood_group, quantity_ml, urgency,
       request_date, required_by || null, status, handled_by || null, notes || null, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Request not found' });
    const [rows] = await pool.query('SELECT * FROM blood_request WHERE request_id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM blood_request WHERE request_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, message: 'Blood request deleted' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
