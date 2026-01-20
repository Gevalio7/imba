const Templates = require('../models/templates');
const Queues = require('../models/queues');
const { asyncHandler } = require('../middleware/errorHandler');

const getTemplates = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await Templates.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getTemplateById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const templateId = parseInt(id, 10);

  if (isNaN(templateId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const template = await Templates.getById(templateId);

  if (!template) {
    return res.status(404).json({ message: 'Template not found' });
  }

  res.json(template);
});

const createTemplates = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newTemplate = await Templates.create(data);

  res.status(201).json(newTemplate);
});

const updateTemplates = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const templateId = parseInt(id, 10);

  if (isNaN(templateId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedTemplate = await Templates.update(templateId, data);

  if (!updatedTemplate) {
    return res.status(404).json({ message: 'Template not found' });
  }

  res.json(updatedTemplate);
});

const deleteTemplates = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const templateId = parseInt(id, 10);

  if (isNaN(templateId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  // Проверяем, используется ли шаблон в очередях
  const { pool } = require('../config/db');
  const queuesCheck = await pool.query(
    'SELECT COUNT(*) as count FROM queues WHERE template_id = $1',
    [templateId]
  );
  
  const queuesCount = parseInt(queuesCheck.rows[0].count);
  if (queuesCount > 0) {
    return res.status(400).json({
      message: `Невозможно удалить шаблон. Он используется в ${queuesCount} очередях. Сначала удалите связь с очередями.`,
      queuesCount
    });
  }

  const deleted = await Templates.delete(templateId);

  if (!deleted) {
    return res.status(404).json({ message: 'Template not found' });
  }

  res.status(204).send();
});

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplates,
  updateTemplates,
  deleteTemplates,
};
