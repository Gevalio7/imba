const Tickets = require('../models/tickets');
const Types = require('../models/types');
const WorkflowTransitions = require('../models/workflowTransitions');
const TicketHistory = require('../models/ticketHistory');
const TicketStatusHistory = require('../models/ticketStatusHistory');
const Priorities = require('../models/priorities');
const Queues = require('../models/queues');
const States = require('../models/states');
const Agents = require('../models/agents');
const Customers = require('../models/customers');
const Sla = require('../models/sla');
const { asyncHandler } = require('../middleware/errorHandler');

// Маппинг названий полей для отображения
const fieldDisplayNames = {
  title: 'Заголовок',
  description: 'Описание',
  typeId: 'Тип',
  priorityId: 'Приоритет',
  queueId: 'Очередь',
  stateId: 'Статус',
  ownerId: 'Владелец',
  companyId: 'Компания',
  slaId: 'SLA',
  isActive: 'Активен',
  attachment: 'Вложение',
};

const getTickets = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await Tickets.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getTicketById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticketId = parseInt(id, 10);

  if (isNaN(ticketId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const ticket = await Tickets.getById(ticketId);

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

  // Получаем тикет
  const ticket = await Tickets.getById(ticketId);
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
  data.priorityId = req.body.priorityId || null;
  data.queueId = req.body.queueId || null;
  data.ownerId = req.body.ownerId || null;
  data.companyId = req.body.companyId || null;
  data.slaId = req.body.slaId || null;
  
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.title) {
    return res.status(400).json({ message: 'title is required' });
  }

  // =====================================================
  // НОВАЯ ЛОГИКА: Автоматическое определение начального статуса
  // =====================================================
  if (!req.body.stateId && data.typeId) {
    // Получаем тип с workflow_id
    const type = await Types.getById(data.typeId);
    
    if (type && type.workflowId) {
      // Получаем начальный переход (source_status_id IS NULL)
      const initialTransition = await WorkflowTransitions.getInitialTransition(type.workflowId);
      
      if (initialTransition) {
        data.stateId = initialTransition.targetStatusId;
        console.log(`📌 Auto-setting initial status: ${initialTransition.statusName} (ID: ${initialTransition.targetStatusId})`);
      }
    }
  } else if (req.body.stateId) {
    data.stateId = req.body.stateId;
  }

  const newTicket = await Tickets.create(data);

  // =====================================================
  // Записываем историю создания с отображаемыми именами
  // =====================================================
  if (newTicket.stateId) {
    // Получаем имя статуса
    const state = await States.getById(newTicket.stateId);
    const stateName = state ? state.name : String(newTicket.stateId);
    
    await TicketHistory.create({
      ticketId: newTicket.id,
      changedBy: req.user?.id || null,
      fieldName: 'stateId',
      oldValue: null,
      newValue: stateName,
    });
    
    // Записываем переход статуса в историю переходов
    await TicketStatusHistory.recordTransition(
      newTicket.id,
      null, // fromStatusId - null для начального статуса
      newTicket.stateId,
      req.user?.id || null,
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
  const currentTicket = await Tickets.getById(ticketId);
  if (!currentTicket) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  const data = {};
  if (req.body.ticketNumber !== undefined) data.ticketNumber = req.body.ticketNumber;
  if (req.body.title !== undefined) data.title = req.body.title;
  if (req.body.description !== undefined) data.description = req.body.description;
  if (req.body.typeId !== undefined) data.typeId = req.body.typeId;
  if (req.body.priorityId !== undefined) data.priorityId = req.body.priorityId;
  if (req.body.queueId !== undefined) data.queueId = req.body.queueId;
  if (req.body.ownerId !== undefined) data.ownerId = req.body.ownerId;
  if (req.body.companyId !== undefined) data.companyId = req.body.companyId;
  if (req.body.slaId !== undefined) data.slaId = req.body.slaId;
  
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
      
      console.log(`✅ Valid transition: ${validTransition.actionLabel} (ID: ${validTransition.id})`);
    } else {
      // Если нет воркфлоу - разрешаем любой переход (для обратной совместимости)
      console.log(`⚠️ No workflow configured for type ${currentTicket.typeId}, allowing transition`);
    }
    
    data.stateId = newStatusId;
  }

  const updatedTicket = await Tickets.update(ticketId, data);

  if (!updatedTicket) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  // =====================================================
  // Записываем историю изменений всех полей
  // =====================================================
  const fieldsToTrack = ['title', 'description', 'typeId', 'priorityId', 'queueId', 'stateId', 'ownerId', 'companyId', 'slaId', 'isActive'];
  
  // Определяем какие справочники нужны на основе изменяемых полей
  const neededLookups = new Set();
  for (const field of fieldsToTrack) {
    if (data[field] !== undefined && currentTicket[field] !== data[field]) {
      if (field === 'typeId') neededLookups.add('types');
      else if (field === 'priorityId') neededLookups.add('priorities');
      else if (field === 'queueId') neededLookups.add('queues');
      else if (field === 'stateId') neededLookups.add('states');
      else if (field === 'ownerId') neededLookups.add('agents');
      else if (field === 'companyId') neededLookups.add('customers');
      else if (field === 'slaId') neededLookups.add('sla');
    }
  }
  
  // Загружаем только необходимые справочники
  const lookupPromises = [];
  const lookupOrder = [];
  if (neededLookups.has('types')) { lookupPromises.push(Types.getAll({ itemsPerPage: 1000 })); lookupOrder.push('types'); }
  if (neededLookups.has('priorities')) { lookupPromises.push(Priorities.getAll({ itemsPerPage: 1000 })); lookupOrder.push('priorities'); }
  if (neededLookups.has('queues')) { lookupPromises.push(Queues.getAll({ itemsPerPage: 1000 })); lookupOrder.push('queues'); }
  if (neededLookups.has('states')) { lookupPromises.push(States.getAll({ itemsPerPage: 1000 })); lookupOrder.push('states'); }
  if (neededLookups.has('agents')) { lookupPromises.push(Agents.getAll({ itemsPerPage: 1000 })); lookupOrder.push('agents'); }
  if (neededLookups.has('customers')) { lookupPromises.push(Customers.getAll({ itemsPerPage: 1000 })); lookupOrder.push('customers'); }
  if (neededLookups.has('sla')) { lookupPromises.push(Sla.getAll({ itemsPerPage: 1000 })); lookupOrder.push('sla'); }
  
  const lookupResults = await Promise.all(lookupPromises);
  
  // Извлекаем массивы из результатов
  const lookupData = {};
  lookupOrder.forEach((key, index) => {
    const result = lookupResults[index];
    if (key === 'types') lookupData.typesList = result.types || [];
    else if (key === 'priorities') lookupData.prioritiesList = result.priorities || [];
    else if (key === 'queues') lookupData.queuesList = result.queues || [];
    else if (key === 'states') lookupData.statesList = result.states || [];
    else if (key === 'agents') lookupData.agentsList = result.agents || [];
    else if (key === 'customers') lookupData.customersList = result.customers || [];
    else if (key === 'sla') lookupData.slaList = result.sla || [];
  });
  
  const { typesList = [], prioritiesList = [], queuesList = [], statesList = [], agentsList = [], customersList = [], slaList = [] } = lookupData;
  
  for (const field of fieldsToTrack) {
    const oldValue = currentTicket[field];
    const newValue = data[field];
    
    // Пропускаем если поле не было изменено или не было передано
    if (newValue === undefined || oldValue === newValue) continue;
    
    let oldDisplayValue = String(oldValue ?? '');
    let newDisplayValue = String(newValue ?? '');
    
    // Для полей с внешними ключами получаем отображаемые имена
    if (field === 'typeId') {
      const oldType = typesList.find(t => t.id === oldValue);
      const newType = typesList.find(t => t.id === newValue);
      oldDisplayValue = oldType ? oldType.name : String(oldValue ?? '');
      newDisplayValue = newType ? newType.name : String(newValue ?? '');
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
    else if (field === 'isActive') {
      oldDisplayValue = oldValue ? 'Да' : 'Нет';
      newDisplayValue = newValue ? 'Да' : 'Нет';
    }
    else if (field === 'title') {
      oldDisplayValue = String(oldValue ?? '');
      newDisplayValue = String(newValue ?? '');
    }
    else if (field === 'description') {
      // Для описания показываем краткую версию
      const truncate = (str, len = 50) => {
        if (!str) return '';
        return str.length > len ? str.substring(0, len) + '...' : str;
      };
      oldDisplayValue = truncate(String(oldValue ?? ''));
      newDisplayValue = truncate(String(newValue ?? ''));
    }
    
    // Записываем в историю
    await TicketHistory.create({
      ticketId: ticketId,
      changedBy: req.user?.id || null,
      fieldName: field,
      oldValue: oldDisplayValue,
      newValue: newDisplayValue,
    });
    
    // Если изменился статус, записываем в историю переходов
    if (field === 'stateId') {
      await TicketStatusHistory.recordTransition(
        ticketId,
        oldValue, // fromStatusId
        newValue, // toStatusId
        req.user?.id || null,
        null // actionLabel - можно добавить, если есть информация о переходе
      );
    }
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

  // Получаем текущий тикет
  const currentTicket = await Tickets.getById(ticketId);
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
  
  // Записываем историю с отображаемыми именами
  await TicketHistory.create({
    ticketId: ticketId,
    changedBy: req.user?.id || null,
    fieldName: 'stateId',
    oldValue: oldState ? oldState.name : null,
    newValue: newState ? newState.name : String(targetStatusId),
  });
  
  // Записываем переход в историю переходов статусов
  await TicketStatusHistory.recordTransition(
    ticketId,
    currentTicket.stateId, // fromStatusId
    targetStatusId, // toStatusId
    req.user?.id || null,
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
