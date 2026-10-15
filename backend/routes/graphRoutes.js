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

// GET /api/graph/expand/:type/:id - Expand neighbor nodes & relationships (Bloom exploration)
router.get('/expand/:type/:id', auth, authorize('Admin', 'Doctor', 'Nurse'), graphController.expandNode);

// GET /api/graph/details/:type/:id - Comprehensive entity details from authoritative MySQL
router.get('/details/:type/:id', auth, authorize('Admin', 'Doctor', 'Nurse'), graphController.getNodeDetails);

module.exports = router;
