const { pool } = require('../config/db');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

class CalendarEvents {
  static tableName = 'calendar_events';
  static fields = 'calendarId, title, start, eventEnd, allDay, description';

  static async getAll(options = {}) {
    const { calendarId, q, sortBy, orderBy = 'asc', itemsPerPage = 10, page = 1, startDate, endDate } = options;

    try {
      let whereClause = '';
      let params = [];
      let paramIndex = 1;

      if (calendarId) {
        if (Array.isArray(calendarId)) {
          const placeholders = calendarId.map((_, i) => `$${paramIndex + i}`).join(', ');
          whereClause = `WHERE calendar_id IN (${placeholders})`;
          params.push(...calendarId);
          paramIndex += calendarId.length;
        } else {
          whereClause = `WHERE calendar_id = $${paramIndex}`;
          params.push(calendarId);
          paramIndex++;
        }
      }

      if (q) {
        const searchFields = this.fields.split(', ');
        const conditions = searchFields.map(field => `${toSnakeCase(field)} ILIKE $${paramIndex}`).join(' OR ');
        whereClause = whereClause ? `${whereClause} AND (${conditions})` : `WHERE ${conditions}`;
        params.push(`%${q}%`);
        paramIndex++;
      }

      // Фильтрация по диапазону дат
      if (startDate) {
        whereClause = whereClause ? `${whereClause} AND start::date >= $${paramIndex}::date` : `WHERE start::date >= $${paramIndex}::date`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereClause = whereClause ? `${whereClause} AND start::date <= $${paramIndex}::date` : `WHERE start::date <= $${paramIndex}::date`;
        params.push(endDate);
        paramIndex++;
      }

      let orderClause = '';
      const sortableFields = this.fields.split(', ').concat(['created_at', 'updated_at']);
      if (sortBy && sortableFields.includes(sortBy)) {
        orderClause = `ORDER BY ${sortBy} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const offset = (page - 1) * itemsPerPage;

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${CalendarEvents.tableName} ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      const sqlFields = this.fields.split(', ').map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');
      const dataQuery = `SELECT id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt" FROM ${CalendarEvents.tableName} ${whereClause} ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      return {
        events: dataResult.rows,
        total,
      };
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const sqlFields = this.fields.split(', ').map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');
      const result = await pool.query(
        `SELECT id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt" FROM ${CalendarEvents.tableName} WHERE id = $1`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(event) {
    try {
      const fieldList = this.fields.split(', ');
      const placeholders = fieldList.map((_, i) => `$${i + 1}`).join(', ');
      const values = fieldList.map(field => event[field]);

      const sqlFieldsInsert = fieldList.map(f => toSnakeCase(f)).join(', ');
      const sqlFieldsSelect = fieldList.map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');

      const query = `INSERT INTO ${CalendarEvents.tableName} (${sqlFieldsInsert}) VALUES (${placeholders}) RETURNING id, ${sqlFieldsSelect}, created_at as "createdAt", updated_at as "updatedAt"`;
      const result = await pool.query(query, values);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async createMultiple(events) {
    try {
      if (events.length === 0) return [];

      const fieldList = this.fields.split(', ');
      const sqlFieldsInsert = fieldList.map(f => toSnakeCase(f)).join(', ');
      const sqlFieldsSelect = fieldList.map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');

      const values = [];
      const placeholders = [];

      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const eventValues = fieldList.map(field => event[field]);
        values.push(...eventValues);
        const startIndex = i * fieldList.length + 1;
        const endIndex = startIndex + fieldList.length - 1;
        placeholders.push(`(${Array.from({ length: fieldList.length }, (_, j) => `$${startIndex + j}`).join(', ')})`);
      }

      const query = `INSERT INTO ${CalendarEvents.tableName} (${sqlFieldsInsert}) VALUES ${placeholders.join(', ')} RETURNING id, ${sqlFieldsSelect}, created_at as "createdAt", updated_at as "updatedAt"`;
      const result = await pool.query(query, values);

      return result.rows;
    } catch (error) {
      console.error('Error in createMultiple:', error);
      throw error;
    }
  }

  static async update(id, event) {
    try {
      const fieldList = this.fields.split(', ');
      const updates = [];
      const values = [];
      let paramIndex = 1;

      fieldList.forEach(field => {
        if (event[field] !== undefined) {
          updates.push(`${toSnakeCase(field)} = $${paramIndex}`);
          values.push(event[field]);
          paramIndex++;
        }
      });

      updates.push('updated_at = CURRENT_TIMESTAMP');

      values.push(id);

      const sqlFields = fieldList.map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');

      const query = `UPDATE ${CalendarEvents.tableName} SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt"`;
      const result = await pool.query(query, values);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(`DELETE FROM ${CalendarEvents.tableName} WHERE id = $1`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  static async deleteByCalendarId(calendarId) {
    try {
      const result = await pool.query(`DELETE FROM ${CalendarEvents.tableName} WHERE calendar_id = $1`, [calendarId]);

      return result.rowCount;
    } catch (error) {
      console.error('Error in deleteByCalendarId:', error);
      throw error;
    }
  }
}

module.exports = CalendarEvents;
