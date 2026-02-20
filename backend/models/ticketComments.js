const { pool } = require('../config/db');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

class TicketComments {
  static tableName = 'ticket_comments';
  static fields = 'ticketId, content, authorId, isInternal';

  static async getAll(options = {}) {
    const { ticketId, q, sortBy, orderBy = 'asc', itemsPerPage = 10, page = 1 } = options;

    try {
      let whereClause = '';
      let params = [];
      let paramIndex = 1;

      // Фильтр по ticketId
      if (ticketId) {
        whereClause = `WHERE tc.ticket_id = $${paramIndex}`;
        params.push(ticketId);
        paramIndex++;
      }

      if (q) {
        const searchFields = ['content'];
        const conditions = searchFields.map(field => `tc.${toSnakeCase(field)} ILIKE $${paramIndex}`).join(' OR ');
        whereClause = whereClause ? `${whereClause} AND (${conditions})` : `WHERE ${conditions}`;
        params.push(`%${q}%`);
        paramIndex++;
      }

      let orderClause = 'ORDER BY tc.created_at DESC';
      const sortableFields = ['content', 'createdAt', 'updatedAt'];
      if (sortBy && sortableFields.includes(sortBy)) {
        orderClause = `ORDER BY tc.${toSnakeCase(sortBy)} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const offset = (page - 1) * itemsPerPage;

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${TicketComments.tableName} tc LEFT JOIN agents a ON tc.author_id = a.id ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data with author info
      const dataQuery = `
        SELECT 
          tc.id, 
          tc.ticket_id as "ticketId", 
          tc.content, 
          tc.author_id as "authorId",
          tc.is_internal as "isInternal",
          tc.created_at as "createdAt", 
          tc.updated_at as "updatedAt",
          a.first_name as "authorFirstName",
          a.last_name as "authorLastName",
          a.login as "authorLogin"
        FROM ${TicketComments.tableName} tc
        LEFT JOIN agents a ON tc.author_id = a.id
        ${whereClause} 
        ${orderClause} 
        LIMIT $${paramIndex} 
        OFFSET $${paramIndex + 1}
      `;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      // Transform results to include authorName
      const comments = dataResult.rows.map(row => ({
        ...row,
        authorName: [row.authorFirstName, row.authorLastName].filter(Boolean).join(' ') || row.authorLogin || 'Неизвестный',
      }));

      return {
        comments,
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
          tc.id, 
          tc.ticket_id as "ticketId", 
          tc.content, 
          tc.author_id as "authorId",
          tc.is_internal as "isInternal",
          tc.created_at as "createdAt", 
          tc.updated_at as "updatedAt",
          a.first_name as "authorFirstName",
          a.last_name as "authorLastName",
          a.login as "authorLogin"
        FROM ${TicketComments.tableName} tc
        LEFT JOIN agents a ON tc.author_id = a.id
        WHERE tc.id = $1`,
        [id]
      );

      if (!result.rows[0]) return null;
      
      const row = result.rows[0];
      return {
        ...row,
        authorName: [row.authorFirstName, row.authorLastName].filter(Boolean).join(' ') || row.authorLogin || 'Неизвестный',
      };
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(comment) {
    try {
      const { ticketId, content, authorId, isInternal = false } = comment;
      
      const query = `
        INSERT INTO ${TicketComments.tableName} (ticket_id, content, author_id, is_internal) 
        VALUES ($1, $2, $3, $4) 
        RETURNING 
          id, 
          ticket_id as "ticketId", 
          content, 
          author_id as "authorId",
          is_internal as "isInternal",
          created_at as "createdAt", 
          updated_at as "updatedAt"
      `;
      const result = await pool.query(query, [ticketId, content, authorId || null, isInternal]);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, comment) {
    try {
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (comment.content !== undefined) {
        updates.push(`content = $${paramIndex}`);
        values.push(comment.content);
        paramIndex++;
      }

      if (comment.isInternal !== undefined) {
        updates.push(`is_internal = $${paramIndex}`);
        values.push(comment.isInternal);
        paramIndex++;
      }

      // Всегда обновляем updated_at
      updates.push('updated_at = CURRENT_TIMESTAMP');

      // Добавляем id в конец
      values.push(id);

      const query = `
        UPDATE ${TicketComments.tableName} 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING 
          id, 
          ticket_id as "ticketId", 
          content, 
          author_id as "authorId",
          is_internal as "isInternal",
          created_at as "createdAt", 
          updated_at as "updatedAt"
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
      const result = await pool.query(`DELETE FROM ${TicketComments.tableName} WHERE id = $1`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  static async deleteByTicketId(ticketId) {
    try {
      const result = await pool.query(`DELETE FROM ${TicketComments.tableName} WHERE ticket_id = $1`, [ticketId]);

      return result.rowCount;
    } catch (error) {
      console.error('Error in deleteByTicketId:', error);
      throw error;
    }
  }
}

module.exports = TicketComments;
