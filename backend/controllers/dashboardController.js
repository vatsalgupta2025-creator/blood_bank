const pool = require('../config/db');

// Dashboard summary stats
const getSummary = async (req, res, next) => {
  try {
    const [[banks]]    = await pool.query('SELECT COUNT(*) AS count FROM blood_bank');
    const [[donors]]   = await pool.query('SELECT COUNT(*) AS count FROM donor WHERE is_eligible=1');
    const [[receivers]]= await pool.query('SELECT COUNT(*) AS count FROM receiver');
    const [[units]]    = await pool.query('SELECT COUNT(*) AS count FROM blood_unit WHERE status="Available"');
    const [[pending]]  = await pool.query('SELECT COUNT(*) AS count FROM blood_request WHERE status="Pending"');
    const [[critical]] = await pool.query('SELECT COUNT(*) AS count FROM blood_request WHERE urgency="Critical" AND status IN ("Pending","Approved")');
    const [[events]]   = await pool.query('SELECT COUNT(*) AS count FROM donation_event');
    const [[expired]]  = await pool.query('SELECT COUNT(*) AS count FROM blood_unit WHERE status="Expired"');

    // Blood group inventory
    const [inventory] = await pool.query(`
      SELECT blood_group, COUNT(*) AS count
      FROM blood_unit WHERE status='Available'
      GROUP BY blood_group ORDER BY blood_group
    `);

    // Donations per month (last 6 months)
    const [monthlyDonations] = await pool.query(`
      SELECT DATE_FORMAT(event_date,'%b %Y') AS month,
             COUNT(*) AS count
      FROM donation_event
      WHERE event_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(event_date,'%Y-%m'), DATE_FORMAT(event_date,'%b %Y')
      ORDER BY DATE_FORMAT(event_date,'%Y-%m') ASC
    `);

    // Request status breakdown
    const [requestStatus] = await pool.query(`
      SELECT status, COUNT(*) AS count
      FROM blood_request GROUP BY status
    `);

    res.json({
      success: true,
      data: {
        totalBanks:        banks.count,
        eligibleDonors:    donors.count,
        totalReceivers:    receivers.count,
        availableUnits:    units.count,
        pendingRequests:   pending.count,
        criticalRequests:  critical.count,
        totalDonations:    events.count,
        expiredUnits:      expired.count,
        bloodGroupInventory: inventory,
        monthlyDonations,
        requestStatus,
      }
    });
  } catch (err) { next(err); }
};

module.exports = { getSummary };
