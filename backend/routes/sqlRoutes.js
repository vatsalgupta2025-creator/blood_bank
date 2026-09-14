const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const sqlController = require('../controllers/sqlController');

// POST /api/sql/query - Requires JWT + Admin role
router.post('/query', auth, authorize('Admin'), sqlController.executeQuery);

module.exports = router;
