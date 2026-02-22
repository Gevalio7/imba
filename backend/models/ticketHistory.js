const { pool } = require('../config/db');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

class TicketHistory {
  static tableName = 'ticket_history';
  static fields = 'ticketId, changedBy, fieldName, oldValue, newValue';

  // Маппинг имен полей для отображения
  static fieldNames = {
    title: 'Заголовок',
    description: 'Описание',
    typeId: 'Тип',
    priorityId: 'Приоритет',
    queueId: 'Очередь',
    stateId: 'Статус',
    ownerId: 'Владелец',
    companyId: 'Компания',
    slaId: 'SLA',
    isActive: 'Активность',
    attachment: 'Вложение',
  };

  static async getAll(options = {}) {
    const { ticketId, fieldName, sortBy, orderBy = 'asc', itemsPerPage = 10, page = 1 } = options;

    try {
      let whereClause = '';
      let params = [];
      let paramIndex = 1;

      // Фильтр по ticketId
      if (ticketId) {
        whereClause = `WHERE th.ticket_id = $${paramIndex}`;
        params.push(ticketId);
        paramIndex++;
      }

      // Фильтр по типу изменения (field_name)
      if (fieldName) {
        whereClause = whereClause 
          ? `${whereClause} AND th.field_name = $${paramIndex}` 
          : `WHERE th.field_name = $${paramIndex}`;
        params.push(fieldName);
        paramIndex++;
      }

      let orderClause = 'ORDER BY th.created_at DESC';
      const sortableFields = ['fieldName', 'createdAt'];
      if (sortBy && sortableFields.includes(sortBy)) {
        orderClause = `ORDER BY th.${toSnakeCase(sortBy)} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const offset = (page - 1) * itemsPerPage;

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${TicketHistory.tableName} th ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data with agent info
      const dataQuery = `
        SELECT 
          th.id, 
          th.ticket_id as "ticketId", 
          th.changed_by as "changedBy",
          th.field_name as "fieldName",
          th.old_value as "oldValue",
          th.new_value as "newValue",
          th.created_at as "createdAt",
          a.first_name as "changedByFirstName",
          a.last_name as "changedByLastName",
          a.login as "changedByLogin"
        FROM ${TicketHistory.tableName} th
        LEFT JOIN agents a ON th.changed_by = a.id
        ${whereClause} 
        ${orderClause} 
        LIMIT $${paramIndex} 
        OFFSET $${paramIndex + 1}
      `;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      // Transform results to include changedByName and fieldDisplayName
      const history = dataResult.rows.map(row => ({
        ...row,
        changedByName: [row.changedByFirstName, row.changedByLastName].filter(Boolean).join(' ') || row.changedByLogin || 'Система',
        fieldDisplayName: TicketHistory.fieldNames[row.fieldName] || row.fieldName,
      }));

      return {
        history,
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
          th.id, 
          th.ticket_id as "ticketId", 
          th.changed_by as "changedBy",
          th.field_name as "fieldName",
          th.old_value as "oldValue",
          th.new_value as "newValue",
          th.created_at as "createdAt",
          a.first_name as "changedByFirstName",
          a.last_name as "changedByLastName",
          a.login as "changedByLogin"
        FROM ${TicketHistory.tableName} th
        LEFT JOIN agents a ON th.changed_by = a.id
        WHERE th.id = $1`,
        [id]
      );

      if (!result.rows[0]) return null;
      
      const row = result.rows[0];
      return {
        ...row,
        changedByName: [row.changedByFirstName, row.changedByLastName].filter(Boolean).join(' ') || row.changedByLogin || 'Система',
        fieldDisplayName: TicketHistory.fieldNames[row.fieldName] || row.fieldName,
      };
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(historyEntry) {
    try {
      const { ticketId, changedBy, fieldName, oldValue, newValue } = historyEntry;
      
      const query = `
        INSERT INTO ${TicketHistory.tableName} (ticket_id, changed_by, field_name, old_value, new_value) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING 
          id, 
          ticket_id as "ticketId", 
          changed_by as "changedBy",
          field_name as "fieldName",
          old_value as "oldValue",
          new_value as "newValue",
          created_at as "createdAt"
      `;
      const result = await pool.query(query, [ticketId, changedBy || null, fieldName, oldValue || null, newValue || null]);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  // Получить историю согласования (можно расширить при наличии отдельной таблицы)
  static async getApprovalHistory(ticketId) {
    try {
      // Пока возвращаем пустой массив, так как для согласования нужна отдельная таблица
      // В будущем можно добавить таблицу ticket_approvals
      return [];
    } catch (error) {
      console.error('Error in getApprovalHistory:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(`DELETE FROM ${TicketHistory.tableName} WHERE id = $1`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  static async deleteByTicketId(ticketId) {
    try {
      const result = await pool.query(`DELETE FROM ${TicketHistory.tableName} WHERE ticket_id = $1`, [ticketId]);

      return result.rowCount;
    } catch (error) {
      console.error('Error in deleteByTicketId:', error);
      throw error;
    }
  }
}

module.exports = TicketHistory;
