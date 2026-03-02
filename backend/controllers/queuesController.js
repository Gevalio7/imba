const Queues = require('../models/queues');
const { asyncHandler } = require('../middleware/errorHandler');

const getQueues = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page, companyId, serviceId, slaId, agentGroupId } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  // Фильтры
  const filters = {};
  if (companyId) filters.companyId = parseInt(companyId, 10);
  if (serviceId) filters.serviceId = parseInt(serviceId, 10);
  if (slaId) filters.slaId = parseInt(slaId, 10);
  if (agentGroupId) filters.agentGroupId = parseInt(agentGroupId, 10);

  const result = await Queues.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
    filters,
  });

  res.json(result);
});

const getQueueById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const queueId = parseInt(id, 10);

  if (isNaN(queueId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const queue = await Queues.getById(queueId);

  if (!queue) {
    return res.status(404).json({ message: 'Queue not found' });
  }

  res.json(queue);
});

const createQueues = asyncHandler(async (req, res) => {
  console.log('📝 Создание очереди, тело запроса:', req.body);
  
  const data = {};
  data.name = req.body.name;
  data.description = req.body.description;
  data.maxTickets = req.body.maxTickets;
  data.priority = req.body.priority;

  // Добавляем templateId если передан
  if (req.body.templateId !== undefined) {
    data.templateId = req.body.templateId;
  }

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Новые поля: companyId, serviceId, slaId, workflowId, agentGroupId, priorityId
  if (req.body.companyId !== undefined) {
    data.companyId = req.body.companyId;
  }
  if (req.body.serviceId !== undefined) {
    data.serviceId = req.body.serviceId;
  }
  if (req.body.slaId !== undefined) {
    data.slaId = req.body.slaId;
  }
  if (req.body.workflowId !== undefined) {
    data.workflowId = req.body.workflowId;
  }
  if (req.body.agentGroupId !== undefined) {
    data.agentGroupId = req.body.agentGroupId;
  }
  if (req.body.priorityId !== undefined) {
    data.priorityId = req.body.priorityId;
  }

  // Email конфигурация (JSONB)
  if (req.body.emailConfig !== undefined) {
    data.emailConfig = req.body.emailConfig;
  }

  // Ключевые слова для авто-маршрутизации
  if (req.body.keywords !== undefined) {
    data.keywords = req.body.keywords;
  }

  // Шаблон авто-ответа
  if (req.body.autoResponseTemplate !== undefined) {
    data.autoResponseTemplate = req.body.autoResponseTemplate;
  }

  console.log('📝 Данные для создания:', data);

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newQueue = await Queues.create(data);
  
  console.log('✅ Очередь создана:', newQueue);

  res.status(201).json(newQueue);
});

const updateQueues = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const queueId = parseInt(id, 10);

  if (isNaN(queueId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.description !== undefined) data.description = req.body.description;
  if (req.body.maxTickets !== undefined) data.maxTickets = req.body.maxTickets;
  if (req.body.priority !== undefined) data.priority = req.body.priority;

  // Добавляем templateId если передан
  if (req.body.templateId !== undefined) {
    data.templateId = req.body.templateId;
  }

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Новые поля: companyId, serviceId, slaId, workflowId, agentGroupId, priorityId
  if (req.body.companyId !== undefined) {
    data.companyId = req.body.companyId;
  }
  if (req.body.serviceId !== undefined) {
    data.serviceId = req.body.serviceId;
  }
  if (req.body.slaId !== undefined) {
    data.slaId = req.body.slaId;
  }
  if (req.body.workflowId !== undefined) {
    data.workflowId = req.body.workflowId;
  }
  if (req.body.agentGroupId !== undefined) {
    data.agentGroupId = req.body.agentGroupId;
  }
  if (req.body.priorityId !== undefined) {
    data.priorityId = req.body.priorityId;
  }

  // Email конфигурация (JSONB)
  if (req.body.emailConfig !== undefined) {
    data.emailConfig = req.body.emailConfig;
  }

  // Ключевые слова для авто-маршрутизации
  if (req.body.keywords !== undefined) {
    data.keywords = req.body.keywords;
  }

  // Шаблон авто-ответа
  if (req.body.autoResponseTemplate !== undefined) {
    data.autoResponseTemplate = req.body.autoResponseTemplate;
  }

  const updatedQueue = await Queues.update(queueId, data);

  if (!updatedQueue) {
    return res.status(404).json({ message: 'Queue not found' });
  }

  res.json(updatedQueue);
});

const deleteQueues = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const queueId = parseInt(id, 10);

  if (isNaN(queueId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await Queues.delete(queueId);

  if (!deleted) {
    return res.status(404).json({ message: 'Queue not found' });
  }

  res.status(204).send();
});

module.exports = {
  getQueues,
  getQueueById,
  createQueues,
  updateQueues,
  deleteQueues,
};

