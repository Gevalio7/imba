const ProcessesAutomationSettings = require('../models/processesAutomationSettings');
const { asyncHandler } = require('../middleware/errorHandler');

const getProcessesAutomationSettings = asyncHandler(async (req, res) => {
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
});

const getProcessesAutomationSettingById = asyncHandler(async (req, res) => {
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
});

const createProcessesAutomationSettings = asyncHandler(async (req, res) => {
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

  const newProcessesAutomationSetting = await ProcessesAutomationSettings.create(data);

  res.status(201).json(newProcessesAutomationSetting);
});

const updateProcessesAutomationSettings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const processesautomationsettingId = parseInt(id, 10);

  if (isNaN(processesautomationsettingId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.description !== undefined) data.description = req.body.description;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedProcessesAutomationSetting = await ProcessesAutomationSettings.update(processesautomationsettingId, data);

  if (!updatedProcessesAutomationSetting) {
    return res.status(404).json({ message: 'ProcessesAutomationSetting not found' });
  }

  res.json(updatedProcessesAutomationSetting);
});

const deleteProcessesAutomationSettings = asyncHandler(async (req, res) => {
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
});

module.exports = {
  getProcessesAutomationSettings,
  getProcessesAutomationSettingById,
  createProcessesAutomationSettings,
  updateProcessesAutomationSettings,
  deleteProcessesAutomationSettings,
};
