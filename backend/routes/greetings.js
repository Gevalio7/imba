const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getGreetings,
  getGreetingById,
  createGreetings,
  updateGreetings,
  deleteGreetings,
} = require('../controllers/greetingsController');

// GET /greetings - список с query params
router.get('/', getGreetings);

// GET /greetings/:id
router.get('/:id', getGreetingById);

// POST /greetings
router.post('/', protect, checkPermission('menu_greetings_write'), createGreetings);

// PUT /greetings/:id
router.put('/:id', protect, checkPermission('menu_greetings_write'), updateGreetings);

// DELETE /greetings/:id
router.delete('/:id', protect, checkPermission('menu_greetings_delete'), deleteGreetings);

module.exports = router;
