const ProcessesAutomationSettings = require('../models/processesAutomationSettings');

const getProcessesAutomationSettings = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await ProcessesAutomationSettings.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getProcessesAutomationSettings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getProcessesAutomationSettingById = async (req, res) => {
  try {
    const { id } = req.params;
    const processesautomationsettingId = parseInt(id, 10);

    if (isNaN(processesautomationsettingId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const processesautomationsetting = await ProcessesAutomationSettings.getById(processesautomationsettingId);

    if (!processesautomationsetting) {
      return res.status(404).json({ message: 'ProcessesAutomationSetting not found' });
    }

    res.json(processesautomationsetting);
  } catch (error) {
    console.error('Error in getProcessesAutomationSettingById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createProcessesAutomationSettings = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newProcessesAutomationSetting = await ProcessesAutomationSettings.create({ name, description, status, isActive });

    res.status(201).json(newProcessesAutomationSetting);
  } catch (error) {
    console.error('Error in createProcessesAutomationSettings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateProcessesAutomationSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const processesautomationsettingId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(processesautomationsettingId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedProcessesAutomationSetting = await ProcessesAutomationSettings.update(processesautomationsettingId, { name, description, status, isActive });

    if (!updatedProcessesAutomationSetting) {
      return res.status(404).json({ message: 'ProcessesAutomationSetting not found' });
    }

    res.json(updatedProcessesAutomationSetting);
  } catch (error) {
    console.error('Error in updateProcessesAutomationSettings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteProcessesAutomationSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const processesautomationsettingId = parseInt(id, 10);

    if (isNaN(processesautomationsettingId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await ProcessesAutomationSettings.delete(processesautomationsettingId);

    if (!deleted) {
      return res.status(404).json({ message: 'ProcessesAutomationSetting not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteProcessesAutomationSettings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getProcessesAutomationSettings,
  getProcessesAutomationSettingById,
  createProcessesAutomationSettings,
  updateProcessesAutomationSettings,
  deleteProcessesAutomationSettings,
};
