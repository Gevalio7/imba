const express = require('express');
const router = express.Router();
const multer = require('multer');
const TicketAttachments = require('../models/ticketAttachments');
const TicketHistory = require('../models/ticketHistory');

// Настройка multer для загрузки файлов в память
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Разрешаем все типы файлов
    cb(null, true);
  },
});

// GET /ticket-attachments - список с query params
router.get('/', async (req, res) => {
  try {
    const { ticketId, sortBy, orderBy, itemsPerPage, page } = req.query;
    const result = await TicketAttachments.getAll({
      ticketId,
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

// GET /ticket-attachments/:id
router.get('/:id', async (req, res) => {
  try {
    const attachment = await TicketAttachments.getById(req.params.id);
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    res.json(attachment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /ticket-attachments - загрузка файла
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { ticketId, uploaderId } = req.body;
    
    if (!ticketId) {
      return res.status(400).json({ error: 'ticketId is required' });
    }

    // Сохраняем файл на диск
    const filename = await TicketAttachments.saveFile(req.file);
    
    // Создаем запись в базе
    const attachment = await TicketAttachments.create({
      ticketId: parseInt(ticketId),
      filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      filesize: req.file.size,
      uploaderId: uploaderId ? parseInt(uploaderId) : null,
    });

    // Записываем в историю
    await TicketHistory.create({
      ticketId: parseInt(ticketId),
      changedBy: uploaderId ? parseInt(uploaderId) : null,
      fieldName: 'attachment',
      oldValue: null,
      newValue: `Добавлен файл: ${req.file.originalname}`,
    });

    res.status(201).json(attachment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /ticket-attachments/:id
router.delete('/:id', async (req, res) => {
  try {
    // Получаем информацию о вложении перед удалением
    const attachment = await TicketAttachments.getById(req.params.id);
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    
    const deleted = await TicketAttachments.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    
    // Записываем в историю (используем uploaderId из вложения если нет req.user)
    const changedBy = req.user?.id || attachment.uploaderId || null;
    await TicketHistory.create({
      ticketId: attachment.ticketId,
      changedBy,
      fieldName: 'attachment',
      oldValue: `Файл: ${attachment.originalName || attachment.filename}`,
      newValue: 'Удалён',
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
