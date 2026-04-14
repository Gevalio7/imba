const { pool } = require('../config/db');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

class Types {
  static tableName = 'types';
  static fields = 'name, comment, workflowId';

  static async getAll(options = {}) {
    const { q, sortBy, orderBy = 'asc', itemsPerPage = 1000, page = 1, includeCategories = false, isActive } = options;

    try {
      let whereConditions = [];
      let params = [];
      let paramIndex = 1;

      // Фильтр по статусу (isActive)
      if (isActive !== undefined) {
        whereConditions.push(`t.is_active = $${paramIndex}`);
        params.push(isActive);
        paramIndex++;
      }

      if (q) {
        const searchFields = ['name', 'comment'];
        const conditions = searchFields.map(field => `t.${toSnakeCase(field)} ILIKE $${paramIndex}`).join(' OR ');
        whereConditions.push(`(${conditions})`);
        params.push(`%${q}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      let orderClause = 'ORDER BY id ASC';
      const sortableFields = ['id', 'name', 'createdAt', 'updatedAt'];
      if (sortBy && sortableFields.includes(sortBy)) {
        orderClause = `ORDER BY ${toSnakeCase(sortBy)} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const offset = (page - 1) * itemsPerPage;

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${Types.tableName} t ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data with workflow info
      const dataQuery = `
        SELECT
          t.id,
          t.name,
          t.comment,
          t.workflow_id as "workflowId",
          t.category_ids as "categoryIds",
          t.created_at as "createdAt",
          t.updated_at as "updatedAt",
          t.is_active as "isActive",
          w.name as "workflowName"
        FROM ${Types.tableName} t
        LEFT JOIN workflows w ON t.workflow_id = w.id
        ${whereClause}
        ${orderClause}
        LIMIT $${paramIndex}
        OFFSET $${paramIndex + 1}
      `;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      // Если запрошены категории - загружаем их
      const types = dataResult.rows;
      if (includeCategories && types.length > 0) {
        // Получаем все категории
        const categoriesResult = await pool.query(
          `SELECT id, name, labor_hours as "laborHours", is_active as "isActive" FROM type_categories WHERE is_active = true ORDER BY name`
        );
        const allCategories = categoriesResult.rows;
        
        // Добавляем категории к каждому типу
        types.forEach(type => {
          const categoryIds = type.categoryIds || [];
          type.categories = allCategories.filter(c => categoryIds.includes(c.id));
        });
      }

      return {
        types,
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
          t.name, 
          t.comment, 
          t.workflow_id as "workflowId",
          t.category_ids as "categoryIds",
          t.created_at as "createdAt", 
          t.updated_at as "updatedAt", 
          t.is_active as "isActive",
          w.name as "workflowName"
        FROM ${Types.tableName} t
        LEFT JOIN workflows w ON t.workflow_id = w.id
        WHERE t.id = $1`,
        [id]
      );

      const type = result.rows[0] || null;
      
      // Загружаем категории
      if (type && type.categoryIds && type.categoryIds.length > 0) {
        const categoriesResult = await pool.query(
          `SELECT id, name, labor_hours as "laborHours", is_active as "isActive" FROM type_categories WHERE id = ANY($1)`,
          [type.categoryIds]
        );
        type.categories = categoriesResult.rows;
      } else if (type) {
        type.categories = [];
      }

      return type;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(type) {
    try {
      const query = `
        INSERT INTO ${Types.tableName} (name, comment, workflow_id, category_ids, is_active) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING 
          id, 
          name, 
          comment, 
          workflow_id as "workflowId",
          category_ids as "categoryIds",
          created_at as "createdAt", 
          updated_at as "updatedAt", 
          is_active as "isActive"
      `;
      const result = await pool.query(query, [
        type.name,
        type.comment || null,
        type.workflowId || null,
        type.categoryIds || [],
        type.isActive !== undefined ? type.isActive : true,
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, type) {
    try {
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (type.name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        values.push(type.name);
        paramIndex++;
      }

      if (type.comment !== undefined) {
        updates.push(`comment = $${paramIndex}`);
        values.push(type.comment);
        paramIndex++;
      }

      if (type.workflowId !== undefined) {
        updates.push(`workflow_id = $${paramIndex}`);
        values.push(type.workflowId || null);
        paramIndex++;
      }

      if (type.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(type.isActive);
        paramIndex++;
      }

      if (type.categoryIds !== undefined) {
        updates.push(`category_ids = $${paramIndex}`);
        values.push(type.categoryIds);
        paramIndex++;
      }

      if (updates.length === 0) {
        return this.getById(id);
      }

      // Всегда обновляем updated_at
      updates.push('updated_at = CURRENT_TIMESTAMP');

      // Добавляем id в конец
      values.push(id);

      const query = `
        UPDATE ${Types.tableName} 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING 
          id, 
          name, 
          comment, 
          workflow_id as "workflowId",
          category_ids as "categoryIds",
          created_at as "createdAt", 
          updated_at as "updatedAt", 
          is_active as "isActive"
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
      const result = await pool.query(`DELETE FROM ${Types.tableName} WHERE id = $1`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }
}

module.exports = Types;
