const { pool } = require('../config/db');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

class WebServices {
  static tableName = 'web_services';
  static fields = 'name, description, endpoint, method, lastTested';

  static async getAll(options = {}) {
    const { q, sortBy, orderBy = 'asc', itemsPerPage = 10, page = 1 } = options;

    try {
      let whereClause = '';
      let params = [];
      let paramIndex = 1;

      if (q) {
        const searchFields = this.fields.split(', ');
        const conditions = searchFields.map(field => `${toSnakeCase(field)} ILIKE $${paramIndex}`).join(' OR ');
        whereClause = `WHERE ${conditions}`;
        params.push(`%${q}%`);
        paramIndex++;
      }

      let orderClause = '';
      const sortableFields = this.fields.split(', ').concat(['created_at', 'updated_at']);
      if (sortBy && sortableFields.includes(sortBy)) {
        orderClause = `ORDER BY ${sortBy} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const offset = (page - 1) * itemsPerPage;

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${WebServices.tableName} ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      // Преобразуем имена полей в snake_case для SQL
      const sqlFields = this.fields.split(', ').map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');
      const dataQuery = `SELECT id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive" FROM ${WebServices.tableName} ${whereClause} ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      return {
        webServices: dataResult.rows,
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
        `SELECT id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive" FROM ${WebServices.tableName} WHERE id = $1`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(webservice) {
    try {
      const fieldList = this.fields.split(', ');
      const placeholders = fieldList.map((_, i) => `$${i + 1}`).join(', ');
      const values = fieldList.map(field => webservice[field]);
      
      // Добавляем isActive
      values.push(webservice.isActive !== undefined ? webservice.isActive : true);
      
      // Преобразуем имена полей в snake_case для SQL
      const sqlFieldsInsert = fieldList.map(f => toSnakeCase(f)).join(', ');
      const sqlFieldsSelect = fieldList.map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');
      
      const query = `INSERT INTO ${WebServices.tableName} (${sqlFieldsInsert}, is_active) VALUES (${placeholders}, $${fieldList.length + 1}) RETURNING id, ${sqlFieldsSelect}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"`;
      const result = await pool.query(query, values);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, webservice) {
    try {
      const fieldList = this.fields.split(', ');
      const updates = [];
      const values = [];
      let paramIndex = 1;

      // Обновляем только переданные поля
      fieldList.forEach(field => {
        if (webservice[field] !== undefined) {
          updates.push(`${toSnakeCase(field)} = $${paramIndex}`);
          values.push(webservice[field]);
          paramIndex++;
        }
      });

      // Добавляем isActive если передан
      if (webservice.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(webservice.isActive);
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

      const query = `UPDATE ${WebServices.tableName} SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"`;
      const result = await pool.query(query, values);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(`DELETE FROM ${WebServices.tableName} WHERE id = $1`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }
}

module.exports = WebServices;
