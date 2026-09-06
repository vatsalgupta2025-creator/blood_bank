const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const ctrl = require('../controllers/bloodRequestController');
router.get('/', auth, authorize('Admin', 'Doctor', 'Technician'), ctrl.getAll);
router.get('/:id', auth, authorize('Admin', 'Doctor', 'Technician'), ctrl.getOne);
router.post('/', auth, authorize('Admin', 'Doctor', 'Technician'), ctrl.create);
router.put('/:id', auth, authorize('Admin', 'Doctor', 'Technician'), ctrl.update);
router.delete('/:id', auth, authorize('Admin'), ctrl.remove);
module.exports = router;
