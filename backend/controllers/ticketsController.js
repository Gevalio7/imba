const Tickets = require('../models/tickets');
const Types = require('../models/types');
const TypeCategories = require('../models/typeCategories');
const WorkflowTransitions = require('../models/workflowTransitions');
const TicketHistory = require('../models/ticketHistory');
const TicketStatusHistory = require('../models/ticketStatusHistory');
const Priorities = require('../models/priorities');
const Queues = require('../models/queues');
const States = require('../models/states');
const Agents = require('../models/agents');
const Customers = require('../models/customers');
const Services = require('../models/services');
const Sla = require('../models/sla');
const CustomerUsers = require('../models/customerUsers');
const SystemConfiguration = require('../models/systemConfiguration');
const { asyncHandler } = require('../middleware/errorHandler');

let configCache = null;

async function getConfigValue(key, defaultValue = null) {
  if (!configCache) {
    const result = await SystemConfiguration.getAll({ itemsPerPage: 50 });
    configCache = result.systemConfiguration || [];
  }
  const found = configCache.find(c => c.key === key || c.name === key);
  return found?.value === 'true' ? true : found?.value === 'false' ? false : found?.value || defaultValue;
}

// Маппинг названий полей для отображения
const fieldDisplayNames = {
  title: 'Заголовок',
  description: 'Описание',
  typeId: 'Тип',
  categoryId: 'Категория',
  priorityId: 'Приоритет',
  queueId: 'Очередь',
  stateId: 'Статус',
  ownerId: 'Владелец',
  companyId: 'Компания',
  serviceId: 'Сервис',
  slaId: 'SLA',
  isActive: 'Активен',
  attachment: 'Вложение',
  responseDeadline: 'Срок первого ответа',
  resolutionDeadline: 'Срок решения',
  firstResponseAt: 'Первый ответ',
  slaViolated: 'SLA нарушен',
  pendingStartAt: 'Начало ожидания',
};

const getTickets = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page, isActive } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 1000;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await Tickets.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
    isActive: isActive,
  });

  res.json(result);
});

const getTicketById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticketId = parseInt(id, 10);

  if (isNaN(ticketId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  // Включаем неактивные тикеты для редактирования
  const ticket = await Tickets.getById(ticketId, true);

  if (!ticket) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  res.json(ticket);
});

// =====================================================
// НОВЫЙ МЕТОД: Получить доступные действия для тикета
// GET /api/tickets/:id/actions
// =====================================================
const getTicketActions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticketId = parseInt(id, 10);

  if (isNaN(ticketId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  // Получаем тикет (включая неактивные)
  const ticket = await Tickets.getById(ticketId, true);
  if (!ticket) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  // Получаем тип тикета с workflow_id
  const type = ticket.typeId ? await Types.getById(ticket.typeId) : null;
  
  // Если у типа нет воркфлоу, возвращаем пустой массив
  if (!type || !type.workflowId) {
    return res.json({ 
      actions: [],
      message: 'No workflow configured for this ticket type'
    });
  }

  // Получаем доступные переходы
  const transitions = await WorkflowTransitions.getAvailableTransitions(
    type.workflowId,
    ticket.stateId
  );

  res.json({
    ticketId: ticket.id,
    currentStatusId: ticket.stateId,
    currentStatusName: ticket.stateName,
    workflowId: type.workflowId,
    actions: transitions.map(t => ({
      id: t.id,
      label: t.actionLabel,
      targetStatusId: t.targetStatusId,
      targetStatusName: t.targetStatusName,
      targetStatusColor: t.targetStatusColor,
    })),
  });
});

