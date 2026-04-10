const { pool } = require('../config/db');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

class TicketSchedules {
  static tableName = 'ticket_schedules';

  // Получить все расписания
  static async getAll(options = {}) {
    const { ticketId, isActive } = options;

    try {
      let whereClause = '';
      let params = [];
      let paramIndex = 1;

      if (ticketId) {
        whereClause = `WHERE ticket_id = $${paramIndex}`;
        params.push(ticketId);
        paramIndex++;
      }

      if (isActive !== undefined) {
        if (whereClause) {
          whereClause += ` AND is_active = $${paramIndex}`;
        } else {
          whereClause = `WHERE is_active = $${paramIndex}`;
        }
        params.push(isActive);
        paramIndex++;
      }

      const query = `
        SELECT 
          ts.id,
          ts.ticket_id as "ticketId",
          ts.schedule_type as "scheduleType",
          ts.schedule_time as "scheduleTime",
          ts.schedule_days as "scheduleDays",
          ts.schedule_day_of_month as "scheduleDayOfMonth",
          ts.start_date as "startDate",
          ts.end_date as "endDate",
          ts.is_active as "isActive",
          ts.last_run_at as "lastRunAt",
          ts.next_run_at as "nextRunAt",
          ts.title,
          ts.description,
          ts.type_id as "typeId",
          ts.category_id as "categoryId",
          ts.priority_id as "priorityId",
          ts.queue_id as "queueId",
          ts.state_id as "stateId",
          ts.owner_id as "ownerId",
          ts.executor_agent_ids as "executorAgentIds",
          ts.executor_group_ids as "executorGroupIds",
          ts.company_id as "companyId",
          ts.service_id as "serviceId",
          ts.sla_id as "slaId",
          ts.created_at as "createdAt",
          ts.updated_at as "updatedAt",
          t.ticket_number as "ticketNumber"
        FROM ${TicketSchedules.tableName} ts
        LEFT JOIN tickets t ON ts.ticket_id = t.id
        ${whereClause}
        ORDER BY ts.created_at DESC
      `;

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  // Получить расписание по ID
  static async getById(id) {
    try {
      const result = await pool.query(
        `SELECT 
          ts.id,
          ts.ticket_id as "ticketId",
          ts.schedule_type as "scheduleType",
          ts.schedule_time as "scheduleTime",
          ts.schedule_days as "scheduleDays",
          ts.schedule_day_of_month as "scheduleDayOfMonth",
          ts.start_date as "startDate",
          ts.end_date as "endDate",
          ts.is_active as "isActive",
          ts.last_run_at as "lastRunAt",
          ts.next_run_at as "nextRunAt",
          ts.title,
          ts.description,
          ts.type_id as "typeId",
          ts.category_id as "categoryId",
          ts.priority_id as "priorityId",
          ts.queue_id as "queueId",
          ts.state_id as "stateId",
          ts.owner_id as "ownerId",
          ts.executor_agent_ids as "executorAgentIds",
          ts.executor_group_ids as "executorGroupIds",
          ts.company_id as "companyId",
          ts.service_id as "serviceId",
          ts.sla_id as "slaId",
          ts.created_at as "createdAt",
          ts.updated_at as "updatedAt",
          t.ticket_number as "ticketNumber"
        FROM ${TicketSchedules.tableName} ts
        LEFT JOIN tickets t ON ts.ticket_id = t.id
        WHERE ts.id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  // Получить расписание по ID тикета
  static async getByTicketId(ticketId) {
    try {
      const result = await pool.query(
        `SELECT 
          ts.id,
          ts.ticket_id as "ticketId",
          ts.schedule_type as "scheduleType",
          ts.schedule_time as "scheduleTime",
          ts.schedule_days as "scheduleDays",
          ts.schedule_day_of_month as "scheduleDayOfMonth",
          ts.start_date as "startDate",
          ts.end_date as "endDate",
          ts.is_active as "isActive",
          ts.last_run_at as "lastRunAt",
          ts.next_run_at as "nextRunAt",
          ts.title,
          ts.description,
          ts.type_id as "typeId",
          ts.category_id as "categoryId",
          ts.priority_id as "priorityId",
          ts.queue_id as "queueId",
          ts.state_id as "stateId",
          ts.owner_id as "ownerId",
          ts.executor_agent_ids as "executorAgentIds",
          ts.executor_group_ids as "executorGroupIds",
          ts.company_id as "companyId",
          ts.service_id as "serviceId",
          ts.sla_id as "slaId",
          ts.created_at as "createdAt",
          ts.updated_at as "updatedAt"
        FROM ${TicketSchedules.tableName} ts
        WHERE ts.ticket_id = $1`,
        [ticketId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getByTicketId:', error);
      throw error;
    }
  }

  // Получить активные расписания для выполнения (с истёкшим временем next_run_at)
  static async getDueSchedules() {
    try {
      const result = await pool.query(
        `SELECT 
          ts.id,
          ts.ticket_id as "ticketId",
          ts.schedule_type as "scheduleType",
          ts.schedule_time as "scheduleTime",
          ts.schedule_days as "scheduleDays",
          ts.schedule_day_of_month as "scheduleDayOfMonth",
          ts.start_date as "startDate",
          ts.end_date as "endDate",
          ts.title,
          ts.description,
          ts.type_id as "typeId",
          ts.category_id as "categoryId",
          ts.priority_id as "priorityId",
          ts.queue_id as "queueId",
          ts.state_id as "stateId",
          ts.owner_id as "ownerId",
          ts.executor_agent_ids as "executorAgentIds",
          ts.executor_group_ids as "executorGroupIds",
          ts.company_id as "companyId",
          ts.service_id as "serviceId",
          ts.sla_id as "slaId",
          ts.next_run_at as "nextRunAt"
        FROM ${TicketSchedules.tableName} ts
        WHERE ts.is_active = true
          AND ts.next_run_at IS NOT NULL
          AND ts.next_run_at <= CURRENT_TIMESTAMP
          AND (ts.end_date IS NULL OR ts.end_date >= CURRENT_DATE)
        ORDER BY ts.next_run_at ASC
      `);
      return result.rows;
    } catch (error) {
      console.error('Error in getDueSchedules:', error);
      throw error;
    }
  }

  // Создать расписание
  static async create(schedule) {
    try {
      // Сначала рассчитываем следующую дату выполнения
      const nextRunAt = calculateNextRunAt(schedule);

      const query = `
        INSERT INTO ${TicketSchedules.tableName} (
          ticket_id, schedule_type, schedule_time, schedule_days, schedule_day_of_month,
          start_date, end_date, is_active, next_run_at,
          title, description, type_id, category_id, priority_id, queue_id, state_id,
          owner_id, executor_agent_ids, executor_group_ids, company_id, service_id, sla_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        RETURNING id, ticket_id as "ticketId", schedule_type as "scheduleType", 
          schedule_time as "scheduleTime", schedule_days as "scheduleDays",
          schedule_day_of_month as "scheduleDayOfMonth", start_date as "startDate",
          end_date as "endDate", is_active as "isActive", next_run_at as "nextRunAt",
          created_at as "createdAt", updated_at as "updatedAt"
      `;

      const values = [
        schedule.ticketId || null,
        schedule.scheduleType || 'daily',
        schedule.scheduleTime || '09:00',
        schedule.scheduleDays && schedule.scheduleDays.length > 0 ? schedule.scheduleDays : null,
        schedule.scheduleDayOfMonth || null,
        schedule.startDate || null,
        schedule.endDate || null,
        schedule.isActive !== undefined ? schedule.isActive : true,
        nextRunAt,
        schedule.title || null,
        schedule.description || null,
        schedule.typeId || null,
        schedule.categoryId || null,
        schedule.priorityId || null,
        schedule.queueId || null,
        schedule.stateId || null,
        schedule.ownerId || null,
        schedule.executorAgentIds && schedule.executorAgentIds.length > 0 ? schedule.executorAgentIds : null,
        schedule.executorGroupIds && schedule.executorGroupIds.length > 0 ? schedule.executorGroupIds : null,
        schedule.companyId || null,
        schedule.serviceId || null,
        schedule.slaId || null,
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  // Обновить расписание
  static async update(id, schedule) {
    try {
      const updates = [];
      const values = [id];
      let paramIndex = 2;

      const fieldMap = {
        ticketId: 'ticket_id',
        scheduleType: 'schedule_type',
        scheduleTime: 'schedule_time',
        scheduleDays: 'schedule_days',
        scheduleDayOfMonth: 'schedule_day_of_month',
        startDate: 'start_date',
        endDate: 'end_date',
        isActive: 'is_active',
        title: 'title',
        description: 'description',
        typeId: 'type_id',
        categoryId: 'category_id',
        priorityId: 'priority_id',
        queueId: 'queue_id',
        stateId: 'state_id',
        ownerId: 'owner_id',
        executorAgentIds: 'executor_agent_ids',
        executorGroupIds: 'executor_group_ids',
        companyId: 'company_id',
        serviceId: 'service_id',
        slaId: 'sla_id',
      };

      Object.entries(fieldMap).forEach(([field, column]) => {
        if (schedule[field] !== undefined) {
          updates.push(`${column} = $${paramIndex}`);
          values.push(schedule[field]);
          paramIndex++;
        }
      });

      // Если меняются параметры расписания - пересчитываем next_run_at
      if (schedule.scheduleType || schedule.scheduleTime || schedule.scheduleDays || 
          schedule.scheduleDayOfMonth || schedule.startDate || schedule.endDate) {
        // Получаем текущее расписание
        const current = await TicketSchedules.getById(id);
        if (current) {
          const merged = { ...current, ...schedule };
          const nextRunAt = calculateNextRunAt(merged);
          updates.push(`next_run_at = $${paramIndex}`);
          values.push(nextRunAt);
          paramIndex++;
        }
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');

      const query = `
        UPDATE ${TicketSchedules.tableName} 
        SET ${updates.join(', ')} 
        WHERE id = $1
        RETURNING id, ticket_id as "ticketId", schedule_type as "scheduleType", 
          schedule_time as "scheduleTime", schedule_days as "scheduleDays",
          schedule_day_of_month as "scheduleDayOfMonth", start_date as "startDate",
          end_date as "endDate", is_active as "isActive", next_run_at as "nextRunAt",
          updated_at as "updatedAt"
      `;

      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  // Обновить время последнего и следующего запуска
  static async updateRunTime(id, lastRunAt, nextRunAt) {
    try {
      const result = await pool.query(
        `UPDATE ${TicketSchedules.tableName} 
         SET last_run_at = $2, next_run_at = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, last_run_at as "lastRunAt", next_run_at as "nextRunAt"`,
        [id, lastRunAt, nextRunAt]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in updateRunTime:', error);
      throw error;
    }
  }

  // Удалить расписание
  static async delete(id) {
    try {
      // Сначала отвязываем все тикеты от этого расписания
      await pool.query(
        `UPDATE tickets SET created_by_schedule_id = NULL WHERE created_by_schedule_id = $1`,
        [id]
      );

      // Теперь удаляем само расписание
      const result = await pool.query(
        `DELETE FROM ${TicketSchedules.tableName} WHERE id = $1 RETURNING id`,
        [id]
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  // Удалить расписание по ticket_id
  static async deleteByTicketId(ticketId) {
    try {
      const result = await pool.query(
        `DELETE FROM ${TicketSchedules.tableName} WHERE ticket_id = $1 RETURNING id`,
        [ticketId]
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in deleteByTicketId:', error);
      throw error;
    }
  }
}

// Функция для расчёта следующей даты выполнения
function calculateNextRunAt(schedule) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const [hours, minutes] = (schedule.scheduleTime || '09:00').split(':').map(Number);
  
  // Дата начала
  let startDate = schedule.startDate ? new Date(schedule.startDate) : today;
  if (schedule.startDate && schedule.startDate > today) {
    startDate = new Date(schedule.startDate);
  }
  
  // Дата окончания
  const endDate = schedule.endDate ? new Date(schedule.endDate) : null;
  
  let nextDate = new Date(today);
  nextDate.setHours(hours, minutes, 0, 0);
  
  // Если время уже прошло сегодня - начинаем с завтра
  if (nextDate <= now) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  const scheduleType = schedule.scheduleType || 'daily';
  const scheduleDays = schedule.scheduleDays || [];
  const scheduleDayOfMonth = schedule.scheduleDayOfMonth;
  
  // Проверяем даты в течение года
  const maxIterations = 366;
  let iterations = 0;
  
  while (iterations < maxIterations) {
    // Проверяем дату окончания
    if (endDate && nextDate > endDate) {
      return null;
    }
    
    // Проверяем дату начала
    if (nextDate < startDate) {
      nextDate.setDate(nextDate.getDate() + 1);
      iterations++;
      continue;
    }
    
    let isValidDate = false;
    
    switch (scheduleType) {
      case 'daily':
        isValidDate = true;
        break;
        
      case 'weekly':
        if (scheduleDays && scheduleDays.length > 0) {
          // JavaScript: 0=Вс, 1=Пн... PostgreSQL: 1=Пн, 7=Вс
          const dayOfWeek = nextDate.getDay();
          // Конвертируем: 0(Вс)->7, 1(Пн)->1, ..., 6(Сб)->6
          const pgDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
          isValidDate = scheduleDays.includes(pgDayOfWeek);
        } else {
          isValidDate = true;
        }
        break;
        
      case 'monthly':
        if (scheduleDayOfMonth) {
          isValidDate = nextDate.getDate() === scheduleDayOfMonth;
        } else {
          isValidDate = true;
        }
        break;
    }
    
    if (isValidDate) {
      return nextDate;
    }
    
    nextDate.setDate(nextDate.getDate() + 1);
    iterations++;
  }
  
  return null;
}

module.exports = TicketSchedules;
module.exports.calculateNextRunAt = calculateNextRunAt;
