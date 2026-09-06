const pool = require('../config/db');

const getAll = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT de.*,
             CONCAT(d.first_name,' ',d.last_name) AS donor_name, d.blood_group,
             bb.name AS bank_name,
             bu.unit_code,
             CONCAT(s.first_name,' ',s.last_name) AS staff_name
      FROM donation_event de
      JOIN donor d ON d.donor_id = de.donor_id
      JOIN blood_bank bb ON bb.bank_id = de.bank_id
      LEFT JOIN blood_unit bu ON bu.unit_id = de.unit_id
      LEFT JOIN staff s ON s.staff_id = de.staff_id
      ORDER BY de.event_date DESC
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT de.*,
             CONCAT(d.first_name,' ',d.last_name) AS donor_name, d.blood_group, d.phone AS donor_phone,
             bb.name AS bank_name, bb.city AS bank_city,
             bu.unit_code, bu.status AS unit_status,
             CONCAT(s.first_name,' ',s.last_name) AS staff_name
      FROM donation_event de
      JOIN donor d ON d.donor_id = de.donor_id
      JOIN blood_bank bb ON bb.bank_id = de.bank_id
      LEFT JOIN blood_unit bu ON bu.unit_id = de.unit_id
      LEFT JOIN staff s ON s.staff_id = de.staff_id
      WHERE de.event_id = ?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Donation event not found' });
    const [tests] = await pool.query(
      `SELECT bt.*, CONCAT(s.first_name,' ',s.last_name) AS tester_name
       FROM blood_test bt LEFT JOIN staff s ON s.staff_id = bt.tested_by
       WHERE bt.event_id = ?`, [req.params.id]
    );
    res.json({ success: true, data: { ...rows[0], blood_tests: tests } });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    let { donor_id, donor_name, bank_id, unit_id, event_date, event_time, staff_id, notes } = req.body;
    
    // Auto-create donor if donor_name is provided but no donor_id
    if (!donor_id && donor_name) {
      const parts = donor_name.trim().split(/\s+/);
      const first = parts.slice(0, parts.length > 1 ? parts.length - 1 : 1).join(' ');
      const last = parts.length > 1 ? parts[parts.length - 1] : '';
      const [insertRes] = await pool.query(
        `INSERT INTO donor (first_name, last_name, dob, gender, phone, blood_group, is_eligible) VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [first, last, '1990-01-01', 'Other', '0000000000', 'O+']
      );
      donor_id = insertRes.insertId;
    }

    const [result] = await pool.query(
      `INSERT INTO donation_event (donor_id,bank_id,unit_id,event_date,event_time,staff_id,notes)
       VALUES (?,?,?,?,?,?,?)`,
      [donor_id, bank_id, unit_id || null, event_date, event_time || null,
       staff_id || null, notes || null]
    );
    // Increment donor's total_donations
    await pool.query(
      `UPDATE donor SET total_donations=total_donations+1, last_donation=? WHERE donor_id=?`,
      [event_date, donor_id]
    );
    const [rows] = await pool.query('SELECT * FROM donation_event WHERE event_id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { donor_id, bank_id, unit_id, event_date, event_time, staff_id, notes } = req.body;
    const [result] = await pool.query(
      `UPDATE donation_event SET donor_id=?,bank_id=?,unit_id=?,event_date=?,
       event_time=?,staff_id=?,notes=? WHERE event_id=?`,
      [donor_id, bank_id, unit_id || null, event_date, event_time || null,
       staff_id || null, notes || null, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Event not found' });
    const [rows] = await pool.query('SELECT * FROM donation_event WHERE event_id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM donation_event WHERE event_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Donation event deleted' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
