const { pool } = require('../config/db');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

class Tickets {
  static tableName = 'tickets';
  static fields = 'ticketNumber, title, description, typeId, priorityId, queueId, stateId, ownerId, companyId, slaId';

  static async getAll(options = {}) {
    const { q, sortBy, orderBy = 'asc', itemsPerPage = 10, page = 1 } = options;

    try {
      let whereClause = '';
      let params = [];
      let paramIndex = 1;

      if (q) {
        const searchFields = ['ticket_number', 'title'];
        const conditions = searchFields.map(field => `${field} ILIKE $${paramIndex}`).join(' OR ');
        whereClause = `WHERE ${conditions}`;
        params.push(`%${q}%`);
        paramIndex++;
      }

      let orderClause = 'ORDER BY t.created_at DESC';
      const sortableFields = ['ticketNumber', 'title', 'createdAt', 'updatedAt'];
      if (sortBy && sortableFields.includes(sortBy)) {
        const sortField = sortBy === 'ticketNumber' ? 't.ticket_number' : 
                          sortBy === 'createdAt' ? 't.created_at' : 
                          sortBy === 'updatedAt' ? 't.updated_at' : `t.${toSnakeCase(sortBy)}`;
        orderClause = `ORDER BY ${sortField} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const offset = (page - 1) * itemsPerPage;

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
          t.sla_id as "slaId",
          sla.name as "slaName",
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
        LEFT JOIN sla ON t.sla_id = sla.id
        ${whereClause}
        ${orderClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(itemsPerPage, offset);
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
          t.sla_id as "slaId",
          sla.name as "slaName",
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
        LEFT JOIN sla ON t.sla_id = sla.id
        WHERE t.id = $1`,
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
          owner_id, company_id, sla_id, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, ticket_number as "ticketNumber", title, description, type_id as "typeId", 
          priority_id as "priorityId", queue_id as "queueId", state_id as "stateId",
          owner_id as "ownerId", company_id as "companyId", sla_id as "slaId",
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
        ticket.slaId || null,
        ticket.isActive !== undefined ? ticket.isActive : true,
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
      const values = [];
      let paramIndex = 1;

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
        slaId: 'sla_id',
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
        values.push(ticket.isActive);
        paramIndex++;
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const query = `
        UPDATE ${Tickets.tableName} 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex}
        RETURNING id, ticket_number as "ticketNumber", title, description, type_id as "typeId", 
          priority_id as "priorityId", queue_id as "queueId", state_id as "stateId",
          owner_id as "ownerId", company_id as "companyId", sla_id as "slaId",
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
      const result = await pool.query(`DELETE FROM ${Tickets.tableName} WHERE id = $1`, [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  // Generate next ticket number
  static async generateTicketNumber() {
    try {
      const result = await pool.query(
        `SELECT ticket_number FROM ${Tickets.tableName} 
         WHERE ticket_number ~ '^[0-9]+$' 
         ORDER BY CAST(ticket_number AS INTEGER) DESC 
         LIMIT 1`
      );
      
      if (result.rows.length === 0) {
        return '1000001';
      }
      
      const lastNumber = parseInt(result.rows[0].ticket_number, 10);
      return String(lastNumber + 1);
    } catch (error) {
      console.error('Error in generateTicketNumber:', error);
      throw error;
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
