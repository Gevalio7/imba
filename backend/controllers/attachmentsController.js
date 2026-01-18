const Attachments = require('../models/attachments');
const { asyncHandler } = require('../middleware/errorHandler');

const getAttachments = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await Attachments.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getAttachmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const attachmentId = parseInt(id, 10);

  if (isNaN(attachmentId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const attachment = await Attachments.getById(attachmentId);

  if (!attachment) {
    return res.status(404).json({ message: 'Attachment not found' });
  }

  res.json(attachment);
});

const createAttachments = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.fileName = req.body.fileName;
  data.type = req.body.type;
  data.comment = req.body.comment;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newAttachment = await Attachments.create(data);

  res.status(201).json(newAttachment);
});

const updateAttachments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const attachmentId = parseInt(id, 10);

  if (isNaN(attachmentId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.fileName !== undefined) data.fileName = req.body.fileName;
  if (req.body.type !== undefined) data.type = req.body.type;
  if (req.body.comment !== undefined) data.comment = req.body.comment;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedAttachment = await Attachments.update(attachmentId, data);

  if (!updatedAttachment) {
    return res.status(404).json({ message: 'Attachment not found' });
  }

  res.json(updatedAttachment);
});

const deleteAttachments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const attachmentId = parseInt(id, 10);

  if (isNaN(attachmentId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await Attachments.delete(attachmentId);

  if (!deleted) {
    return res.status(404).json({ message: 'Attachment not found' });
  }

  res.status(204).send();
});

module.exports = {
  getAttachments,
  getAttachmentById,
  createAttachments,
  updateAttachments,
  deleteAttachments,
};
