const TicketSchedules = require('../models/ticketSchedules')
const { TicketScheduleLogs } = require('../models/ticketSchedules')
const Tickets = require('../models/tickets')
const { calculateNextRunAt } = require('../models/ticketSchedules')

// Получить все расписания
exports.getAll = async (req, res) => {
  try {
    const { ticketId, isActive } = req.query

    const schedules = await TicketSchedules.getAll({
      ticketId: ticketId ? Number.parseInt(ticketId, 10) : undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    })

    res.json({ schedules })
  }
  catch (error) {
    console.error('Error in getAll schedules:', error)
    res.status(500).json({ message: 'Ошибка получения расписаний' })
  }
}

// Получить расписание по ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params
    const schedule = await TicketSchedules.getById(Number.parseInt(id, 10))
    if (!schedule)
      return res.status(404).json({ message: 'Расписание не найдено' })

    res.json({ schedule })
  }
  catch (error) {
    console.error('Error in getById schedule:', error)
    res.status(500).json({ message: 'Ошибка получения расписания' })
  }
}

// Получить расписание по ID тикета
exports.getByTicketId = async (req, res) => {
  try {
    const { ticketId } = req.params
    const schedule = await TicketSchedules.getByTicketId(Number.parseInt(ticketId, 10))

    res.json({ schedule })
  }
  catch (error) {
    console.error('Error in getByTicketId schedule:', error)
    res.status(500).json({ message: 'Ошибка получения расписания' })
  }
}

// Создать расписание
exports.create = async (req, res) => {
  try {
    const scheduleData = req.body

    console.log('Creating schedule with data:', JSON.stringify(scheduleData))

    // Валидация обязательных полей
    if (!scheduleData.ticketId)
      return res.status(400).json({ message: 'ID тикета обязателен' })

    // Проверяем существует ли тикет
    console.log('Fetching ticket with ID:', scheduleData.ticketId)

    const ticket = await Tickets.getById(scheduleData.ticketId)

    console.log('Ticket found:', ticket)
    if (!ticket)
      return res.status(404).json({ message: 'Тикет не найден' })

    // Если создаём расписание на основе тикета - копируем данные
    if (scheduleData.copyFromTicket) {
      if (!scheduleData.titlePrefix)
        scheduleData.titlePrefix = 'Расписание (Р) '

      if (!scheduleData.title)
        scheduleData.title = ticket.title

      if (!scheduleData.description)
        scheduleData.description = ticket.description

      scheduleData.typeId = ticket.typeId
      scheduleData.categoryId = ticket.categoryId
      scheduleData.priorityId = ticket.priorityId
      scheduleData.queueId = ticket.queueId
      scheduleData.stateId = ticket.stateId
      scheduleData.ownerId = ticket.ownerId
      scheduleData.executorAgentIds = ticket.executorAgentIds
      scheduleData.executorGroupIds = ticket.executorGroupIds
      scheduleData.companyId = ticket.companyId
      scheduleData.serviceId = ticket.serviceId
      scheduleData.slaId = ticket.slaId
    }

    console.log('Calling TicketSchedules.create with:', JSON.stringify(scheduleData))

    const schedule = await TicketSchedules.create(scheduleData)

    console.log('Schedule created successfully:', schedule)
    res.status(201).json({ schedule })
  }
  catch (error) {
    console.error('Error in create schedule:', error)
    console.error('Stack trace:', error.stack)
    res.status(500).json({ message: 'Ошибка создания расписания', error: error.message })
  }
}

// Обновить расписание
exports.update = async (req, res) => {
  try {
    const { id } = req.params
    const scheduleData = req.body

    const existing = await TicketSchedules.getById(Number.parseInt(id, 10))
    if (!existing)
      return res.status(404).json({ message: 'Расписание не найдено' })

    const schedule = await TicketSchedules.update(Number.parseInt(id, 10), scheduleData)

    res.json({ schedule })
  }
  catch (error) {
    console.error('Error in update schedule:', error)
    res.status(500).json({ message: 'Ошибка обновления расписания' })
  }
}