const createTicket = asyncHandler(async (req, res) => {
  const data = {};
  
  // Generate ticket number if not provided
  if (!req.body.ticketNumber) {
    data.ticketNumber = await Tickets.generateTicketNumber();
  } else {
    data.ticketNumber = req.body.ticketNumber;
  }
  
  data.title = req.body.title;
  data.description = req.body.description || null;
  data.typeId = req.body.typeId || null;
  data.categoryId = req.body.categoryId || null;
  data.priorityId = req.body.priorityId || null;
  data.queueId = req.body.queueId || null;
  data.companyId = req.body.companyId || null;
  data.serviceId = req.body.serviceId || null;
  data.slaId = req.body.slaId || null;
  
  // =====================================================
  // ЛОГИКА: Обработка ownerId - создание сотрудника по email
  // =====================================================
  let ownerId = req.body.ownerId || null;
  
  if (ownerId && typeof ownerId === 'string' && ownerId.includes('@')) {
    const shouldCreateUser = await getConfigValue('create_customer_user_by_email', false);
    
    if (shouldCreateUser) {
      let existingUser = await CustomerUsers.getByEmail(ownerId);
      
      if (existingUser) {
        ownerId = existingUser.id;
        if (!data.companyId && existingUser?.customerId) {
          data.companyId = existingUser.customerId;
        }
      } else {
        const newCustomerUser = await CustomerUsers.create({
          firstName: 'Новый',
          lastName: 'Сотрудник',
          email: ownerId,
          login: ownerId,
          customerId: req.body.companyId || null,
        });
        
        ownerId = newCustomerUser.id;
      }
    } else {
      ownerId = null;
    }
  }
  else if (ownerId && typeof ownerId === 'object' && ownerId.email) {
    const shouldCreateUser = await getConfigValue('create_customer_user_by_email', false);
    
    if (shouldCreateUser) {
      let existingUser = await CustomerUsers.getByEmail(ownerId.email);
      
      if (existingUser) {
        ownerId = existingUser.id;
        if (!data.companyId && existingUser?.customerId) {
          data.companyId = existingUser.customerId;
        }
      } else {
        const newCustomerUser = await CustomerUsers.create({
          firstName: ownerId.firstName || 'Новый',
          lastName: ownerId.lastName || 'Сотрудник',
          email: ownerId.email,
          login: ownerId.email,
          customerId: ownerId.customerId || req.body.companyId || null,
        });
        
        ownerId = newCustomerUser.id;
      }
    } else {
      ownerId = null;
    }
  }
  
  data.ownerId = ownerId;
  
  // SLA поля
  if (req.body.responseDeadline) data.responseDeadline = req.body.responseDeadline;
  if (req.body.resolutionDeadline) data.resolutionDeadline = req.body.resolutionDeadline;
  if (req.body.firstResponseAt) data.firstResponseAt = req.body.firstResponseAt;
  if (req.body.slaViolated !== undefined) data.slaViolated = req.body.slaViolated;
  if (req.body.pendingStartAt) data.pendingStartAt = req.body.pendingStartAt;
  
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.title) {
    return res.status(400).json({ message: 'title is required' });
  }

  if (!req.body.stateId && data.typeId) {
    const type = await Types.getById(data.typeId);
    
    if (type && type.workflowId) {
      const initialTransition = await WorkflowTransitions.getInitialTransition(type.workflowId);
      
      if (initialTransition) {
        data.stateId = initialTransition.targetStatusId;
      }
    }
  } else if (req.body.stateId) {
    data.stateId = req.body.stateId;
   }

   let executorAgentIds = [];

   const shouldAutoAssign = await getConfigValue('agent_auto_assign_as_executor', false);

   if (shouldAutoAssign && ownerId) {
     const agent = await Agents.getById(ownerId);
     if (agent) {
       executorAgentIds.push(ownerId);
     }
   }

   // Поля исполнителей (массивы ID)
   if (req.body.executorAgentIds !== undefined) {
     // Убеждаемся что это массив и объединяем с автоматически назначенными
     const requestedAgentIds = Array.isArray(req.body.executorAgentIds) ? req.body.executorAgentIds : [];
     data.executorAgentIds = [...new Set([...executorAgentIds, ...requestedAgentIds])];
   } else {
     // Если не переданы, используем автоматически назначенных
     data.executorAgentIds = executorAgentIds;
   }

    if (req.body.executorGroupIds !== undefined) {
      // Убеждаемся что это массив
      data.executorGroupIds = Array.isArray(req.body.executorGroupIds) ? req.body.executorGroupIds : [];
    } else {
      data.executorGroupIds = executorGroupIds;
    }

    // Поля эскалации
    if (req.body.observerAgentIds !== undefined) {
      data.observerAgentIds = Array.isArray(req.body.observerAgentIds) ? req.body.observerAgentIds : [];
    }
    if (req.body.observerGroupIds !== undefined) {
      data.observerGroupIds = Array.isArray(req.body.observerGroupIds) ? req.body.observerGroupIds : [];
    }
    if (req.body.escalationCount !== undefined) data.escalationCount = req.body.escalationCount;
    if (req.body.isEscalated !== undefined) data.isEscalated = req.body.isEscalated;

    // Примечание: валидация категории убрана - frontend требует выбор категории если тип имеет связанные

  const newTicket = await Tickets.create(data);

  // =====================================================
  // SLA дедлайны при создании
  // =====================================================
  if (newTicket.slaId && !data.responseDeadline && !data.resolutionDeadline) {
    try {
      const sla = await Sla.getById(newTicket.slaId);
      if (sla) {
        const now = new Date();
        const responseDeadline = sla.responseTime ? new Date(now.getTime() + sla.responseTime * 60 * 60 * 1000) : null;
        const resolutionDeadline = sla.solutionTime ? new Date(now.getTime() + sla.solutionTime * 60 * 1000) : null;

        const updatedWithDeadlines = await Tickets.update(newTicket.id, {
          responseDeadline,
          resolutionDeadline,
        });

        Object.assign(newTicket, updatedWithDeadlines);
      }
    } catch (slaError) {
      // silent fail
    }
  }

  // =====================================================
  // Записываем историю создания с отображаемыми именами
  // =====================================================
  if (newTicket.stateId) {
    // Получаем имя статуса
    const state = await States.getById(newTicket.stateId);
    const stateName = state ? state.name : String(newTicket.stateId);

    // Используем changedBy из тела запроса, если передан, иначе req.user
    const changedBy = req.body.changedBy || req.user?.id || null;

    await TicketHistory.create({
      ticketId: newTicket.id,
      changedBy: changedBy,
      fieldName: 'stateId',
      oldValue: null,
      newValue: stateName,
    });

    // Записываем переход статуса в историю переходов
    await TicketStatusHistory.recordTransition(
      newTicket.id,
      null, // fromStatusId - null для начального статуса
      newTicket.stateId,
      changedBy,
      'Создание тикета' // actionLabel
    );
  }

  res.status(201).json(newTicket);
});

const updateTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticketId = parseInt(id, 10);

  if (isNaN(ticketId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  // Получаем текущий тикет
  const currentTicket = await Tickets.getById(ticketId, true);
  if (!currentTicket) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  const data = {};
  if (req.body.ticketNumber !== undefined) data.ticketNumber = req.body.ticketNumber;
  if (req.body.title !== undefined) data.title = req.body.title;
  if (req.body.description !== undefined) data.description = req.body.description;
  if (req.body.typeId !== undefined) data.typeId = req.body.typeId;
  if (req.body.categoryId !== undefined) data.categoryId = req.body.categoryId;
  if (req.body.priorityId !== undefined) data.priorityId = req.body.priorityId;
  if (req.body.queueId !== undefined) data.queueId = req.body.queueId;
  if (req.body.ownerId !== undefined) data.ownerId = req.body.ownerId;
  if (req.body.companyId !== undefined) data.companyId = req.body.companyId;
  if (req.body.serviceId !== undefined) data.serviceId = req.body.serviceId;
  if (req.body.slaId !== undefined) data.slaId = req.body.slaId;
  
  // Поля исполнителей (массивы ID)
  if (req.body.executorAgentIds !== undefined) {
    // Убеждаемся что это массив
    data.executorAgentIds = Array.isArray(req.body.executorAgentIds) ? req.body.executorAgentIds : [];
  }
  if (req.body.executorGroupIds !== undefined) {
    // Убеждаемся что это массив
    data.executorGroupIds = Array.isArray(req.body.executorGroupIds) ? req.body.executorGroupIds : [];
  }
  
  // SLA поля
  if (req.body.responseDeadline !== undefined) data.responseDeadline = req.body.responseDeadline;
  if (req.body.resolutionDeadline !== undefined) data.resolutionDeadline = req.body.resolutionDeadline;
  if (req.body.firstResponseAt !== undefined) data.firstResponseAt = req.body.firstResponseAt;
  if (req.body.slaViolated !== undefined) data.slaViolated = req.body.slaViolated;
  if (req.body.pendingStartAt !== undefined) data.pendingStartAt = req.body.pendingStartAt;

  // Поля эскалации
  if (req.body.observerAgentIds !== undefined) {
    data.observerAgentIds = Array.isArray(req.body.observerAgentIds) ? req.body.observerAgentIds : [];
  }
  if (req.body.observerGroupIds !== undefined) {
    data.observerGroupIds = Array.isArray(req.body.observerGroupIds) ? req.body.observerGroupIds : [];
  }
  if (req.body.escalationCount !== undefined) data.escalationCount = req.body.escalationCount;
  if (req.body.isEscalated !== undefined) data.isEscalated = req.body.isEscalated;

  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // =====================================================
  // НОВАЯ ЛОГИКА: Валидация смены статуса
  // =====================================================
  if (req.body.stateId !== undefined && req.body.stateId !== currentTicket.stateId) {
    const newStatusId = req.body.stateId;
    
    // Получаем тип тикета с workflow_id
    const type = currentTicket.typeId ? await Types.getById(currentTicket.typeId) : null;
    
    if (type && type.workflowId) {
      // Проверяем валидность перехода
      const validTransition = await WorkflowTransitions.validateTransition(
        type.workflowId,
        currentTicket.stateId,
        newStatusId
      );
       
      if (!validTransition) {
        return res.status(403).json({ 
          message: 'Invalid transition',
          error: 'TRANSITION_NOT_ALLOWED',
          currentStatus: {
            id: currentTicket.stateId,
            name: currentTicket.stateName,
          },
          requestedStatusId: newStatusId,
          workflowId: type.workflowId,
        });
      }
    } else {
      // Если нет воркфлоу - разрешаем любой переход (для обратной совместимости)
    }
    
    data.stateId = newStatusId;
  }

  // Примечание: валидация категории убрана на frontend
  // Если у типа есть связанные категории - frontend требует выбрать категорию

  const updatedTicket = await Tickets.update(ticketId, data);

  if (!updatedTicket) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  // =====================================================
  // Пересчет SLA дедлайнов при изменении SLA
  // =====================================================
  if (req.body.slaId !== undefined && req.body.slaId !== currentTicket.slaId) {
    if (req.body.slaId) {
      try {
        const sla = await Sla.getById(req.body.slaId);
        if (sla) {
          const now = new Date();
          const responseDeadline = sla.responseTime ? new Date(now.getTime() + sla.responseTime * 60 * 60 * 1000) : null;
          const resolutionDeadline = sla.solutionTime ? new Date(now.getTime() + sla.solutionTime * 60 * 1000) : null;

          await Tickets.update(ticketId, {
            responseDeadline,
            resolutionDeadline,
          });
        }
      } catch (slaError) {
        // silent fail
      }
    } else {
      // Если SLA убран - очищаем дедлайны
      await Tickets.update(ticketId, {
        responseDeadline: null,
        resolutionDeadline: null,
      });
    }
  }

  // =====================================================
  // Записываем историю изменений всех полей
  // =====================================================
  const changedBy = req.body.changedBy || req.user?.id || null;
  const fieldsToTrack = ['title', 'description', 'typeId', 'categoryId', 'priorityId', 'queueId', 'stateId', 'ownerId', 'companyId', 'serviceId', 'slaId', 'isActive', 'responseDeadline', 'resolutionDeadline', 'firstResponseAt', 'slaViolated', 'pendingStartAt', 'executorAgentIds', 'executorGroupIds'];
  
  // Определяем какие справочники нужны на основе изменяемых полей
  const neededLookups = new Set();
  for (const field of fieldsToTrack) {
    if (data[field] !== undefined && currentTicket[field] !== data[field]) {
      if (field === 'typeId') neededLookups.add('types');
      else if (field === 'categoryId') neededLookups.add('typeCategories');
      else if (field === 'priorityId') neededLookups.add('priorities');
      else if (field === 'queueId') neededLookups.add('queues');
      else if (field === 'stateId') neededLookups.add('states');
      else if (field === 'ownerId') neededLookups.add('agents');
      else if (field === 'companyId') neededLookups.add('customers');
      else if (field === 'serviceId') neededLookups.add('services');
      else if (field === 'slaId') neededLookups.add('sla');
      else if (field === 'executorGroupIds') neededLookups.add('agentsGroups');
    }
  }
  
  // Загружаем только необходимые справочники
  const lookupPromises = [];
  const lookupOrder = [];
  if (neededLookups.has('types')) { lookupPromises.push(Types.getAll({ itemsPerPage: 1000 })); lookupOrder.push('types'); }
  if (neededLookups.has('typeCategories')) { lookupPromises.push(TypeCategories.getAll({ itemsPerPage: 1000 })); lookupOrder.push('typeCategories'); }
  if (neededLookups.has('priorities')) { lookupPromises.push(Priorities.getAll({ itemsPerPage: 1000 })); lookupOrder.push('priorities'); }
  if (neededLookups.has('queues')) { lookupPromises.push(Queues.getAll({ itemsPerPage: 1000 })); lookupOrder.push('queues'); }
  if (neededLookups.has('states')) { lookupPromises.push(States.getAll({ itemsPerPage: 1000 })); lookupOrder.push('states'); }
  if (neededLookups.has('agents')) { lookupPromises.push(Agents.getAll({ itemsPerPage: 1000 })); lookupOrder.push('agents'); }
  if (neededLookups.has('customers')) { lookupPromises.push(Customers.getAll({ itemsPerPage: 1000 })); lookupOrder.push('customers'); }
  if (neededLookups.has('services')) { lookupPromises.push(Services.getAll({ itemsPerPage: 1000 })); lookupOrder.push('services'); }
  if (neededLookups.has('sla')) { lookupPromises.push(Sla.getAll({ itemsPerPage: 1000 })); lookupOrder.push('sla'); }
  if (neededLookups.has('agentsGroups')) { 
    const AgentsGroups = require('../models/agentsGroups');
    lookupPromises.push(AgentsGroups.getAll({ itemsPerPage: 1000 })); 
    lookupOrder.push('agentsGroups'); 
  }
  
  const lookupResults = await Promise.all(lookupPromises);
  
  // Извлекаем массивы из результатов
  const lookupData = {};
  lookupOrder.forEach((key, index) => {
    const result = lookupResults[index];
    if (key === 'types') lookupData.typesList = result.types || [];
    else if (key === 'typeCategories') lookupData.typeCategoriesList = result.typeCategories || [];
    else if (key === 'priorities') lookupData.prioritiesList = result.priorities || [];
    else if (key === 'queues') lookupData.queuesList = result.queues || [];
    else if (key === 'states') lookupData.statesList = result.states || [];
    else if (key === 'agents') lookupData.agentsList = result.agents || [];
    else if (key === 'customers') lookupData.customersList = result.customers || [];
    else if (key === 'services') lookupData.servicesList = result.services || [];
    else if (key === 'sla') lookupData.slaList = result.sla || [];
    else if (key === 'agentsGroups') lookupData.agentsGroupsList = result.agentsGroups || [];
  });
  
  const { typesList = [], typeCategoriesList = [], prioritiesList = [], queuesList = [], statesList = [], agentsList = [], customersList = [], servicesList = [], slaList = [], agentsGroupsList = [] } = lookupData;
  
  const historyEntries = [];
  
  for (const field of fieldsToTrack) {
    const oldValue = currentTicket[field];
    const newValue = data[field];
    
    if (newValue === undefined || oldValue === newValue) continue;
    
    let oldDisplayValue = String(oldValue ?? '');
    let newDisplayValue = String(newValue ?? '');
    
    if (field === 'typeId') {
      const oldType = typesList.find(t => t.id === oldValue);
      const newType = typesList.find(t => t.id === newValue);
      oldDisplayValue = oldType ? oldType.name : String(oldValue ?? '');
      newDisplayValue = newType ? newType.name : String(newValue ?? '');
    }
    else if (field === 'categoryId') {
      const oldCategory = typeCategoriesList.find(c => c.id === oldValue);
      const newCategory = typeCategoriesList.find(c => c.id === newValue);
      oldDisplayValue = oldCategory ? oldCategory.name : String(oldValue ?? '');
      newDisplayValue = newCategory ? newCategory.name : String(newValue ?? '');
    }
    else if (field === 'priorityId') {
      const oldPriority = prioritiesList.find(p => p.id === oldValue);
      const newPriority = prioritiesList.find(p => p.id === newValue);
      oldDisplayValue = oldPriority ? oldPriority.name : String(oldValue ?? '');
      newDisplayValue = newPriority ? newPriority.name : String(newValue ?? '');
    }
    else if (field === 'queueId') {
      const oldQueue = queuesList.find(q => q.id === oldValue);
      const newQueue = queuesList.find(q => q.id === newValue);
      oldDisplayValue = oldQueue ? oldQueue.name : String(oldValue ?? '');
      newDisplayValue = newQueue ? newQueue.name : String(newValue ?? '');
    }
    else if (field === 'stateId') {
      const oldState = statesList.find(s => s.id === oldValue);
      const newState = statesList.find(s => s.id === newValue);
      oldDisplayValue = oldState ? oldState.name : String(oldValue ?? '');
      newDisplayValue = newState ? newState.name : String(newValue ?? '');
    }
    else if (field === 'ownerId') {
      const oldAgent = agentsList.find(a => a.id === oldValue);
      const newAgent = agentsList.find(a => a.id === newValue);
      oldDisplayValue = oldAgent ? `${oldAgent.firstName || ''} ${oldAgent.lastName || ''}`.trim() || oldAgent.login : String(oldValue ?? '');
      newDisplayValue = newAgent ? `${newAgent.firstName || ''} ${newAgent.lastName || ''}`.trim() || newAgent.login : String(newValue ?? '');
    }
    else if (field === 'companyId') {
      const oldCustomer = customersList.find(c => c.id === oldValue);
      const newCustomer = customersList.find(c => c.id === newValue);
      oldDisplayValue = oldCustomer ? oldCustomer.name : String(oldValue ?? '');
      newDisplayValue = newCustomer ? newCustomer.name : String(newValue ?? '');
    }
    else if (field === 'slaId') {
      const oldSla = slaList.find(s => s.id === oldValue);
      const newSla = slaList.find(s => s.id === newValue);
      oldDisplayValue = oldSla ? oldSla.name : String(oldValue ?? '');
      newDisplayValue = newSla ? newSla.name : String(newValue ?? '');
    }
    else if (field === 'serviceId') {
      const oldService = servicesList.find(s => s.id === oldValue);
      const newService = servicesList.find(s => s.id === newValue);
      oldDisplayValue = oldService ? oldService.name : String(oldValue ?? '');
      newDisplayValue = newService ? newService.name : String(newValue ?? '');
    }
    else if (field === 'isActive') {
      oldDisplayValue = oldValue ? 'Да' : 'Нет';
      newDisplayValue = newValue ? 'Да' : 'Нет';
    }
    else if (field === 'title') {
      oldDisplayValue = String(oldValue ?? '');
      newDisplayValue = String(newValue ?? '');
    }
    else if (field === 'description') {
      const truncate = (str, len = 50) => {
        if (!str) return '';
        return str.length > len ? str.substring(0, len) + '...' : str;
      };
      oldDisplayValue = truncate(String(oldValue ?? ''));
      newDisplayValue = truncate(String(newValue ?? ''));
    }
    else if (field === 'executorAgentIds') {
      const oldIds = Array.isArray(oldValue) ? oldValue : [];
      const newIds = Array.isArray(newValue) ? newValue : [];
      const oldAgents = agentsList.filter(a => oldIds.includes(a.id));
      const newAgents = agentsList.filter(a => newIds.includes(a.id));
      oldDisplayValue = oldAgents.length > 0 ? oldAgents.map(a => `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.login).join(', ') : '-';
      newDisplayValue = newAgents.length > 0 ? newAgents.map(a => `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.login).join(', ') : '-';
    }
    else if (field === 'executorGroupIds') {
      const oldIds = Array.isArray(oldValue) ? oldValue : [];
      const newIds = Array.isArray(newValue) ? newValue : [];
      const oldGroups = agentsGroupsList.filter(g => oldIds.includes(g.id));
      const newGroups = agentsGroupsList.filter(g => newIds.includes(g.id));
      oldDisplayValue = oldGroups.length > 0 ? oldGroups.map(g => g.name).join(', ') : '-';
      newDisplayValue = newGroups.length > 0 ? newGroups.map(g => g.name).join(', ') : '-';
    }
    
    historyEntries.push({
      ticketId,
      changedBy,
      fieldName: field,
      oldValue: oldDisplayValue,
      newValue: newDisplayValue,
    });

    if (field === 'stateId') {
      await TicketStatusHistory.recordTransition(
        ticketId,
        oldValue,
        newValue,
        changedBy,
        null
      );
    }
  }
  
  if (historyEntries.length > 0) {
    await TicketHistory.batchCreate(historyEntries);
  }
  
  res.json(updatedTicket);
});

