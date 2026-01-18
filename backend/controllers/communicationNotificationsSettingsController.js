const CommunicationNotificationsSettings = require('../models/communicationNotificationsSettings');
const { asyncHandler } = require('../middleware/errorHandler');

const getCommunicationNotificationsSettings = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await CommunicationNotificationsSettings.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getCommunicationNotificationsSettingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const communicationnotificationssettingId = parseInt(id, 10);

  if (isNaN(communicationnotificationssettingId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const communicationnotificationssetting = await CommunicationNotificationsSettings.getById(communicationnotificationssettingId);

  if (!communicationnotificationssetting) {
    return res.status(404).json({ message: 'CommunicationNotificationsSetting not found' });
  }

  res.json(communicationnotificationssetting);
});

const createCommunicationNotificationsSettings = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.description = req.body.description;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newCommunicationNotificationsSetting = await CommunicationNotificationsSettings.create(data);

  res.status(201).json(newCommunicationNotificationsSetting);
});

const updateCommunicationNotificationsSettings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const communicationnotificationssettingId = parseInt(id, 10);

  if (isNaN(communicationnotificationssettingId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.description !== undefined) data.description = req.body.description;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedCommunicationNotificationsSetting = await CommunicationNotificationsSettings.update(communicationnotificationssettingId, data);

  if (!updatedCommunicationNotificationsSetting) {
    return res.status(404).json({ message: 'CommunicationNotificationsSetting not found' });
  }

  res.json(updatedCommunicationNotificationsSetting);
});

const deleteCommunicationNotificationsSettings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const communicationnotificationssettingId = parseInt(id, 10);

  if (isNaN(communicationnotificationssettingId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await CommunicationNotificationsSettings.delete(communicationnotificationssettingId);

  if (!deleted) {
    return res.status(404).json({ message: 'CommunicationNotificationsSetting not found' });
  }

  res.status(204).send();
});

module.exports = {
  getCommunicationNotificationsSettings,
  getCommunicationNotificationsSettingById,
  createCommunicationNotificationsSettings,
  updateCommunicationNotificationsSettings,
  deleteCommunicationNotificationsSettings,
};
