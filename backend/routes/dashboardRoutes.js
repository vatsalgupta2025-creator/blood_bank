const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const ctrl = require('../controllers/dashboardController');
router.get('/summary', auth, ctrl.getSummary);
module.exports = router;
