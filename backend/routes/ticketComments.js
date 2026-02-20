const express = require('express');
const router = express.Router();
const TicketComments = require('../models/ticketComments');

// GET /ticket-comments - список с query params
router.get('/', async (req, res) => {
  try {
    const { ticketId, q, sortBy, orderBy, itemsPerPage, page } = req.query;
    const result = await TicketComments.getAll({
      ticketId,
      q,
      sortBy,
      orderBy,
      itemsPerPage: itemsPerPage ? parseInt(itemsPerPage) : 100,
      page: page ? parseInt(page) : 1,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /ticket-comments/:id
router.get('/:id', async (req, res) => {
  try {
    const comment = await TicketComments.getById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /ticket-comments
router.post('/', async (req, res) => {
  try {
    const comment = await TicketComments.create(req.body);
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /ticket-comments/:id
router.put('/:id', async (req, res) => {
  try {
    const comment = await TicketComments.update(req.params.id, req.body);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /ticket-comments/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await TicketComments.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
