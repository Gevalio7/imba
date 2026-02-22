const express = require('express');
const router = express.Router();
const TicketHistory = require('../models/ticketHistory');

// GET /api/ticketHistory - Получить историю изменений
router.get('/', async (req, res) => {
  try {
    const { ticketId, fieldName, sortBy, orderBy, itemsPerPage, page } = req.query;
    
    const result = await TicketHistory.getAll({
      ticketId,
      fieldName,
      sortBy,
      orderBy,
      itemsPerPage: itemsPerPage ? parseInt(itemsPerPage) : 100,
      page: page ? parseInt(page) : 1,
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching ticket history:', error);
    res.status(500).json({ error: 'Ошибка при получении истории изменений' });
  }
});

// GET /api/ticketHistory/approval/:ticketId - Получить историю согласования
router.get('/approval/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const result = await TicketHistory.getApprovalHistory(ticketId);
    res.json({ approvals: result });
  } catch (error) {
    console.error('Error fetching approval history:', error);
    res.status(500).json({ error: 'Ошибка при получении истории согласования' });
  }
});

// GET /api/ticketHistory/:id - Получить запись по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await TicketHistory.getById(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching history entry:', error);
    res.status(500).json({ error: 'Ошибка при получении записи' });
  }
});

// POST /api/ticketHistory - Создать запись истории
router.post('/', async (req, res) => {
  try {
    const { ticketId, changedBy, fieldName, oldValue, newValue } = req.body;
    
    if (!ticketId || !fieldName) {
      return res.status(400).json({ error: 'ticketId и fieldName обязательны' });
    }

    const result = await TicketHistory.create({
      ticketId,
      changedBy,
      fieldName,
      oldValue,
      newValue,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating history entry:', error);
    res.status(500).json({ error: 'Ошибка при создании записи истории' });
  }
});

// DELETE /api/ticketHistory/:id - Удалить запись
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await TicketHistory.delete(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    
    res.json({ message: 'Запись успешно удалена' });
  } catch (error) {
    console.error('Error deleting history entry:', error);
    res.status(500).json({ error: 'Ошибка при удалении записи' });
  }
});

module.exports = router;
