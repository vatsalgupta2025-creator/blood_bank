const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const graphController = require('../controllers/graphController');

// POST /api/graph/sync - Admin only: full projection replacement
router.post('/sync', auth, authorize('Admin'), graphController.sync);

// GET /api/graph/status - Authenticated: graph projection health & sync status
router.get('/status', auth, graphController.getStatus);

// GET /api/graph/trace/unit/:id - Admin, Doctor, Nurse only: trace blood unit lineage
// Technician is explicitly excluded (consistent with donorRoutes.js access policy).
router.get('/trace/unit/:id', auth, authorize('Admin', 'Doctor', 'Nurse'), graphController.traceUnit);

// GET /api/graph/trace/donor/:id - Admin, Doctor, Nurse only: trace donor donation lineage
// Technician is explicitly excluded (consistent with donorRoutes.js access policy).
router.get('/trace/donor/:id', auth, authorize('Admin', 'Doctor', 'Nurse'), graphController.traceDonor);

// Convenient alias for unit trace - same access restriction as /trace/unit/:id
router.get('/trace/:id', auth, authorize('Admin', 'Doctor', 'Nurse'), graphController.traceUnit);

module.exports = router;
