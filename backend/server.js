require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173'].filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '🩸 Blood Bank API is running', timestamp: new Date() });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const pool = require('./config/db');
    const [rows] = await pool.query('SELECT 1 + 1 AS solution');
    res.json({ success: true, message: 'Database connection successful!', result: rows[0].solution });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database connection failed', error: error.message });
  }
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',             require('./routes/authRoutes'));
app.use('/api/dashboard',        require('./routes/dashboardRoutes'));
app.use('/api/blood-banks',      require('./routes/bloodBankRoutes'));
app.use('/api/staff',            require('./routes/staffRoutes'));
app.use('/api/donors',           require('./routes/donorRoutes'));
app.use('/api/receivers',        require('./routes/receiverRoutes'));
app.use('/api/blood-units',      require('./routes/bloodUnitRoutes'));
app.use('/api/donation-events',  require('./routes/donationEventRoutes'));
app.use('/api/blood-tests',      require('./routes/bloodTestRoutes'));
app.use('/api/blood-requests',   require('./routes/bloodRequestRoutes'));

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.url} not found` });
});

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API base: http://localhost:${PORT}/api`);
  console.log(`💡 Health:   http://localhost:${PORT}/api/health\n`);
});
