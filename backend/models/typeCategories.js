const { pool } = require('../config/db');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

class TypeCategories {
  static tableName = 'type_categories';
  static fields = 'name, laborHours, isActive';

  static async getAll(options = {}) {
    const { q, sortBy, orderBy = 'asc', itemsPerPage = 1000, page = 1 } = options;

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
      const countQuery = `SELECT COUNT(*) as total FROM ${TypeCategories.tableName} ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      const sqlFields = this.fields.split(', ').map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? `tc.${snake}` : `tc.${snake} as "${f}"`;
      }).join(', ');

      const dataQuery = `SELECT tc.id, ${sqlFields}, tc.created_at as "createdAt", tc.updated_at as "updatedAt" FROM ${TypeCategories.tableName} tc ${whereClause} ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(itemsPerPage, offset);
      
      const dataResult = await pool.query(dataQuery, params);

      return {
        typeCategories: dataResult.rows,
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
        return snake === f ? `tc.${snake}` : `tc.${snake} as "${f}"`;
      }).join(', ');

      const result = await pool.query(
        `SELECT tc.id, ${sqlFields}, tc.created_at as "createdAt", tc.updated_at as "updatedAt" FROM ${TypeCategories.tableName} tc WHERE tc.id = $1`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(category) {
    try {
      const fieldList = this.fields.split(', ');
      const values = fieldList.map(field => category[field]);
      
      const sqlFieldsInsert = fieldList.map(f => toSnakeCase(f)).join(', ');
      const sqlFieldsSelect = fieldList.map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? snake : `${snake} as "${f}"`;
      }).join(', ');

      const query = `INSERT INTO ${TypeCategories.tableName} (${sqlFieldsInsert}) VALUES (${fieldList.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING id, ${sqlFieldsSelect}, created_at as "createdAt", updated_at as "updatedAt"`;
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, category) {
    try {
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (category.name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        values.push(category.name);
        paramIndex++;
      }

      if (category.laborHours !== undefined) {
        updates.push(`labor_hours = $${paramIndex}`);
        values.push(category.laborHours);
        paramIndex++;
      }

      if (category.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(category.isActive);
        paramIndex++;
      }

      // Всегда обновляем updated_at
      updates.push('updated_at = CURRENT_TIMESTAMP');

      values.push(id);

      const query = `UPDATE ${TypeCategories.tableName} SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, labor_hours as "laborHours", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"`;
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(`DELETE FROM ${TypeCategories.tableName} WHERE id = $1`, [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }
}

module.exports = TypeCategories;
