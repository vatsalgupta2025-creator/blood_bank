const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const ctrl = require('../controllers/bloodUnitController');
router.get('/inventory', auth, authorize('Admin', 'Nurse', 'Technician'), ctrl.getInventorySummary);
router.get('/', auth, authorize('Admin', 'Nurse', 'Technician'), ctrl.getAll);
router.get('/:id', auth, authorize('Admin', 'Nurse', 'Technician'), ctrl.getOne);
router.post('/', auth, authorize('Admin', 'Nurse', 'Technician'), ctrl.create);
router.put('/:id', auth, authorize('Admin', 'Nurse', 'Technician'), ctrl.update);
router.delete('/:id', auth, authorize('Admin'), ctrl.remove);
module.exports = router;
