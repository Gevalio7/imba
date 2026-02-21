const Tickets = require('../models/tickets');
const Types = require('../models/types');
const WorkflowTransitions = require('../models/workflowTransitions');
const TicketHistory = require('../models/ticketHistory');
const { asyncHandler } = require('../middleware/errorHandler');

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

  // Записываем историю создания
  if (newTicket.stateId) {
    await TicketHistory.create({
      ticketId: newTicket.id,
      changedBy: req.user?.id || null,
      fieldName: 'stateId',
      oldValue: null,
      newValue: String(newTicket.stateId),
    });
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

  // Записываем историю смены статуса
  if (req.body.stateId !== undefined && req.body.stateId !== currentTicket.stateId) {
    await TicketHistory.create({
      ticketId: ticketId,
      changedBy: req.user?.id || null,
      fieldName: 'stateId',
      oldValue: currentTicket.stateId ? String(currentTicket.stateId) : null,
      newValue: String(req.body.stateId),
    });
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

  // Записываем историю
  await TicketHistory.create({
    ticketId: ticketId,
    changedBy: req.user?.id || null,
    fieldName: 'stateId',
    oldValue: currentTicket.stateId ? String(currentTicket.stateId) : null,
    newValue: String(targetStatusId),
  });

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
