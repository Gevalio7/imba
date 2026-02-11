const EmailAddresses = require('../models/emailAddresses');
const { asyncHandler } = require('../middleware/errorHandler');

const getEmailAddresses = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await EmailAddresses.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getEmailAddressById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const emailaddressId = parseInt(id, 10);

  if (isNaN(emailaddressId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const emailaddress = await EmailAddresses.getById(emailaddressId);

  if (!emailaddress) {
    return res.status(404).json({ message: 'EmailAddress not found' });
  }

  res.json(emailaddress);
});

const createEmailAddresses = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.message = req.body.message;

  // Добавляем queueId если передан
  if (req.body.queueId !== undefined) {
    data.queueId = req.body.queueId;
  }

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newEmailAddress = await EmailAddresses.create(data);

  res.status(201).json(newEmailAddress);
});

const updateEmailAddresses = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const emailaddressId = parseInt(id, 10);

  if (isNaN(emailaddressId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;

  // Добавляем queueId если передан
  if (req.body.queueId !== undefined) {
    data.queueId = req.body.queueId;
  }

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedEmailAddress = await EmailAddresses.update(emailaddressId, data);

  if (!updatedEmailAddress) {
    return res.status(404).json({ message: 'EmailAddress not found' });
  }

  res.json(updatedEmailAddress);
});

const deleteEmailAddresses = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const emailaddressId = parseInt(id, 10);

  if (isNaN(emailaddressId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await EmailAddresses.delete(emailaddressId);

  if (!deleted) {
    return res.status(404).json({ message: 'EmailAddress not found' });
  }

  res.status(204).send();
});

module.exports = {
  getEmailAddresses,
  getEmailAddressById,
  createEmailAddresses,
  updateEmailAddresses,
  deleteEmailAddresses,
};
