const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const [rows] = await pool.query(`
      SELECT s.staff_id, s.first_name, s.last_name, s.email, s.role, s.bank_id, sc.password_hash
      FROM staff s
      JOIN staff_credentials sc ON s.staff_id = sc.staff_id
      WHERE s.email = ?
    `, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const payload = {
      staff_id: user.staff_id,
      email: user.email,
      role: user.role,
      name: `${user.first_name} ${user.last_name}`,
      bank_id: user.bank_id
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '1d' });

    res.json({
      success: true,
      token,
      user: payload
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};
