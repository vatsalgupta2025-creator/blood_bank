const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const ctrl = require('../controllers/bloodBankController');
router.get('/', auth, authorize('Admin', 'Doctor', 'Nurse', 'Technician'), ctrl.getAll);
router.get('/:id', auth, authorize('Admin', 'Doctor', 'Nurse', 'Technician'), ctrl.getOne);
router.get('/:id/stats', auth, authorize('Admin', 'Doctor', 'Nurse', 'Technician'), ctrl.getStats);
router.post('/', auth, authorize('Admin'), ctrl.create);
router.put('/:id', auth, authorize('Admin'), ctrl.update);
router.delete('/:id', auth, authorize('Admin'), ctrl.remove);
module.exports = router;
