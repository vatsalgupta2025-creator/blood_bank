const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const ctrl = require('../controllers/receiverController');
router.get('/', auth, authorize('Admin', 'Doctor'), ctrl.getAll);
router.get('/:id', auth, authorize('Admin', 'Doctor'), ctrl.getOne);
router.post('/', auth, authorize('Admin', 'Doctor'), ctrl.create);
router.put('/:id', auth, authorize('Admin', 'Doctor'), ctrl.update);
router.delete('/:id', auth, authorize('Admin'), ctrl.remove);
module.exports = router;