// =====================================================
// НОВЫЙ МЕТОД: Смена статуса с валидацией
// POST /api/tickets/:id/change-status
// =====================================================
const changeTicketStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticketId = parseInt(id, 10);
  const { targetStatusId, comment } = req.body;

  if (isNaN(ticketId)) {
    return res.status(400).json({ message: 'Invalid ticket ID' });
  }

  if (!targetStatusId) {
    return res.status(400).json({ message: 'targetStatusId is required' });
  }

  // Получаем текущий тикет (включая неактивные)
  const currentTicket = await Tickets.getById(ticketId, true);
  if (!currentTicket) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  // Если статус уже такой - возвращаем ошибку
  if (currentTicket.stateId === targetStatusId) {
    return res.status(400).json({ 
      message: 'Ticket is already in the target status',
      currentStatusId: currentTicket.stateId,
    });
  }

  // Получаем тип тикета с workflow_id
  const type = currentTicket.typeId ? await Types.getById(currentTicket.typeId) : null;
  
  if (!type || !type.workflowId) {
    return res.status(400).json({ 
      message: 'No workflow configured for this ticket type',
    });
  }

  // Проверяем валидность перехода
  const validTransition = await WorkflowTransitions.validateTransition(
    type.workflowId,
    currentTicket.stateId,
    targetStatusId
  );
  
  if (!validTransition) {
    // Получаем доступные переходы для информативного сообщения
    const availableTransitions = await WorkflowTransitions.getAvailableTransitions(
      type.workflowId,
      currentTicket.stateId
    );
    
    return res.status(403).json({ 
      message: 'Invalid transition',
      error: 'TRANSITION_NOT_ALLOWED',
      currentStatus: {
        id: currentTicket.stateId,
        name: currentTicket.stateName,
      },
      requestedStatusId: targetStatusId,
      availableTransitions: availableTransitions.map(t => ({
        id: t.id,
        label: t.actionLabel,
        targetStatusId: t.targetStatusId,
        targetStatusName: t.targetStatusName,
      })),
    });
  }

  // Выполняем смену статуса
  const updatedTicket = await Tickets.update(ticketId, { stateId: targetStatusId });

  // Получаем имена статусов для истории
  const oldState = currentTicket.stateId ? await States.getById(currentTicket.stateId) : null;
  const newState = await States.getById(targetStatusId);

  // Используем changedBy из тела запроса, если передан, иначе req.user
  const changedBy = req.body.changedBy || req.user?.id || null;

  // Записываем историю с отображаемыми именами
  await TicketHistory.create({
    ticketId: ticketId,
    changedBy: changedBy,
    fieldName: 'stateId',
    oldValue: oldState ? oldState.name : null,
    newValue: newState ? newState.name : String(targetStatusId),
  });

  // Записываем переход в историю переходов статусов
  await TicketStatusHistory.recordTransition(
    ticketId,
    currentTicket.stateId, // fromStatusId
    targetStatusId, // toStatusId
    changedBy,
    validTransition.actionLabel // actionLabel из workflow
  );

  res.json({
    ...updatedTicket,
    transition: {
      id: validTransition.id,
      label: validTransition.actionLabel,
    },
  });
});

const deleteTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticketId = parseInt(id, 10);

  if (isNaN(ticketId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await Tickets.delete(ticketId);

  if (!deleted) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  res.status(204).send();
});

module.exports = {
  getTickets,
  getTicketById,
  getTicketActions,
  createTicket,
  updateTicket,
  changeTicketStatus,
  deleteTicket,
};
