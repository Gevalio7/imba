const TemplateAttachments = require('../models/templateAttachments');
const { asyncHandler } = require('../middleware/errorHandler');

const getTemplateAttachments = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await TemplateAttachments.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getTemplateAttachmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const templateattachmentId = parseInt(id, 10);

  if (isNaN(templateattachmentId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const templateattachment = await TemplateAttachments.getById(templateattachmentId);

  if (!templateattachment) {
    return res.status(404).json({ message: 'TemplateAttachment not found' });
  }

  res.json(templateattachment);
});

const createTemplateAttachments = asyncHandler(async (req, res) => {
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

  const newTemplateAttachment = await TemplateAttachments.create(data);

  res.status(201).json(newTemplateAttachment);
});

const updateTemplateAttachments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const templateattachmentId = parseInt(id, 10);

  if (isNaN(templateattachmentId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedTemplateAttachment = await TemplateAttachments.update(templateattachmentId, data);

  if (!updatedTemplateAttachment) {
    return res.status(404).json({ message: 'TemplateAttachment not found' });
  }

  res.json(updatedTemplateAttachment);
});

const deleteTemplateAttachments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const templateattachmentId = parseInt(id, 10);

  if (isNaN(templateattachmentId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await TemplateAttachments.delete(templateattachmentId);

  if (!deleted) {
    return res.status(404).json({ message: 'TemplateAttachment not found' });
  }

  res.status(204).send();
});

module.exports = {
  getTemplateAttachments,
  getTemplateAttachmentById,
  createTemplateAttachments,
  updateTemplateAttachments,
  deleteTemplateAttachments,
};
