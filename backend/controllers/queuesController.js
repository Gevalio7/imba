const Queues = require('../models/queues');
const { asyncHandler } = require('../middleware/errorHandler');

const getQueues = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page, companyId, serviceId, slaId, agentGroupId, departmentId } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 1000;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  // Фильтры
  const filters = {};
  if (companyId) filters.companyId = parseInt(companyId, 10);
  if (serviceId) filters.serviceId = parseInt(serviceId, 10);
  if (slaId) filters.slaId = parseInt(slaId, 10);
  if (agentGroupId) filters.agentGroupId = parseInt(agentGroupId, 10);
  if (departmentId) filters.departmentId = parseInt(departmentId, 10);

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

  // Добавляем templateId если передан
  if (req.body.templateId !== undefined) {
    data.templateId = req.body.templateId;
  }

  // Новые поля шаблонов
  if (req.body.templateOpenTicketId !== undefined) {
    data.templateOpenTicketId = req.body.templateOpenTicketId;
  }
  if (req.body.templateCloseTicketId !== undefined) {
    data.templateCloseTicketId = req.body.templateCloseTicketId;
  }
  if (req.body.templateConfirmTicketId !== undefined) {
    data.templateConfirmTicketId = req.body.templateConfirmTicketId;
  }
  if (req.body.templateStatusChangeId !== undefined) {
    data.templateStatusChangeId = req.body.templateStatusChangeId;
  }
  if (req.body.templateCommentTicketId !== undefined) {
    data.templateCommentTicketId = req.body.templateCommentTicketId;
  }

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Новые поля: companyId, departmentId, serviceId, slaId, workflowId, agentGroupId, priorityId
  if (req.body.companyId !== undefined) {
    data.companyId = req.body.companyId;
  }
  if (req.body.departmentId !== undefined) {
    data.departmentId = req.body.departmentId;
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
  if (req.body.typeId !== undefined) {
    data.typeId = req.body.typeId;
  }
  if (req.body.categoryId !== undefined) {
    data.categoryId = req.body.categoryId;
  }
  if (req.body.postMasterMailAccountId !== undefined) {
    data.postMasterMailAccountId = req.body.postMasterMailAccountId;
  }

  // Новые поля: executorGroupIds, executorAgentIds, observerGroupIds, observerAgentIds
  if (req.body.executorGroupIds !== undefined) {
    if (Array.isArray(req.body.executorGroupIds)) {
      data.executorGroupIds = req.body.executorGroupIds;
    }
  }
  if (req.body.executorAgentIds !== undefined) {
    if (Array.isArray(req.body.executorAgentIds)) {
      data.executorAgentIds = req.body.executorAgentIds;
    }
  }
  if (req.body.observerGroupIds !== undefined) {
    if (Array.isArray(req.body.observerGroupIds)) {
      data.observerGroupIds = req.body.observerGroupIds;
    }
  }
  if (req.body.observerAgentIds !== undefined) {
    if (Array.isArray(req.body.observerAgentIds)) {
      data.observerAgentIds = req.body.observerAgentIds;
    }
  }

  // Email конфигурация (JSONB)
  if (req.body.emailConfig !== undefined) {
    if (typeof req.body.emailConfig === 'string') {
      try {
        data.emailConfig = JSON.parse(req.body.emailConfig);
      } catch (error) {
        return res.status(400).json({ message: 'emailConfig must be valid JSON' });
      }
    } else {
      data.emailConfig = req.body.emailConfig;
    }
  }

  // Ключевые слова для авто-маршрутизации
  if (req.body.keywords !== undefined) {
    if (typeof req.body.keywords === 'string') {
      data.keywords = req.body.keywords.split(',').map(k => k.trim()).filter(k => k);
    } else if (Array.isArray(req.body.keywords)) {
      data.keywords = req.body.keywords;
    } else {
      data.keywords = null;
    }
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

  // Добавляем templateId если передан
  if (req.body.templateId !== undefined) {
    data.templateId = req.body.templateId;
  }

  // Новые поля шаблонов
  if (req.body.templateOpenTicketId !== undefined) {
    data.templateOpenTicketId = req.body.templateOpenTicketId;
  }
  if (req.body.templateCloseTicketId !== undefined) {
    data.templateCloseTicketId = req.body.templateCloseTicketId;
  }
  if (req.body.templateConfirmTicketId !== undefined) {
    data.templateConfirmTicketId = req.body.templateConfirmTicketId;
  }
  if (req.body.templateStatusChangeId !== undefined) {
    data.templateStatusChangeId = req.body.templateStatusChangeId;
  }
  if (req.body.templateCommentTicketId !== undefined) {
    data.templateCommentTicketId = req.body.templateCommentTicketId;
  }

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Новые поля: companyId, departmentId, serviceId, slaId, workflowId, agentGroupId, priorityId
  if (req.body.companyId !== undefined) {
    data.companyId = req.body.companyId;
  }
  if (req.body.departmentId !== undefined) {
    data.departmentId = req.body.departmentId;
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
  if (req.body.typeId !== undefined) {
    data.typeId = req.body.typeId;
  }
  if (req.body.categoryId !== undefined) {
    data.categoryId = req.body.categoryId;
  }
  if (req.body.postMasterMailAccountId !== undefined) {
    data.postMasterMailAccountId = req.body.postMasterMailAccountId;
  }

  // Новые поля: executorGroupIds, executorAgentIds, observerGroupIds, observerAgentIds, approverGroupIds, approverAgentIds
  if (req.body.executorGroupIds !== undefined) {
    if (Array.isArray(req.body.executorGroupIds)) {
      data.executorGroupIds = req.body.executorGroupIds;
    }
  }
  if (req.body.executorAgentIds !== undefined) {
    if (Array.isArray(req.body.executorAgentIds)) {
      data.executorAgentIds = req.body.executorAgentIds;
    }
  }
  if (req.body.observerGroupIds !== undefined) {
    if (Array.isArray(req.body.observerGroupIds)) {
      data.observerGroupIds = req.body.observerGroupIds;
    }
  }
  if (req.body.observerAgentIds !== undefined) {
    if (Array.isArray(req.body.observerAgentIds)) {
      data.observerAgentIds = req.body.observerAgentIds;
    }
  }
  if (req.body.approverGroupIds !== undefined) {
    if (Array.isArray(req.body.approverGroupIds)) {
      data.approverGroupIds = req.body.approverGroupIds;
    }
  }
  if (req.body.approverAgentIds !== undefined) {
    if (Array.isArray(req.body.approverAgentIds)) {
      data.approverAgentIds = req.body.approverAgentIds;
    }
  }

  // Email конфигурация (JSONB)
  if (req.body.emailConfig !== undefined) {
    if (typeof req.body.emailConfig === 'string') {
      try {
        data.emailConfig = JSON.parse(req.body.emailConfig);
      } catch (error) {
        return res.status(400).json({ message: 'emailConfig must be valid JSON' });
      }
    } else {
      data.emailConfig = req.body.emailConfig;
    }
  }

  // Ключевые слова для авто-маршрутизации
  if (req.body.keywords !== undefined) {
    if (typeof req.body.keywords === 'string') {
      data.keywords = req.body.keywords.split(',').map(k => k.trim()).filter(k => k);
    } else {
      data.keywords = req.body.keywords;
    }
  }

  // Шаблон авто-ответа
  if (req.body.autoResponseTemplate !== undefined) {
    data.autoResponseTemplate = req.body.autoResponseTemplate;
  }

  // Быстрые ответы из базы знаний
  if (req.body.quickAnswerArticleIds !== undefined) {
    if (Array.isArray(req.body.quickAnswerArticleIds)) {
      data.quickAnswerArticleIds = req.body.quickAnswerArticleIds;
    } else if (req.body.quickAnswerArticleIds === null) {
      data.quickAnswerArticleIds = null;
    }
  }

  // Ключевые слова для авто-маршрутизации
  if (req.body.keywords !== undefined) {
    if (typeof req.body.keywords === 'string') {
      data.keywords = req.body.keywords.split(',').map(k => k.trim()).filter(k => k);
    } else if (Array.isArray(req.body.keywords)) {
      data.keywords = req.body.keywords;
    } else {
      data.keywords = null;
    }
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

