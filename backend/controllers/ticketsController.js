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
  // НОВАЯ ЛОГИКА: Обработка ownerId - создание сотрудника по email
  // =====================================================
  let ownerId = req.body.ownerId || null;
  
  // Если ownerId передан как строка (email) - ищем или создаем сотрудника
  if (ownerId && typeof ownerId === 'string' && ownerId.includes('@')) {
    try {
      // Проверяем параметр create_customer_user_by_email
      const configResult = await SystemConfiguration.getAll({ q: 'create_customer_user_by_email', itemsPerPage: 1 });
      const config = configResult.systemConfiguration?.[0];
      const shouldCreateUser = config?.value === 'true';
      
      if (shouldCreateUser) {
        // Ищем существующего сотрудника по email
        let existingUser = await CustomerUsers.getByEmail(ownerId);
        
        if (existingUser) {
          // Сотрудник найден - используем его ID
          ownerId = existingUser.id;
          console.log(`✅ Найден существующий сотрудник по email: ${ownerId}, ID: ${ownerId}`);
        } else {
          // Сотрудник не найден - создаём нового
          const newCustomerUser = await CustomerUsers.create({
            firstName: 'Новый',
            lastName: 'Сотрудник',
            email: ownerId,
            login: ownerId,
            customerId: req.body.companyId || null,
          });
          
          ownerId = newCustomerUser.id;
          console.log(`✅ Создан новый сотрудник по email: ${ownerId}, ID: ${ownerId}`);
        }
        
        // Также устанавливаем companyId если она ещё не установлена
        if (!data.companyId && existingUser?.customerId) {
          data.companyId = existingUser.customerId;
        }
      } else {
        // Параметр отключён - не создаём сотрудника
        ownerId = null;
      }
    } catch (configError) {
      console.error('Ошибка проверки конфигурации:', configError);
      ownerId = null;
    }
  }
  // Если ownerId передан как объект с email (для создания нового сотрудника с указанием имени)
  else if (ownerId && typeof ownerId === 'object' && ownerId.email) {
    try {
      const configResult = await SystemConfiguration.getAll({ q: 'create_customer_user_by_email', itemsPerPage: 1 });
      const config = configResult.systemConfiguration?.[0];
      const shouldCreateUser = config?.value === 'true';
      
      if (shouldCreateUser) {
        // Ищем существующего сотрудника по email
        let existingUser = await CustomerUsers.getByEmail(ownerId.email);
        
        if (existingUser) {
          ownerId = existingUser.id;
          console.log(`✅ Найден существующий сотрудник по email: ${ownerId.email}, ID: ${ownerId}`);
        } else {
          // Создаём нового сотрудника с указанным именем
          const newCustomerUser = await CustomerUsers.create({
            firstName: ownerId.firstName || 'Новый',
            lastName: ownerId.lastName || 'Сотрудник',
            email: ownerId.email,
            login: ownerId.email,
            customerId: ownerId.customerId || req.body.companyId || null,
          });
          
          ownerId = newCustomerUser.id;
          console.log(`✅ Создан новый сотрудник по email: ${ownerId.email}, ID: ${ownerId}`);
        }
        
        if (!data.companyId && existingUser?.customerId) {
          data.companyId = existingUser.customerId;
        }
      } else {
        ownerId = null;
      }
    } catch (configError) {
      console.error('Ошибка проверки конфигурации:', configError);
      ownerId = null;
    }
  }
  
  data.ownerId = ownerId;
  // =====================================================
  // КОНЕЦ НОВОЙ ЛОГИКИ
  // =====================================================
  
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

   // =====================================================
   // НОВАЯ ЛОГИКА: Автоматическое назначение агента как исполнителя
   // =====================================================
   let executorAgentIds = [];
   let executorGroupIds = [];

   // Проверяем настройку автоматического назначения
   try {
     const configResult = await SystemConfiguration.getAll({ q: 'agent_auto_assign_as_executor', itemsPerPage: 1 });
     const config = configResult.systemConfiguration?.[0];
     const shouldAutoAssign = config?.value === 'true';

     if (shouldAutoAssign && ownerId) {
       // Проверяем, является ли создатель агентом
       const agent = await Agents.getById(ownerId);
       if (agent) {
         // Создатель является агентом - добавляем его как исполнителя
         executorAgentIds.push(ownerId);
         console.log(`🤖 Автоматически назначен агент ${ownerId} как исполнитель тикета`);
       }
     }
   } catch (configError) {
     console.error('Ошибка проверки настройки автоматического назначения:', configError);
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
  // НОВАЯ ЛОГИКА: Автоматический расчет SLA дедлайнов при создании
  // =====================================================
  if (newTicket.slaId && !data.responseDeadline && !data.resolutionDeadline) {
    try {
      const sla = await Sla.getById(newTicket.slaId);
      if (sla) {
        const now = new Date();
        // responseTime - в часах (умножаем на 60*60*1000), solutionTime - в минутах (умножаем на 60*1000)
        const responseDeadline = sla.responseTime ? new Date(now.getTime() + sla.responseTime * 60 * 60 * 1000) : null;
        const resolutionDeadline = sla.solutionTime ? new Date(now.getTime() + sla.solutionTime * 60 * 1000) : null;

        // Обновляем тикет с дедлайнами
        const updatedWithDeadlines = await Tickets.update(newTicket.id, {
          responseDeadline,
          resolutionDeadline,
        });

        console.log(`📊 SLA дедлайны установлены: response=${responseDeadline}, resolution=${resolutionDeadline}`);
        Object.assign(newTicket, updatedWithDeadlines);
      }
    } catch (slaError) {
      console.error('Ошибка расчета SLA дедлайнов:', slaError);
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
      
      console.log(`✅ Valid transition: ${validTransition.actionLabel} (ID: ${validTransition.id})`);
    } else {
      // Если нет воркфлоу - разрешаем любой переход (для обратной совместимости)
      console.log(`⚠️ No workflow configured for type ${currentTicket.typeId}, allowing transition`);
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
  // НОВАЯ ЛОГИКА: Пересчет SLA дедлайнов при изменении SLA
  // =====================================================
  if (req.body.slaId !== undefined && req.body.slaId !== currentTicket.slaId) {
    // Если SLA изменился - пересчитываем дедлайны
    if (req.body.slaId) {
      try {
        const sla = await Sla.getById(req.body.slaId);
        if (sla) {
          const now = new Date();
          // responseTime - в часах (умножаем на 60*60*1000), solutionTime - в минутах (умножаем на 60*1000)
          const responseDeadline = sla.responseTime ? new Date(now.getTime() + sla.responseTime * 60 * 60 * 1000) : null;
          const resolutionDeadline = sla.solutionTime ? new Date(now.getTime() + sla.solutionTime * 60 * 1000) : null;

          // Обновляем дедлайны
          await Tickets.update(ticketId, {
            responseDeadline,
            resolutionDeadline,
          });

          console.log(`📊 SLA дедлайны пересчитаны: response=${responseDeadline}, resolution=${resolutionDeadline}`);
        }
      } catch (slaError) {
        console.error('Ошибка пересчета SLA дедлайнов:', slaError);
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
  });
  
  const { typesList = [], typeCategoriesList = [], prioritiesList = [], queuesList = [], statesList = [], agentsList = [], customersList = [], servicesList = [], slaList = [] } = lookupData;
  
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
      // Для описания показываем краткую версию
      const truncate = (str, len = 50) => {
        if (!str) return '';
        return str.length > len ? str.substring(0, len) + '...' : str;
      };
      oldDisplayValue = truncate(String(oldValue ?? ''));
      newDisplayValue = truncate(String(newValue ?? ''));
    }
    else if (field === 'executorAgentIds') {
      // Для исполнителей-агентов показываем имена
      const oldIds = Array.isArray(oldValue) ? oldValue : [];
      const newIds = Array.isArray(newValue) ? newValue : [];
      const oldAgents = agentsList.filter(a => oldIds.includes(a.id));
      const newAgents = agentsList.filter(a => newIds.includes(a.id));
      oldDisplayValue = oldAgents.length > 0 ? oldAgents.map(a => `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.login).join(', ') : '-';
      newDisplayValue = newAgents.length > 0 ? newAgents.map(a => `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.login).join(', ') : '-';
    }
    else if (field === 'executorGroupIds') {
      // Для групп исполнителей показываем названия
      const oldIds = Array.isArray(oldValue) ? oldValue : [];
      const newIds = Array.isArray(newValue) ? newValue : [];
      // Загружаем группы агентов если изменяются executorGroupIds
      if (!neededLookups.has('agentsGroups')) {
        const AgentsGroups = require('../models/agentsGroups');
        try {
          const groupsResult = await AgentsGroups.getAll({ itemsPerPage: 1000 });
          const groupsList = groupsResult.agentsGroups || [];
          const oldGroups = groupsList.filter(g => oldIds.includes(g.id));
          const newGroups = groupsList.filter(g => newIds.includes(g.id));
          oldDisplayValue = oldGroups.length > 0 ? oldGroups.map(g => g.name).join(', ') : '-';
          newDisplayValue = newGroups.length > 0 ? newGroups.map(g => g.name).join(', ') : '-';
        } catch (err) {
          console.error('Error loading agent groups for history:', err);
          oldDisplayValue = oldIds.join(', ');
          newDisplayValue = newIds.join(', ');
        }
      } else {
        // Если группы уже загружены, используем их
        oldDisplayValue = oldIds.length > 0 ? oldIds.join(', ') : '-';
        newDisplayValue = newIds.length > 0 ? newIds.join(', ') : '-';
      }
    }
    
    // Записываем в историю
    await TicketHistory.create({
      ticketId: ticketId,
      changedBy: changedBy,
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
        changedBy,
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
