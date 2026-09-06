const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const ctrl = require('../controllers/staffController');
router.get('/', auth, authorize('Admin'), ctrl.getAll);
router.get('/:id', auth, authorize('Admin'), ctrl.getOne);
router.post('/', auth, authorize('Admin'), ctrl.create);
router.put('/:id', auth, authorize('Admin'), ctrl.update);
router.delete('/:id', auth, authorize('Admin'), ctrl.remove);
module.exports = router;
