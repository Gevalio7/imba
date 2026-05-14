const { pool } = require('../config/db');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

class SessionManagement {
  static tableName = 'session_management';
  static fields = 'username, ipAddress, userAgent, loginTime, lastActivity, type, userId';

  static async getAll(options = {}) {
    const { q, sortBy, orderBy = 'asc', itemsPerPage = 1000, page = 1 } = options;

    try {
      let whereClause = '';
      let params = [];
      let paramIndex = 1;

      if (q) {
        const searchFields = this.fields.split(', ');
        const textFields = searchFields.filter(field => field !== 'userId');
        const conditions = [];

        // If q is numeric, search userId exactly
        const numQ = parseInt(q, 10);
        if (!isNaN(numQ)) {
          conditions.push(`user_id = $${paramIndex}`);
          params.push(numQ);
          paramIndex++;
        }

        // Always search text fields with ILIKE
        if (textFields.length > 0) {
          const textConditions = textFields.map(field => `${toSnakeCase(field)} ILIKE $${paramIndex}`).join(' OR ');
          conditions.push(`(${textConditions})`);
          params.push(`%${q}%`);
          paramIndex++;
        }

        whereClause = `WHERE ${conditions.join(' OR ')}`;
      }

      let orderClause = '';
      const sortableFields = this.fields.split(', ').concat(['created_at', 'updated_at']);
      if (sortBy && sortableFields.includes(sortBy)) {
        orderClause = `ORDER BY ${sortBy} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const offset = (page - 1) * itemsPerPage;

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${SessionManagement.tableName} ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      // Преобразуем имена полей в snake_case для SQL
      const sqlFields = this.fields.split(', ').map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');
      const dataQuery = `SELECT id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive" FROM ${SessionManagement.tableName} ${whereClause} ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      return {
        sessionManagement: dataResult.rows,
        total,
      };
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      // Преобразуем имена полей в snake_case для SQL
      const sqlFields = this.fields.split(', ').map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');
      const result = await pool.query(
        `SELECT id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive" FROM ${SessionManagement.tableName} WHERE id = $1`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(sessionmanagement) {
    try {
      const fieldList = this.fields.split(', ');
      const placeholders = fieldList.map((_, i) => `$${i + 1}`).join(', ');
      const values = fieldList.map(field => sessionmanagement[field]);

      // Добавляем isActive
      values.push(sessionmanagement.isActive !== undefined ? sessionmanagement.isActive : true);

      // Преобразуем имена полей в snake_case для SQL
      const sqlFieldsInsert = fieldList.map(f => toSnakeCase(f)).join(', ');
      const sqlFieldsSelect = fieldList.map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');

      const query = `INSERT INTO ${SessionManagement.tableName} (${sqlFieldsInsert}, is_active) VALUES (${placeholders}, $${fieldList.length + 1}) RETURNING id, ${sqlFieldsSelect}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"`;
      const result = await pool.query(query, values);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, sessionmanagement) {
    try {
      const fieldList = this.fields.split(', ');
      const updates = [];
      const values = [];
      let paramIndex = 1;

      // Обновляем только переданные поля
      fieldList.forEach(field => {
        if (sessionmanagement[field] !== undefined) {
          updates.push(`${toSnakeCase(field)} = $${paramIndex}`);
          values.push(sessionmanagement[field]);
          paramIndex++;
        }
      });

      // Добавляем isActive если передан
      if (sessionmanagement.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(sessionmanagement.isActive);
        paramIndex++;
      }

      // Если isActive устанавливается в false, обновляем lastActivity
      if (sessionmanagement.isActive === false) {
        updates.push(`last_activity = $${paramIndex}`);
        values.push(new Date().toISOString());
        paramIndex++;
      }

      // Всегда обновляем updated_at
      updates.push('updated_at = CURRENT_TIMESTAMP');

      // Добавляем id в конец
      values.push(id);

      // Преобразуем имена полей в snake_case для SQL
      const sqlFields = fieldList.map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');

      const query = `UPDATE ${SessionManagement.tableName} SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"`;
      const result = await pool.query(query, values);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }



  static async terminateAllForUser(userId) {
    try {
      const query = `UPDATE ${SessionManagement.tableName} SET is_active = false, last_activity = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_active = true`;
      const result = await pool.query(query, [userId]);
      return result.rowCount;
    } catch (error) {
      console.error('Error in terminateAllForUser:', error);
      throw error;
    }
  }

  static async terminateAllActive() {
    try {
      const query = `UPDATE ${SessionManagement.tableName} SET is_active = false, last_activity = CURRENT_TIMESTAMP WHERE is_active = true`;
      const result = await pool.query(query, []);
      return result.rowCount;
    } catch (error) {
      console.error('Error in terminateAllActive:', error);
      throw error;
    }
  }

  static async terminateIdleSessions(idleMinutes = 60) {
    try {
      const query = `
        UPDATE ${SessionManagement.tableName}
        SET is_active = false, last_activity = CURRENT_TIMESTAMP
        WHERE is_active = true AND last_activity < NOW() - INTERVAL '${idleMinutes} minutes'
      `;
      const result = await pool.query(query, []);
      return result.rowCount;
    } catch (error) {
      console.error('Error in terminateIdleSessions:', error);
      throw error;
    }
  }
}

module.exports = SessionManagement;
