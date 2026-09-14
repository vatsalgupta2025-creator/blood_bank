const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const sqlController = require('../controllers/sqlController');

// GET /api/db-verification/:entity/:id - Requires JWT + Admin role
router.get('/:entity/:id', auth, authorize('Admin'), sqlController.verifyRecord);

module.exports = router;
