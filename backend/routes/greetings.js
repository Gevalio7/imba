const express = require('express');
const router = express.Router();
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
router.post('/', createGreetings);

// PUT /greetings/:id
router.put('/:id', updateGreetings);

// DELETE /greetings/:id
router.delete('/:id', deleteGreetings);

module.exports = router;
