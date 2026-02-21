const { pool } = require('../config/db');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

class StateTransitions {
  static tableName = 'state_transitions';
  static fields = 'typeId, fromStateId, toStateId, name, sortOrder';

  static async getAll(options = {}) {
    const { q, sortBy, orderBy = 'asc', itemsPerPage = 10, page = 1, typeId, fromStateId, toStateId } = options;

    try {
      let whereClause = '';
      let params = [];
      let paramIndex = 1;

      // Фильтр по типу
      if (typeId) {
        whereClause = `WHERE st.type_id = $${paramIndex}`;
        params.push(typeId);
        paramIndex++;
      }

      // Фильтр по исходному статусу
      if (fromStateId) {
        whereClause = whereClause 
          ? `${whereClause} AND st.from_state_id = $${paramIndex}` 
          : `WHERE st.from_state_id = $${paramIndex}`;
        params.push(fromStateId);
        paramIndex++;
      }

      // Фильтр по целевому статусу
      if (toStateId) {
        whereClause = whereClause 
          ? `${whereClause} AND st.to_state_id = $${paramIndex}` 
          : `WHERE st.to_state_id = $${paramIndex}`;
        params.push(toStateId);
        paramIndex++;
      }

      // Поиск по названию
      if (q) {
        whereClause = whereClause 
          ? `${whereClause} AND st.name ILIKE $${paramIndex}` 
          : `WHERE st.name ILIKE $${paramIndex}`;
        params.push(`%${q}%`);
        paramIndex++;
      }

      let orderClause = 'ORDER BY st.sort_order ASC, st.id ASC';
      const sortableFields = ['id', 'name', 'createdAt', 'sortOrder'];
      if (sortBy && sortableFields.includes(sortBy)) {
        orderClause = `ORDER BY st.${toSnakeCase(sortBy)} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const offset = (page - 1) * itemsPerPage;

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${StateTransitions.tableName} st ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data with related info
      const dataQuery = `
        SELECT 
          st.id, 
          st.type_id as "typeId",
          st.from_state_id as "fromStateId",
          st.to_state_id as "toStateId",
          st.name,
          st.is_active as "isActive",
          st.sort_order as "sortOrder",
          st.created_at as "createdAt",
          t.name as "typeName",
          fs.name as "fromStateName",
          ts.name as "toStateName"
        FROM ${StateTransitions.tableName} st
        LEFT JOIN types t ON st.type_id = t.id
        LEFT JOIN states fs ON st.from_state_id = fs.id
        LEFT JOIN states ts ON st.to_state_id = ts.id
        ${whereClause} 
        ${orderClause} 
        LIMIT $${paramIndex} 
        OFFSET $${paramIndex + 1}
      `;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      return {
        transitions: dataResult.rows,
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
          st.id, 
          st.type_id as "typeId",
          st.from_state_id as "fromStateId",
          st.to_state_id as "toStateId",
          st.name,
          st.is_active as "isActive",
          st.sort_order as "sortOrder",
          st.created_at as "createdAt",
          t.name as "typeName",
          fs.name as "fromStateName",
          ts.name as "toStateName"
        FROM ${StateTransitions.tableName} st
        LEFT JOIN types t ON st.type_id = t.id
        LEFT JOIN states fs ON st.from_state_id = fs.id
        LEFT JOIN states ts ON st.to_state_id = ts.id
        WHERE st.id = $1`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(transition) {
    try {
      // Получаем максимальный sort_order
      const maxOrderResult = await pool.query(`SELECT COALESCE(MAX(sort_order), 0) as max_order FROM ${StateTransitions.tableName}`);
      const sortOrder = transition.sortOrder !== undefined ? transition.sortOrder : maxOrderResult.rows[0].max_order + 1;

      const query = `
        INSERT INTO ${StateTransitions.tableName} (type_id, from_state_id, to_state_id, name, is_active, sort_order) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING 
          id, 
          type_id as "typeId",
          from_state_id as "fromStateId",
          to_state_id as "toStateId",
          name,
          is_active as "isActive",
          sort_order as "sortOrder",
          created_at as "createdAt"
      `;
      const result = await pool.query(query, [
        transition.typeId || null,
        transition.fromStateId || null,
        transition.toStateId,
        transition.name,
        transition.isActive !== undefined ? transition.isActive : true,
        sortOrder
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, transition) {
    try {
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (transition.typeId !== undefined) {
        updates.push(`type_id = $${paramIndex}`);
        values.push(transition.typeId || null);
        paramIndex++;
      }

      if (transition.fromStateId !== undefined) {
        updates.push(`from_state_id = $${paramIndex}`);
        values.push(transition.fromStateId || null);
        paramIndex++;
      }

      if (transition.toStateId !== undefined) {
        updates.push(`to_state_id = $${paramIndex}`);
        values.push(transition.toStateId);
        paramIndex++;
      }

      if (transition.name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        values.push(transition.name);
        paramIndex++;
      }

      if (transition.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(transition.isActive);
        paramIndex++;
      }

      if (transition.sortOrder !== undefined) {
        updates.push(`sort_order = $${paramIndex}`);
        values.push(transition.sortOrder);
        paramIndex++;
      }

      // Добавляем id в конец
      values.push(id);

      const query = `
        UPDATE ${StateTransitions.tableName} 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING 
          id, 
          type_id as "typeId",
          from_state_id as "fromStateId",
          to_state_id as "toStateId",
          name,
          is_active as "isActive",
          sort_order as "sortOrder",
          created_at as "createdAt"
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
      const result = await pool.query(`DELETE FROM ${StateTransitions.tableName} WHERE id = $1`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  // Получить доступные переходы для тикета
  static async getAvailableTransitions(typeId, currentStateId) {
    try {
      const result = await pool.query(
        `SELECT 
          st.id, 
          st.type_id as "typeId",
          st.from_state_id as "fromStateId",
          st.to_state_id as "toStateId",
          st.name,
          ts.name as "toStateName",
          ts.color as "toStateColor"
        FROM ${StateTransitions.tableName} st
        LEFT JOIN states ts ON st.to_state_id = ts.id
        WHERE st.is_active = true
          AND (st.type_id = $1 OR st.type_id IS NULL)
          AND (st.from_state_id = $2 OR st.from_state_id IS NULL)
        ORDER BY st.name`,
        [typeId, currentStateId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error in getAvailableTransitions:', error);
      throw error;
    }
  }
}

module.exports = StateTransitions;
