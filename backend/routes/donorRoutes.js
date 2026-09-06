const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const ctrl = require('../controllers/donorController');
router.get('/', auth, authorize('Admin', 'Doctor', 'Nurse'), ctrl.getAll);
router.get('/:id', auth, authorize('Admin', 'Doctor', 'Nurse'), ctrl.getOne);
router.post('/', auth, authorize('Admin', 'Nurse'), ctrl.create);
router.put('/:id', auth, authorize('Admin', 'Nurse'), ctrl.update);
router.delete('/:id', auth, authorize('Admin'), ctrl.remove);
module.exports = router;
