const { pool } = require('../config/db');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

class KnowledgeBase {
  static tableName = 'knowledge_base';
  static fields = 'title, content, categoryId, tags, serviceId, isPublished, viewsCount, createdBy';

  static async getAll(options = {}) {
    const { q, sortBy, orderBy = 'asc', itemsPerPage = 1000, page = 1, categoryId, serviceId, isPublished } = options;

    try {
      let whereClause = '';
      let params = [];
      let paramIndex = 1;

      // Обработка фильтров
      const filterConditions = [];

      if (categoryId) {
        filterConditions.push(`category_id = $${paramIndex}`);
        params.push(categoryId);
        paramIndex++;
      }

      if (serviceId) {
        filterConditions.push(`service_id = $${paramIndex}`);
        params.push(serviceId);
        paramIndex++;
      }

      if (isPublished !== undefined) {
        filterConditions.push(`is_published = $${paramIndex}`);
        params.push(isPublished);
        paramIndex++;
      }

      // Поиск по title и content
      if (q) {
        filterConditions.push(`(title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`);
        params.push(`%${q}%`);
        paramIndex++;
      }

      if (filterConditions.length > 0) {
        whereClause = `WHERE ${filterConditions.join(' AND ')}`;
      }

      let orderClause = 'ORDER BY updated_at DESC';
      const sortableFields = this.fields.split(', ').concat(['created_at', 'updated_at', 'views_count']);
      if (sortBy && sortableFields.includes(sortBy)) {
        orderClause = `ORDER BY ${toSnakeCase(sortBy)} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const offset = (page - 1) * itemsPerPage;

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${KnowledgeBase.tableName} ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data with joins
      const dataQuery = `
        SELECT 
          kb.id,
          kb.title,
          kb.content,
          kb.category_id as "categoryId",
          typ.name as "categoryName",
          kb.tags,
          kb.service_id as "serviceId",
          s.name as "serviceName",
          kb.is_published as "isPublished",
          kb.views_count as "viewsCount",
          kb.created_by as "createdBy",
          a.login as "createdByLogin",
          a.first_name as "createdByFirstname",
          a.last_name as "createdByLastname",
          kb.created_at as "createdAt",
          kb.updated_at as "updatedAt",
          kb.is_active as "isActive"
        FROM ${KnowledgeBase.tableName} kb
        LEFT JOIN types typ ON kb.category_id = typ.id
        LEFT JOIN services s ON kb.service_id = s.id
        LEFT JOIN agents a ON kb.created_by = a.id
        ${whereClause}
        ${orderClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      return {
        articles: dataResult.rows,
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
        `
        SELECT 
          kb.id,
          kb.title,
          kb.content,
          kb.category_id as "categoryId",
          typ.name as "categoryName",
          kb.tags,
          kb.service_id as "serviceId",
          s.name as "serviceName",
          kb.is_published as "isPublished",
          kb.views_count as "viewsCount",
          kb.created_by as "createdBy",
          a.login as "createdByLogin",
          a.first_name as "createdByFirstname",
          a.last_name as "createdByLastname",
          kb.created_at as "createdAt",
          kb.updated_at as "updatedAt",
          kb.is_active as "isActive"
        FROM ${KnowledgeBase.tableName} kb
        LEFT JOIN types typ ON kb.category_id = typ.id
        LEFT JOIN services s ON kb.service_id = s.id
        LEFT JOIN agents a ON kb.created_by = a.id
        WHERE kb.id = $1
        `,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(article) {
    try {
      const fieldList = this.fields.split(', ');
      const placeholders = fieldList.map((_, i) => `$${i + 1}`).join(', ');
      const values = fieldList.map(field => article[field]);

      // Преобразуем имена полей в snake_case для SQL
      const sqlFieldsInsert = fieldList.map(f => toSnakeCase(f)).join(', ');
      const sqlFieldsSelect = fieldList.map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');

      const query = `
        INSERT INTO ${KnowledgeBase.tableName} (${sqlFieldsInsert}, is_active) 
        VALUES (${placeholders}, $${fieldList.length + 1})
        RETURNING id, ${sqlFieldsSelect}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"
      `;
      
      values.push(article.isActive !== undefined ? article.isActive : true);
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, article) {
    try {
      const fieldList = this.fields.split(', ');
      const updates = [];
      const values = [];
      let paramIndex = 1;

      // Обновляем только переданные поля
      fieldList.forEach(field => {
        if (article[field] !== undefined) {
          updates.push(`${toSnakeCase(field)} = $${paramIndex}`);
          values.push(article[field]);
          paramIndex++;
        }
      });

      // Добавляем isActive если передан
      if (article.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(article.isActive);
        paramIndex++;
      }

      // Всегда обновляем updated_at
      updates.push('updated_at = CURRENT_TIMESTAMP');

      // Добавляем id в конец
      values.push(id);

      const sqlFieldsSelect = fieldList.map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');

      const query = `
        UPDATE ${KnowledgeBase.tableName} 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex}
        RETURNING id, ${sqlFieldsSelect}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"
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
      const result = await pool.query(`DELETE FROM ${KnowledgeBase.tableName} WHERE id = $1`, [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  // Увеличение счетчика просмотров
  static async incrementViews(id) {
    try {
      const result = await pool.query(
        `UPDATE ${KnowledgeBase.tableName} SET views_count = views_count + 1 WHERE id = $1 RETURNING id, views_count as "viewsCount"`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in incrementViews:', error);
      throw error;
    }
  }

  // Поиск по тегам
  static async searchByTag(tag) {
    try {
      const result = await pool.query(
        `SELECT id, title, content, tags, views_count as "viewsCount", created_at as "createdAt" 
         FROM ${KnowledgeBase.tableName} 
         WHERE is_published = true AND $1 = ANY(tags)
         ORDER BY views_count DESC
         LIMIT 20`,
        [tag]
      );
      return result.rows;
    } catch (error) {
      console.error('Error in searchByTag:', error);
      throw error;
    }
  }
}

module.exports = KnowledgeBase;
