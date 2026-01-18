const CommunicationNotificationsSettings = require('../models/communicationNotificationsSettings');

const getCommunicationNotificationsSettings = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getCommunicationNotificationsSettings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getCommunicationNotificationsSettingById = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getCommunicationNotificationsSettingById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createCommunicationNotificationsSettings = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newCommunicationNotificationsSetting = await CommunicationNotificationsSettings.create(data);

    res.status(201).json(newCommunicationNotificationsSetting);
  } catch (error) {
    console.error('Error in createCommunicationNotificationsSettings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateCommunicationNotificationsSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const communicationnotificationssettingId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(communicationnotificationssettingId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedCommunicationNotificationsSetting = await CommunicationNotificationsSettings.update(communicationnotificationssettingId, data);

    if (!updatedCommunicationNotificationsSetting) {
      return res.status(404).json({ message: 'CommunicationNotificationsSetting not found' });
    }

    res.json(updatedCommunicationNotificationsSetting);
  } catch (error) {
    console.error('Error in updateCommunicationNotificationsSettings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteCommunicationNotificationsSettings = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in deleteCommunicationNotificationsSettings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getCommunicationNotificationsSettings,
  getCommunicationNotificationsSettingById,
  createCommunicationNotificationsSettings,
  updateCommunicationNotificationsSettings,
  deleteCommunicationNotificationsSettings,
};
