const { pool } = require('../config/db');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

class WorkflowTransitions {
  static tableName = 'workflow_transitions';
  static fields = 'workflowId, sourceStatusId, targetStatusId, actionLabel, sortOrder';

  static async getAll(options = {}) {
    const { q, sortBy, orderBy = 'asc', itemsPerPage = 10, page = 1, workflowId } = options;

    try {
      let whereClause = '';
      let params = [];
      let paramIndex = 1;

      // Фильтр по воркфлоу
      if (workflowId) {
        whereClause = `WHERE wt.workflow_id = $${paramIndex}`;
        params.push(workflowId);
        paramIndex++;
      }

      // Поиск по названию действия
      if (q) {
        whereClause = whereClause 
          ? `${whereClause} AND wt.action_label ILIKE $${paramIndex}` 
          : `WHERE wt.action_label ILIKE $${paramIndex}`;
        params.push(`%${q}%`);
        paramIndex++;
      }

      let orderClause = 'ORDER BY wt.sort_order ASC, wt.id ASC';
      const sortableFields = ['id', 'actionLabel', 'sortOrder', 'createdAt'];
      if (sortBy && sortableFields.includes(sortBy)) {
        orderClause = `ORDER BY wt.${toSnakeCase(sortBy)} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const offset = (page - 1) * itemsPerPage;

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${WorkflowTransitions.tableName} wt ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data with related info
      const dataQuery = `
        SELECT 
          wt.id, 
          wt.workflow_id as "workflowId",
          wt.source_status_id as "sourceStatusId",
          wt.target_status_id as "targetStatusId",
          wt.action_label as "actionLabel",
          wt.sort_order as "sortOrder",
          wt.is_active as "isActive",
          wt.created_at as "createdAt",
          w.name as "workflowName",
          ss.name as "sourceStatusName",
          ss.color as "sourceStatusColor",
          ts.name as "targetStatusName",
          ts.color as "targetStatusColor"
        FROM ${WorkflowTransitions.tableName} wt
        LEFT JOIN workflows w ON wt.workflow_id = w.id
        LEFT JOIN states ss ON wt.source_status_id = ss.id
        LEFT JOIN states ts ON wt.target_status_id = ts.id
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
          wt.id, 
          wt.workflow_id as "workflowId",
          wt.source_status_id as "sourceStatusId",
          wt.target_status_id as "targetStatusId",
          wt.action_label as "actionLabel",
          wt.sort_order as "sortOrder",
          wt.is_active as "isActive",
          wt.created_at as "createdAt",
          w.name as "workflowName",
          ss.name as "sourceStatusName",
          ss.color as "sourceStatusColor",
          ts.name as "targetStatusName",
          ts.color as "targetStatusColor"
        FROM ${WorkflowTransitions.tableName} wt
        LEFT JOIN workflows w ON wt.workflow_id = w.id
        LEFT JOIN states ss ON wt.source_status_id = ss.id
        LEFT JOIN states ts ON wt.target_status_id = ts.id
        WHERE wt.id = $1`,
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
      // Получаем максимальный sort_order для этого воркфлоу
      const maxOrderResult = await pool.query(
        `SELECT COALESCE(MAX(sort_order), 0) as max_order 
         FROM ${WorkflowTransitions.tableName} 
         WHERE workflow_id = $1`,
        [transition.workflowId]
      );
      const sortOrder = transition.sortOrder !== undefined 
        ? transition.sortOrder 
        : maxOrderResult.rows[0].max_order + 1;

      const query = `
        INSERT INTO ${WorkflowTransitions.tableName} (
          workflow_id, source_status_id, target_status_id, action_label, is_active, sort_order
        ) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING 
          id, 
          workflow_id as "workflowId",
          source_status_id as "sourceStatusId",
          target_status_id as "targetStatusId",
          action_label as "actionLabel",
          sort_order as "sortOrder",
          is_active as "isActive",
          created_at as "createdAt"
      `;
      const result = await pool.query(query, [
        transition.workflowId,
        transition.sourceStatusId || null,
        transition.targetStatusId,
        transition.actionLabel,
        transition.isActive !== undefined ? transition.isActive : true,
        sortOrder,
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

      if (transition.workflowId !== undefined) {
        updates.push(`workflow_id = $${paramIndex}`);
        values.push(transition.workflowId);
        paramIndex++;
      }

      if (transition.sourceStatusId !== undefined) {
        updates.push(`source_status_id = $${paramIndex}`);
        values.push(transition.sourceStatusId || null);
        paramIndex++;
      }

      if (transition.targetStatusId !== undefined) {
        updates.push(`target_status_id = $${paramIndex}`);
        values.push(transition.targetStatusId);
        paramIndex++;
      }

      if (transition.actionLabel !== undefined) {
        updates.push(`action_label = $${paramIndex}`);
        values.push(transition.actionLabel);
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

      if (updates.length === 0) {
        return this.getById(id);
      }

      values.push(id);

      const query = `
        UPDATE ${WorkflowTransitions.tableName} 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING 
          id, 
          workflow_id as "workflowId",
          source_status_id as "sourceStatusId",
          target_status_id as "targetStatusId",
          action_label as "actionLabel",
          sort_order as "sortOrder",
          is_active as "isActive",
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
      const result = await pool.query(
        `DELETE FROM ${WorkflowTransitions.tableName} WHERE id = $1`, 
        [id]
      );

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  // =====================================================
  // КЛЮЧЕВЫЕ МЕТОДЫ ДЛЯ ВАЛИДАЦИИ ПЕРЕХОДОВ
  // =====================================================

  /**
   * Получить доступные переходы для тикета
   * @param {number} workflowId - ID воркфлоу
   * @param {number|null} currentStatusId - Текущий статус тикета (null для нового тикета)
   * @returns {Array} Массив доступных переходов
   */
  static async getAvailableTransitions(workflowId, currentStatusId) {
    try {
      const result = await pool.query(
        `SELECT 
          wt.id,
          wt.workflow_id as "workflowId",
          wt.source_status_id as "sourceStatusId",
          wt.target_status_id as "targetStatusId",
          wt.action_label as "actionLabel",
          wt.sort_order as "sortOrder",
          ts.name as "targetStatusName",
          ts.color as "targetStatusColor"
        FROM ${WorkflowTransitions.tableName} wt
        LEFT JOIN states ts ON wt.target_status_id = ts.id
        WHERE wt.workflow_id = $1
          AND wt.is_active = true
          AND (wt.source_status_id = $2 OR ($2 IS NULL AND wt.source_status_id IS NULL))
        ORDER BY wt.sort_order ASC, wt.id ASC`,
        [workflowId, currentStatusId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error in getAvailableTransitions:', error);
      throw error;
    }
  }

  /**
   * Проверить валидность перехода
   * @param {number} workflowId - ID воркфлоу
   * @param {number|null} sourceStatusId - Исходный статус
   * @param {number} targetStatusId - Целевой статус
   * @returns {Object|null} Переход если валиден, null если нет
   */
  static async validateTransition(workflowId, sourceStatusId, targetStatusId) {
    try {
      const result = await pool.query(
        `SELECT 
          wt.id,
          wt.workflow_id as "workflowId",
          wt.source_status_id as "sourceStatusId",
          wt.target_status_id as "targetStatusId",
          wt.action_label as "actionLabel"
        FROM ${WorkflowTransitions.tableName} wt
        WHERE wt.workflow_id = $1
          AND wt.is_active = true
          AND (wt.source_status_id = $2 OR ($2 IS NULL AND wt.source_status_id IS NULL))
          AND wt.target_status_id = $3`,
        [workflowId, sourceStatusId, targetStatusId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in validateTransition:', error);
      throw error;
    }
  }

  /**
   * Получить начальный статус для воркфлоу
   * @param {number} workflowId - ID воркфлоу
   * @returns {Object|null} Начальный статус
   */
  static async getInitialTransition(workflowId) {
    try {
      const result = await pool.query(
        `SELECT 
          wt.id,
          wt.target_status_id as "targetStatusId",
          wt.action_label as "actionLabel",
          s.name as "statusName",
          s.color as "statusColor"
        FROM ${WorkflowTransitions.tableName} wt
        LEFT JOIN states s ON wt.target_status_id = s.id
        WHERE wt.workflow_id = $1
          AND wt.source_status_id IS NULL
          AND wt.is_active = true
        ORDER BY wt.sort_order ASC
        LIMIT 1`,
        [workflowId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getInitialTransition:', error);
      throw error;
    }
  }

  // Массовое создание переходов
  static async bulkCreate(transitions) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const results = [];
      for (const transition of transitions) {
        const result = await client.query(
          `INSERT INTO ${WorkflowTransitions.tableName} (
            workflow_id, source_status_id, target_status_id, action_label, is_active, sort_order
          ) 
          VALUES ($1, $2, $3, $4, $5, $6) 
          RETURNING 
            id, 
            workflow_id as "workflowId",
            source_status_id as "sourceStatusId",
            target_status_id as "targetStatusId",
            action_label as "actionLabel",
            sort_order as "sortOrder",
            is_active as "isActive"`,
          [
            transition.workflowId,
            transition.sourceStatusId || null,
            transition.targetStatusId,
            transition.actionLabel,
            transition.isActive !== undefined ? transition.isActive : true,
            transition.sortOrder || 0,
          ]
        );
        results.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in bulkCreate:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = WorkflowTransitions;