// Удалить расписание
exports.delete = async (req, res) => {
  try {
    const { id } = req.params

    const existing = await TicketSchedules.getById(Number.parseInt(id, 10))
    if (!existing)
      return res.status(404).json({ message: 'Расписание не найдено' })

    const deleted = await TicketSchedules.delete(Number.parseInt(id, 10))

    res.json({ success: deleted })
  }
  catch (error) {
    console.error('Error in delete schedule:', error)
    res.status(500).json({ message: 'Ошибка удаления расписания' })
  }
}

// Удалить расписание по ticketId
exports.deleteByTicketId = async (req, res) => {
  try {
    const { ticketId } = req.params

    const deleted = await TicketSchedules.deleteByTicketId(Number.parseInt(ticketId, 10))

    res.json({ success: deleted })
  }
  catch (error) {
    console.error('Error in deleteByTicketId schedule:', error)
    res.status(500).json({ message: 'Ошибка удаления расписания' })
  }
}

// Выполнить расписание (создать новый тикет)
exports.runSchedule = async (req, res) => {
  try {
    const { id } = req.params

    const schedule = await TicketSchedules.getById(Number.parseInt(id, 10))
    if (!schedule)
      return res.status(404).json({ message: 'Расписание не найдено' })

    if (!schedule.isActive)
      return res.status(400).json({ message: 'Расписание неактивно' })

    // Проверяем даты начала и окончания
    const now = new Date()
    if (schedule.startDate && new Date(schedule.startDate) > now)
      return res.status(400).json({ message: 'Расписание ещё не началось' })

    if (schedule.endDate && new Date(schedule.endDate) < now)
      return res.status(400).json({ message: 'Расписание завершено' })

    // Получаем актуальный тикет для клонирования
    const originalTicket = await Tickets.getById(schedule.ticketId)
    if (!originalTicket)
      return res.status(404).json({ message: 'Оригинальный тикет не найден' })

    // Создаём новый тикет - клонируем актуальный с префиксом
    const ticketNumber = await Tickets.generateTicketNumber()

    const newTicket = await Tickets.create({
      ticketNumber,
      title: `${schedule.titlePrefix || 'Расписание (Р) '}${originalTicket.title}`,
      description: originalTicket.description,
      typeId: originalTicket.typeId,
      categoryId: originalTicket.categoryId,
      priorityId: originalTicket.priorityId,
      queueId: originalTicket.queueId,
      stateId: originalTicket.stateId,
      ownerId: originalTicket.ownerId,
      executorAgentIds: originalTicket.executorAgentIds,
      executorGroupIds: originalTicket.executorGroupIds,
      companyId: originalTicket.companyId,
      serviceId: originalTicket.serviceId,
      slaId: originalTicket.slaId,
    })

    // Обновляем время последнего и следующего запуска
    const lastRunAt = new Date()
    const { calculateNextRunAt } = require('../models/ticketSchedules')

    const nextScheduleData = {
      scheduleType: schedule.scheduleType,
      scheduleTime: schedule.scheduleTime,
      scheduleDays: schedule.scheduleDays,
      scheduleDayOfMonth: schedule.scheduleDayOfMonth,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
    }

    const nextRunAt = calculateNextRunAt(nextScheduleData)

    await TicketSchedules.updateRunTime(Number.parseInt(id, 10), lastRunAt, nextRunAt)

    // Записываем лог
    await TicketScheduleLogs.create({
      scheduleId: Number.parseInt(id, 10),
      executedAt: lastRunAt.toISOString(),
      createdTicketId: newTicket.id,
      createdTicketNumber: ticketNumber,
      status: 'success',
      details: { originalTicketId: schedule.ticketId },
    })

    res.json({
      success: true,
      ticket: newTicket,
      message: `Создан тикет #${ticketNumber}`,
    })
  }
  catch (error) {
    console.error('Error in runSchedule:', error)
    res.status(500).json({ message: 'Ошибка выполнения расписания' })
  }
}

// Получить логи расписания
exports.getLogs = async (req, res) => {
  try {
    const { id } = req.params
    const logs = await TicketScheduleLogs.getByScheduleId(Number.parseInt(id, 10))

    res.json({ logs })
  }
  catch (error) {
    console.error('Error in getLogs:', error)
    res.status(500).json({ message: 'Ошибка получения логов' })
  }
}
