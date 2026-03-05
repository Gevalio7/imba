const { pool } = require('../config/db');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

class Tickets {
  static tableName = 'tickets';

  static async getAll(options = {}) {
    const { q, sortBy, orderBy = 'asc', itemsPerPage = 1000, page = 1 } = options;

    // Валидация пагинации
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeItemsPerPage = Math.max(1, Math.min(100, parseInt(itemsPerPage, 10) || 10));

    try {
      let whereClause = 'WHERE t.is_active = true';
      let params = [];
      let paramIndex = 1;

      if (q) {
        const searchFields = ['ticket_number', 'title'];
        const conditions = searchFields.map(field => `${field} ILIKE $${paramIndex}`).join(' OR ');
        whereClause += ` AND (${conditions})`;
        params.push(`%${q}%`);
        paramIndex++;
      }

      // Белый список полей для сортировки
      const sortableFields = ['ticketNumber', 'title', 'createdAt', 'updatedAt'];
      let orderClause = 'ORDER BY t.created_at DESC';
      if (sortBy && sortableFields.includes(sortBy)) {
        const sortField = sortBy === 'ticketNumber' ? 't.ticket_number' : 
                          sortBy === 'createdAt' ? 't.created_at' : 
                          sortBy === 'updatedAt' ? 't.updated_at' : `t.${toSnakeCase(sortBy)}`;
        orderClause = `ORDER BY ${sortField} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const offset = (safePage - 1) * safeItemsPerPage;

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${Tickets.tableName} t ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data with joins
      const dataQuery = `
        SELECT 
          t.id,
          t.ticket_number as "ticketNumber",
          t.title,
          t.type_id as "typeId",
          typ.name as "typeName",
          t.priority_id as "priorityId",
          p.name as "priorityName",
          p.color as "priorityColor",
          t.queue_id as "queueId",
          q.name as "queueName",
          t.state_id as "stateId",
          s.name as "stateName",
          s.color as "stateColor",
          t.owner_id as "ownerId",
          ow.login as "ownerLogin",
          ow.first_name as "ownerFirstname",
          ow.last_name as "ownerLastname",
          t.company_id as "companyId",
          c.name as "companyName",
          t.service_id as "serviceId",
          svc.name as "serviceName",
          t.sla_id as "slaId",
          sla.name as "slaName",
          t.response_deadline as "responseDeadline",
          t.resolution_deadline as "resolutionDeadline",
          t.first_response_at as "firstResponseAt",
          t.sla_violated as "slaViolated",
          t.pending_start_at as "pendingStartAt",
          t.created_at as "createdAt",
          t.updated_at as "updatedAt",
          t.is_active as "isActive"
        FROM ${Tickets.tableName} t
        LEFT JOIN types typ ON t.type_id = typ.id
        LEFT JOIN priorities p ON t.priority_id = p.id
        LEFT JOIN queues q ON t.queue_id = q.id
        LEFT JOIN states s ON t.state_id = s.id
        LEFT JOIN agents ow ON t.owner_id = ow.id
        LEFT JOIN customers c ON t.company_id = c.id
        LEFT JOIN services svc ON t.service_id = svc.id
        LEFT JOIN sla ON t.sla_id = sla.id
        ${whereClause}
        ${orderClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(safeItemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      // Calculate age for each ticket
      const tickets = dataResult.rows.map(ticket => ({
        ...ticket,
        age: calculateAge(ticket.createdAt),
      }));

      return {
        tickets,
        total,
      };
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const result = await pool.query(
        `SELECT 
          t.id,
          t.ticket_number as "ticketNumber",
          t.title,
          t.description,
          t.type_id as "typeId",
          typ.name as "typeName",
          t.priority_id as "priorityId",
          p.name as "priorityName",
          p.color as "priorityColor",
          t.queue_id as "queueId",
          q.name as "queueName",
          t.state_id as "stateId",
          s.name as "stateName",
          s.color as "stateColor",
          t.owner_id as "ownerId",
          ow.login as "ownerLogin",
          ow.first_name as "ownerFirstname",
          ow.last_name as "ownerLastname",
          t.company_id as "companyId",
          c.name as "companyName",
          t.service_id as "serviceId",
          svc.name as "serviceName",
          t.sla_id as "slaId",
          sla.name as "slaName",
          t.response_deadline as "responseDeadline",
          t.resolution_deadline as "resolutionDeadline",
          t.first_response_at as "firstResponseAt",
          t.sla_violated as "slaViolated",
          t.pending_start_at as "pendingStartAt",
          t.created_at as "createdAt",
          t.updated_at as "updatedAt",
          t.is_active as "isActive"
        FROM ${Tickets.tableName} t
        LEFT JOIN types typ ON t.type_id = typ.id
        LEFT JOIN priorities p ON t.priority_id = p.id
        LEFT JOIN queues q ON t.queue_id = q.id
        LEFT JOIN states s ON t.state_id = s.id
        LEFT JOIN agents ow ON t.owner_id = ow.id
        LEFT JOIN customers c ON t.company_id = c.id
        LEFT JOIN services svc ON t.service_id = svc.id
        LEFT JOIN sla ON t.sla_id = sla.id
        WHERE t.id = $1 AND t.is_active = true`,
        [id]
      );

      const ticket = result.rows[0];
      if (ticket) {
        ticket.age = calculateAge(ticket.createdAt);
      }

      return ticket || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(ticket) {
    try {
      const query = `
        INSERT INTO ${Tickets.tableName} (
          ticket_number, title, description, type_id, priority_id, queue_id, state_id, 
          owner_id, company_id, service_id, sla_id, response_deadline, resolution_deadline, 
          first_response_at, sla_violated, pending_start_at, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id, ticket_number as "ticketNumber", title, description, type_id as "typeId", 
          priority_id as "priorityId", queue_id as "queueId", state_id as "stateId",
          owner_id as "ownerId", company_id as "companyId", service_id as "serviceId",
          sla_id as "slaId", response_deadline as "responseDeadline", resolution_deadline as "resolutionDeadline",
          first_response_at as "firstResponseAt", sla_violated as "slaViolated", 
          pending_start_at as "pendingStartAt",
          created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"
      `;
      
      const values = [
        ticket.ticketNumber,
        ticket.title,
        ticket.description || null,
        ticket.typeId || null,
        ticket.priorityId || null,
        ticket.queueId || null,
        ticket.stateId || null,
        ticket.ownerId || null,
        ticket.companyId || null,
        ticket.serviceId || null,
        ticket.slaId || null,
        ticket.responseDeadline || null,
        ticket.resolutionDeadline || null,
        ticket.firstResponseAt || null,
        ticket.slaViolated !== undefined ? ticket.slaViolated : false,
        ticket.pendingStartAt || null,
        // Простая конвертация в boolean
        ticket.isActive !== undefined ? Boolean(ticket.isActive) : true,
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, ticket) {
    try {
      const updates = [];
      const values = [id];
      let paramIndex = 2; // $1 - это id

      const fieldMap = {
        ticketNumber: 'ticket_number',
        title: 'title',
        description: 'description',
        typeId: 'type_id',
        priorityId: 'priority_id',
        queueId: 'queue_id',
        stateId: 'state_id',
        ownerId: 'owner_id',
        companyId: 'company_id',
        serviceId: 'service_id',
        slaId: 'sla_id',
        responseDeadline: 'response_deadline',
        resolutionDeadline: 'resolution_deadline',
        firstResponseAt: 'first_response_at',
        slaViolated: 'sla_violated',
        pendingStartAt: 'pending_start_at',
      };

      Object.entries(fieldMap).forEach(([field, column]) => {
        if (ticket[field] !== undefined) {
          updates.push(`${column} = $${paramIndex}`);
          values.push(ticket[field]);
          paramIndex++;
        }
      });

      if (ticket.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        // Простая конвертация в boolean
        const isActiveValue = Boolean(ticket.isActive);
        values.push(isActiveValue);
        paramIndex++;
      }

      // Всегда обновляем updated_at
      updates.push('updated_at = CURRENT_TIMESTAMP');

      const query = `
        UPDATE ${Tickets.tableName} 
        SET ${updates.join(', ')} 
        WHERE id = $1
        RETURNING id, ticket_number as "ticketNumber", title, description, type_id as "typeId", 
          priority_id as "priorityId", queue_id as "queueId", state_id as "stateId",
          owner_id as "ownerId", company_id as "companyId", service_id as "serviceId",
          sla_id as "slaId", response_deadline as "responseDeadline", resolution_deadline as "resolutionDeadline",
          first_response_at as "firstResponseAt", sla_violated as "slaViolated",
          pending_start_at as "pendingStartAt",
          created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"
      `;
      
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      // Soft delete - устанавливаем is_active = false
      const result = await pool.query(
        `UPDATE ${Tickets.tableName} SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND is_active = true RETURNING id`,
        [id]
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  // Generate next ticket number using SEQUENCE
  static async generateTicketNumber() {
    try {
      // Проверяем существует ли sequence, если нет - создаем
      await pool.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'ticket_number_seq') THEN
            CREATE SEQUENCE ticket_number_seq START WITH 1000001;
          END IF;
        END $$;
      `);
      
      // Получаем следующее значение из sequence
      const result = await pool.query("SELECT nextval('ticket_number_seq') as ticket_number");
      return String(result.rows[0].ticket_number);
    } catch (error) {
      console.error('Error in generateTicketNumber:', error);
      // Fallback - если SEQUENCE не работает
      const fallback = await pool.query(
        `SELECT ticket_number FROM ${Tickets.tableName} 
         WHERE ticket_number ~ '^[0-9]+$' 
         ORDER BY CAST(ticket_number AS INTEGER) DESC 
         LIMIT 1`
      );
      
      if (fallback.rows.length === 0) {
        return '1000001';
      }
      
      const lastNumber = parseInt(fallback.rows[0].ticket_number, 10);
      return String(lastNumber + 1);
    }
  }
}

// Helper function to calculate age
function calculateAge(createdAt) {
  if (!createdAt) return { days: 0, hours: 0, minutes: 0, formatted: '0д 0ч' };
  
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now - created;
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  const remainingHours = diffHours % 24;
  const remainingMinutes = diffMinutes % 60;
  
  return {
    days: diffDays,
    hours: remainingHours,
    minutes: remainingMinutes,
    formatted: `${diffDays}д ${remainingHours}ч`,
  };
}

module.exports = Tickets;
